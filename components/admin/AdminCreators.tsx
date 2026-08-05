"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { hs } from "./styles";
import Papa from "papaparse";

type Creator = {
  id: string; name: string; email: string; channel_name: string;
  channel_url: string; channel_id: string; active: boolean; role: string;
};
type Royalty = {
  id: string; creator_id: string; month: string; total_streams: number;
  gross_revenue: number; creator_share: number; paid: boolean;
  paid_at: string | null; notes: string;
};

const emptyCreator = {
  name:"", email:"", password:"", channel_name:"", channel_url:"", channel_id:""
};

export default function AdminCreators() {
  const [creators, setCreators]   = useState<Creator[]>([]);
  const [royalties, setRoyalties] = useState<Royalty[]>([]);
  const [form, setForm]           = useState(emptyCreator);
  const [loading, setLoading]     = useState(false);
  const [tab, setTab]             = useState<"creators"|"royalties"|"csv">("creators");
  const [selectedCreator, setSelectedCreator] = useState<string>("");
  const [csvMonth, setCsvMonth]   = useState("");
  const [csvStatus, setCsvStatus] = useState("");

  const load = async () => {
    const { data: c } = await supabase.from("creators").select("*").order("created_at", { ascending:false });
    if (c) setCreators(c);
    const { data: r } = await supabase.from("creator_royalties").select("*").order("month", { ascending:false });
    if (r) setRoyalties(r);
  };
  useEffect(() => { load(); }, []);

  const addCreator = async () => {
    if (!form.name || !form.email || !form.password) {
      alert("Rellena nombre, email y contraseña");
      return;
    }
    setLoading(true);
    const msgBuffer  = new TextEncoder().encode(form.password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0")).join("");

    const { error } = await supabase.from("creators").insert({
      name:         form.name,
      email:        form.email.toLowerCase(),
      password_hash: hash,
      channel_name: form.channel_name,
      channel_url:  form.channel_url,
      channel_id:   form.channel_id.trim(),
      active:       true,
      role:         "creator",
    });

    if (error) {
      alert("Error al crear: " + error.message);
    } else {
      setForm(emptyCreator);
      await load();
    }
    setLoading(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("creators").update({ active: !active }).eq("id", id);
    await load();
  };

  const markPaid = async (id: string) => {
    await supabase.from("creator_royalties")
      .update({ paid: true, paid_at: new Date().toISOString() })
      .eq("id", id);
    await load();
  };

  const processCSV = (file: File) => {
    if (!csvMonth) {
      setCsvStatus("⚠ Introduce el mes primero (formato YYYY-MM-01)");
      return;
    }
    setCsvStatus("Procesando...");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const rows = result.data as Record<string, string>[];

        // Filtra solo filas de YouTube con Channel ID
        const youtubeRows = rows.filter((r) =>
          (r["Store"] || "").toLowerCase().includes("youtube") &&
          (r["Channel ID"] || "").trim() !== ""
        );

        if (youtubeRows.length === 0) {
          setCsvStatus("⚠ No se encontraron filas de YouTube con Channel ID en el CSV");
          return;
        }

        // Agrupa por Channel ID
        const channelMap: Record<string, {
          streams: number; revenue: number;
          tracks: Record<string, { streams: number; revenue: number; artist: string }>;
        }> = {};

        youtubeRows.forEach((r) => {
          const channelId = (r["Channel ID"] || "").trim();
          const qty    = parseInt(r["Quantity"] || "0");
          const rev    = parseFloat(r["Recipient Net Royalty ($ USD)"] || "0");
          const track  = (r["Title"]  || "Unknown").trim();
          const artist = (r["Artist"] || "Unknown").trim();

          if (!channelMap[channelId]) channelMap[channelId] = { streams:0, revenue:0, tracks:{} };
          channelMap[channelId].streams += qty;
          channelMap[channelId].revenue += rev;
          if (!channelMap[channelId].tracks[track])
            channelMap[channelId].tracks[track] = { streams:0, revenue:0, artist };
          channelMap[channelId].tracks[track].streams += qty;
          channelMap[channelId].tracks[track].revenue += rev;
        });

        let processed = 0;
        let skipped   = 0;
        const unknownChannels: string[] = [];

        for (const [channelId, data] of Object.entries(channelMap)) {
          const creator = creators.find((c) => c.channel_id === channelId);

          if (!creator) {
            unknownChannels.push(channelId);
            skipped++;
            continue;
          }

          const creatorShare = data.revenue * 0.5;

          // Upsert royalty row
          const { data: existing } = await supabase
            .from("creator_royalties").select("id")
            .eq("creator_id", creator.id).eq("month", csvMonth).single();

          if (existing) {
            await supabase.from("creator_royalties").update({
              total_streams: data.streams,
              gross_revenue: data.revenue,
              creator_share: creatorShare,
            }).eq("id", existing.id);
            await supabase.from("creator_tracks").delete()
              .eq("creator_id", creator.id).eq("month", csvMonth);
          } else {
            await supabase.from("creator_royalties").insert({
              creator_id:    creator.id,
              month:         csvMonth,
              total_streams: data.streams,
              gross_revenue: data.revenue,
              creator_share: creatorShare,
            });
          }

          // Insert tracks
          const trackRows = Object.entries(data.tracks).map(([name, v]) => ({
            creator_id: creator.id,
            month:      csvMonth,
            track_name: name,
            artist:     v.artist,
            streams:    v.streams,
            revenue:    v.revenue,
          }));
          if (trackRows.length > 0) await supabase.from("creator_tracks").insert(trackRows);
          processed++;
        }

        await load();
        setCsvStatus(
          `✓ Procesado: ${processed} creador(es) actualizados · ${youtubeRows.length} filas de YouTube` +
          (skipped > 0
            ? ` · ${skipped} canal(es) sin creador asignado: ${unknownChannels.slice(0,3).join(", ")}${unknownChannels.length > 3 ? "..." : ""}`
            : "")
        );
      },
    });
  };

  const creatorRoyalties = selectedCreator
    ? royalties.filter((r) => r.creator_id === selectedCreator)
    : royalties;

  return (
    <div>
      <h2 style={hs.title}>Portal Creadores</h2>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"4px", marginBottom:"32px" }}>
        {(["creators","royalties","csv"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
              letterSpacing:"2px", textTransform:"uppercase", padding:"8px 20px",
              background: tab === t ? "rgba(57,255,20,0.08)" : "transparent",
              border: tab === t ? "1px solid #39ff14" : "1px solid #222",
              color: tab === t ? "#39ff14" : "#555", cursor:"pointer",
            }}>
            {t === "creators" ? `Creadores (${creators.length})` : t === "royalties" ? "Regalías" : "Subir CSV"}
          </button>
        ))}
      </div>

      {/* ── CREADORES ── */}
      {tab === "creators" && (
        <div>
          <div style={{ ...hs.form, flexDirection:"column", alignItems:"stretch" }}>
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
              letterSpacing:"2px", textTransform:"uppercase", color:"#39ff14", marginBottom:"4px" }}>
              Nuevo creador
            </p>
            <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
              <input placeholder="Nombre" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ ...hs.input, flex:1 }} />
              <input placeholder="Email" type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ ...hs.input, flex:1 }} />
              <input placeholder="Contraseña inicial" type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ ...hs.input, flex:1 }} />
            </div>
            <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
              <input placeholder="Nombre del canal YouTube" value={form.channel_name}
                onChange={(e) => setForm({ ...form, channel_name: e.target.value })}
                style={{ ...hs.input, flex:1 }} />
              <input placeholder="URL del canal" value={form.channel_url}
                onChange={(e) => setForm({ ...form, channel_url: e.target.value })}
                style={{ ...hs.input, flex:1 }} />
              <input placeholder="Channel ID (ej: 4dbKX0VMqqIiMSB0H3LnaA)" value={form.channel_id}
                onChange={(e) => setForm({ ...form, channel_id: e.target.value.trim() })}
                style={{ ...hs.input, flex:2 }} />
            </div>
            <div style={{ padding:"12px 16px", background:"#080808", border:"1px solid #1a1a1a" }}>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                color:"#555", lineHeight:1.8, letterSpacing:"1px" }}>
                El Channel ID lo encuentras en el CSV de Label Engine, columna "Channel ID".
                Es la cadena larga como <span style={{ color:"#39ff14" }}>4dbKX0VMqqIiMSB0H3LnaA</span>
              </p>
            </div>
            <button onClick={addCreator} disabled={loading} style={hs.btnGreen}>
              {loading ? "Creando..." : "Crear cuenta"}
            </button>
          </div>

          {/* List */}
          <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
            {creators.length === 0 && (
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                color:"#333", padding:"40px 0", textAlign:"center", letterSpacing:"2px" }}>
                Sin creadores aún
              </p>
            )}
            {creators.map((c) => (
              <div key={c.id} style={{ ...hs.row, opacity: c.active ? 1 : 0.4 }}>
                <div style={{ flex:1 }}>
                  <p style={hs.rowName}>{c.name}</p>
                  <p style={hs.rowSub}>{c.email} · {c.channel_name || "Sin canal"}</p>
                  {c.channel_id && (
                    <p style={{ ...hs.rowSub, color:"#39ff14", marginTop:"2px", opacity:0.6 }}>
                      ID: {c.channel_id}
                    </p>
                  )}
                </div>
                <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                    letterSpacing:"1px", textTransform:"uppercase",
                    color: c.role === "superadmin" ? "#39ff14" : "#333",
                    padding:"3px 8px", border:"1px solid",
                    borderColor: c.role === "superadmin" ? "rgba(57,255,20,0.3)" : "#222" }}>
                    {c.role || "creator"}
                  </span>
                  <button onClick={() => toggleActive(c.id, c.active)}
                    style={{ ...hs.btnSmall,
                      color: c.active ? "#ff4444" : "#39ff14",
                      borderColor: c.active ? "#ff4444" : "#39ff14" }}>
                    {c.active ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── REGALÍAS ── */}
      {tab === "royalties" && (
        <div>
          <div style={{ marginBottom:"20px" }}>
            <select value={selectedCreator}
              onChange={(e) => setSelectedCreator(e.target.value)}
              style={{ ...hs.input, width:"300px", appearance:"none" }}>
              <option value="">Todos los creadores</option>
              {creators.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {creatorRoyalties.length === 0 ? (
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
              color:"#333", padding:"40px 0", textAlign:"center", letterSpacing:"2px" }}>
              Sin regalías registradas
            </p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
              <div style={{ display:"grid",
                gridTemplateColumns:"1fr 140px 120px 130px 110px 120px",
                gap:"16px", padding:"10px 16px" }}>
                {["Creador","Mes","Bruto","Su parte (50%)","Estado",""].map((h) => (
                  <span key={h} style={{ fontFamily:"'Share Tech Mono',monospace",
                    fontSize:"9px", letterSpacing:"2px", textTransform:"uppercase", color:"#333" }}>
                    {h}
                  </span>
                ))}
              </div>
              {creatorRoyalties.map((r) => {
                const creator = creators.find((c) => c.id === r.creator_id);
                return (
                  <div key={r.id} style={{ display:"grid",
                    gridTemplateColumns:"1fr 140px 120px 130px 110px 120px",
                    gap:"16px", padding:"14px 16px", background:"#0e0e0e", alignItems:"center" }}>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"12px", color:"#e8e8e8" }}>{creator?.name || "—"}</span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"11px", color:"#555" }}>{r.month}</span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"11px", color:"#555" }}>${Number(r.gross_revenue).toFixed(4)}</span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"13px", color:"#39ff14", fontWeight:700 }}>
                      ${Number(r.creator_share).toFixed(4)}
                    </span>
                    <span style={{
                      fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                      letterSpacing:"1px", textTransform:"uppercase",
                      padding:"4px 10px", textAlign:"center",
                      background: r.paid ? "rgba(29,185,84,0.1)" : "rgba(255,92,26,0.1)",
                      color: r.paid ? "#1DB954" : "#ff5c1a",
                      border:`1px solid ${r.paid ? "#1DB95444" : "#ff5c1a44"}`,
                    }}>
                      {r.paid ? "Pagado" : "Pendiente"}
                    </span>
                    {!r.paid ? (
                      <button onClick={() => markPaid(r.id)}
                        style={{ ...hs.btnSmall, color:"#1DB954", borderColor:"#1DB954" }}>
                        Marcar pagado
                      </button>
                    ) : (
                      <span style={{ fontFamily:"'Share Tech Mono',monospace",
                        fontSize:"10px", color:"#333" }}>
                        {r.paid_at ? new Date(r.paid_at).toLocaleDateString("es") : "—"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── CSV ── */}
      {tab === "csv" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"20px", maxWidth:"600px" }}>
          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
            color:"#555", lineHeight:1.8 }}>
            Sube el CSV de Label Engine. El sistema detectará automáticamente a qué creador
            pertenece cada reproducción por su Channel ID de YouTube.
          </p>

          <div>
            <p style={{ ...hs.rowSub, marginBottom:"8px" }}>Mes (formato YYYY-MM-01)</p>
            <input type="text" placeholder="2025-06-01" value={csvMonth}
              onChange={(e) => setCsvMonth(e.target.value)}
              style={{ ...hs.input, width:"100%" }} />
          </div>

          <label
            style={{ display:"flex", flexDirection:"column", alignItems:"center",
              justifyContent:"center", padding:"40px",
              border:"2px dashed #222", background:"#0e0e0e",
              cursor:"pointer", transition:"border-color .2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#39ff14")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#222")}>
            <span style={{ fontSize:"28px", marginBottom:"12px" }}>📄</span>
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
              color:"#555", letterSpacing:"1px" }}>
              Clic para subir CSV de Label Engine
            </p>
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
              color:"#333", marginTop:"4px" }}>
              Las regalías se asignan automáticamente por Channel ID
            </p>
            <input type="file" accept=".csv" style={{ display:"none" }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processCSV(f); }} />
          </label>

          {csvStatus && (
            <div style={{ padding:"16px 20px",
              background: csvStatus.startsWith("✓") ? "rgba(29,185,84,0.08)" : "rgba(255,92,26,0.08)",
              border:`1px solid ${csvStatus.startsWith("✓") ? "#1DB95444" : "#ff5c1a44"}` }}>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                color: csvStatus.startsWith("✓") ? "#1DB954" : "#ff5c1a",
                lineHeight:1.6 }}>{csvStatus}</p>
            </div>
          )}

          {/* Channel IDs registrados */}
          <div style={{ padding:"16px 20px", background:"#0e0e0e", border:"1px solid #1a1a1a" }}>
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
              letterSpacing:"2px", textTransform:"uppercase", color:"#39ff14", marginBottom:"12px" }}>
              Channel IDs registrados
            </p>
            {creators.filter((c) => c.channel_id).length === 0 ? (
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px", color:"#333" }}>
                Ningún creador tiene Channel ID asignado aún
              </p>
            ) : (
              creators.filter((c) => c.channel_id).map((c) => (
                <div key={c.id} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"8px 0", borderBottom:"1px solid #161616" }}>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace",
                    fontSize:"12px", color:"#e8e8e8" }}>{c.name}</span>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace",
                    fontSize:"10px", color:"#555" }}>{c.channel_id}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}