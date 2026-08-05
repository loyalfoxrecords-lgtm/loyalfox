"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { hs } from "./styles";

type StreamerAccount = {
  id: string; name: string; streamer_name: string; email: string;
  platform: string; channel_url: string; rate_per_hour: number; active: boolean;
};
type Payment = {
  id: string; streamer_id: string; month: string; hours: number;
  rate_per_hour: number; total: number; paid: boolean; paid_at: string | null; notes: string;
};
type VOD = {
  id: string; streamer_id: string; vod_url: string; platform: string;
  stream_date: string; reported_hours: number; approved_hours: number;
  notes: string; status: string; reviewed_at: string | null;
  streamer_accounts?: { streamer_name: string };
};

const emptyForm    = { name:"", streamer_name:"", email:"", password:"", platform:"Twitch", channel_url:"", rate_per_hour:0 };
const emptyPayment = { streamer_id:"", month:"", hours:0, notes:"" };
const fmt2         = (n: number) => `$${Number(n).toFixed(2)}`;
const fmtMonthFull = (m: string) => { try { const d = new Date(m+"-02"); return d.toLocaleString("es",{month:"long",year:"numeric"}); } catch { return m; } };
const fmtDate      = (d: string) => { try { return new Date(d).toLocaleDateString("es",{day:"numeric",month:"long",year:"numeric"}); } catch { return d; } };
const currentYear  = new Date().getFullYear();

const STATUS_COLORS: Record<string,string> = {
  pending:  "#EF9F27",
  approved: "#1DB954",
  rejected: "#ff4444",
};
const STATUS_LABELS: Record<string,string> = {
  pending:  "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export default function AdminStreamerAccounts() {
  const [accounts, setAccounts]       = useState<StreamerAccount[]>([]);
  const [payments, setPayments]       = useState<Payment[]>([]);
  const [vods, setVods]               = useState<VOD[]>([]);
  const [pendingVods, setPendingVods] = useState(0);
  const [form, setForm]               = useState(emptyForm);
  const [payForm, setPayForm]         = useState(emptyPayment);
  const [loading, setLoading]         = useState(false);
  const [tab, setTab]                 = useState<"accounts"|"payments"|"add-hours"|"vods">("accounts");
  const [filterStreamer, setFilterStreamer] = useState("");
  const [vodHours, setVodHours]       = useState<Record<string,string>>({});

  const load = async () => {
    const { data: a } = await supabase
      .from("streamer_accounts").select("*")
      .order("created_at", { ascending:false });
    if (a) setAccounts(a);

    const { data: p } = await supabase
      .from("streamer_payments").select("*")
      .order("month", { ascending:false });
    if (p) setPayments(p);

    const { data: v } = await supabase
      .from("streamer_vods")
      .select("*, streamer_accounts(streamer_name)")
      .order("created_at", { ascending:false });
    if (v) {
      setVods(v);
      setPendingVods(v.filter((x:VOD) => x.status === "pending").length);
    }
  };
  useEffect(() => { load(); }, []);

  const addAccount = async () => {
    if (!form.name || !form.streamer_name || !form.email || !form.password) {
      alert("Rellena todos los campos"); return;
    }
    setLoading(true);
    const msgBuffer  = new TextEncoder().encode(form.password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2,"0")).join("");
    const { error } = await supabase.from("streamer_accounts").insert({
      name: form.name, streamer_name: form.streamer_name,
      email: form.email.toLowerCase(), password_hash: hash,
      platform: form.platform, channel_url: form.channel_url,
      rate_per_hour: form.rate_per_hour, active: true,
    });
    if (error) { alert("Error: " + error.message); }
    else { setForm(emptyForm); await load(); }
    setLoading(false);
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("streamer_accounts").update({ active: !active }).eq("id", id);
    await load();
  };

  const addHours = async () => {
    if (!payForm.streamer_id || !payForm.month || payForm.hours <= 0) {
      alert("Rellena todos los campos"); return;
    }
    setLoading(true);
    const account = accounts.find(a => a.id === payForm.streamer_id);
    if (!account) { alert("Streamer no encontrado"); setLoading(false); return; }

    const total = Number(payForm.hours) * Number(account.rate_per_hour);

    const { data: existing } = await supabase.from("streamer_payments")
      .select("id").eq("streamer_id", payForm.streamer_id).eq("month", payForm.month).single();

    if (existing) {
      await supabase.from("streamer_payments").update({
        hours: payForm.hours, rate_per_hour: account.rate_per_hour,
        total, notes: payForm.notes,
      }).eq("id", existing.id);
    } else {
      await supabase.from("streamer_payments").insert({
        streamer_id: payForm.streamer_id, month: payForm.month,
        hours: payForm.hours, rate_per_hour: account.rate_per_hour,
        total, notes: payForm.notes, paid: false,
      });
    }
    setPayForm(emptyPayment);
    await load();
    setLoading(false);
  };

  const markPaid = async (id: string) => {
    await supabase.from("streamer_payments")
      .update({ paid: true, paid_at: new Date().toISOString() }).eq("id", id);
    await load();
  };

  const deletePayment = async (id: string) => {
    if (!confirm("¿Eliminar este registro?")) return;
    await supabase.from("streamer_payments").delete().eq("id", id);
    await load();
  };

  const approveVod = async (vod: VOD) => {
    const hours = parseFloat(vodHours[vod.id] ?? String(vod.reported_hours)) || 0;
    await supabase.from("streamer_vods").update({
      status: "approved",
      approved_hours: hours,
      reviewed_at: new Date().toISOString(),
    }).eq("id", vod.id);
    await load();
  };

  const rejectVod = async (id: string) => {
    await supabase.from("streamer_vods").update({
      status: "rejected",
      reviewed_at: new Date().toISOString(),
    }).eq("id", id);
    await load();
  };

  const filteredPayments = filterStreamer
    ? payments.filter(p => {
        const acc = accounts.find(a => a.id === p.streamer_id);
        return acc?.streamer_name.toLowerCase().includes(filterStreamer.toLowerCase());
      })
    : payments;

  return (
    <div>
      <h2 style={hs.title}>Portal Streamers</h2>

      {/* Tabs */}
      <div style={{ display:"flex", gap:"4px", marginBottom:"32px", flexWrap:"wrap" }}>
        {([
          { id:"accounts",  label:`Cuentas (${accounts.length})`                                    },
          { id:"add-hours", label:"Añadir horas"                                                     },
          { id:"payments",  label:"Pagos"                                                            },
          { id:"vods",      label:`VODs${pendingVods > 0 ? ` · ${pendingVods} pendiente${pendingVods > 1 ? "s" : ""}` : ""}` },
        ] as const).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
              letterSpacing:"2px", textTransform:"uppercase", padding:"8px 20px",
              background: tab===t.id ? "rgba(57,255,20,0.08)" : "transparent",
              border: tab===t.id ? "1px solid #39ff14" : "1px solid #222",
              color: tab===t.id ? "#39ff14" : "#555", cursor:"pointer",
              position:"relative" }}>
            {t.label}
            {t.id === "vods" && pendingVods > 0 && (
              <span style={{ position:"absolute", top:"-6px", right:"-6px",
                width:"16px", height:"16px", borderRadius:"50%",
                background:"#EF9F27", display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:"9px", color:"#000",
                fontWeight:700 }}>
                {pendingVods}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* CUENTAS */}
      {tab === "accounts" && (
        <div>
          <div style={{ ...hs.form, flexDirection:"column", alignItems:"stretch" }}>
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
              letterSpacing:"2px", textTransform:"uppercase",
              color:"#39ff14", marginBottom:"4px" }}>
              Nueva cuenta de streamer
            </p>
            <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
              <input placeholder="Nombre real" value={form.name}
                onChange={(e) => setForm({...form, name:e.target.value})}
                style={{ ...hs.input, flex:1 }} />
              <input placeholder="Nombre en stream" value={form.streamer_name}
                onChange={(e) => setForm({...form, streamer_name:e.target.value})}
                style={{ ...hs.input, flex:1 }} />
              <input placeholder="Email" type="email" value={form.email}
                onChange={(e) => setForm({...form, email:e.target.value})}
                style={{ ...hs.input, flex:1 }} />
              <input placeholder="Contraseña" type="password" value={form.password}
                onChange={(e) => setForm({...form, password:e.target.value})}
                style={{ ...hs.input, flex:1 }} />
            </div>
            <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
              <select value={form.platform}
                onChange={(e) => setForm({...form, platform:e.target.value})}
                style={{ ...hs.input, width:"140px", flex:"none", appearance:"none" }}>
                <option>Twitch</option>
                <option>YouTube</option>
                <option>Kick</option>
                <option>TikTok</option>
                <option>Otro</option>
              </select>
              <input placeholder="URL del canal" value={form.channel_url}
                onChange={(e) => setForm({...form, channel_url:e.target.value})}
                style={{ ...hs.input, flex:2 }} />
              <input placeholder="Tarifa por hora ($)" type="number"
                value={form.rate_per_hour}
                onChange={(e) => setForm({...form, rate_per_hour:+e.target.value})}
                style={{ ...hs.input, width:"160px", flex:"none" }} />
            </div>
            <button onClick={addAccount} disabled={loading} style={hs.btnGreen}>
              {loading ? "Creando..." : "Crear cuenta"}
            </button>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
            {accounts.map((a) => (
              <div key={a.id} style={{ ...hs.row, opacity: a.active ? 1 : 0.4 }}>
                <div style={{ flex:1 }}>
                  <p style={hs.rowName}>{a.streamer_name}</p>
                  <p style={hs.rowSub}>
                    {a.email} · {a.platform} ·{" "}
                    <span style={{ color:"#39ff14" }}>{fmt2(a.rate_per_hour)}/h</span>
                  </p>
                </div>
                <button onClick={() => toggleActive(a.id, a.active)}
                  style={{ ...hs.btnSmall,
                    color: a.active ? "#ff4444" : "#39ff14",
                    borderColor: a.active ? "#ff4444" : "#39ff14" }}>
                  {a.active ? "Desactivar" : "Activar"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AÑADIR HORAS */}
      {tab === "add-hours" && (
        <div style={{ display:"flex", flexDirection:"column", gap:"24px", maxWidth:"600px" }}>
          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
            color:"#555", lineHeight:1.8 }}>
            Selecciona el streamer, el mes y las horas que ha streamado con música de LoyalFox.
            El sistema calculará automáticamente el pago según su tarifa acordada.
          </p>

          {/* Grid 12 meses */}
          <div>
            <p style={{ ...hs.rowSub, marginBottom:"10px" }}>Mes</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"2px" }}>
              {Array.from({ length:12 }, (_,i) => {
                const date     = new Date(currentYear, i, 1);
                const monthKey = `${currentYear}-${String(i+1).padStart(2,"0")}-01`;
                const isSelected = payForm.month === monthKey;
                const hasData    = payments.some(p => p.month === monthKey);
                return (
                  <div key={monthKey}
                    onClick={() => setPayForm({...payForm, month: isSelected ? "" : monthKey})}
                    style={{ padding:"14px", cursor:"pointer",
                      background: isSelected ? "rgba(57,255,20,0.08)" : "#0e0e0e",
                      border:`1px solid ${isSelected ? "#39ff14" : hasData ? "rgba(57,255,20,0.2)" : "#1a1a1a"}`,
                      transition:"all .2s", position:"relative" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#39ff14"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = isSelected ? "#39ff14" : hasData ? "rgba(57,255,20,0.2)" : "#1a1a1a"; }}>
                    {hasData && (
                      <div style={{ position:"absolute", top:"8px", right:"8px",
                        width:"5px", height:"5px", borderRadius:"50%",
                        background:"#39ff14", boxShadow:"0 0 4px #39ff14" }} />
                    )}
                    <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                      letterSpacing:"1px", textTransform:"uppercase",
                      color: isSelected ? "#39ff14" : "#555", marginBottom:"4px" }}>
                      {date.toLocaleString("es",{month:"short"}).toUpperCase()}
                    </p>
                    <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"16px",
                      textTransform:"capitalize",
                      color: isSelected ? "#39ff14" : hasData ? "#e8e8e8" : "#333" }}>
                      {date.toLocaleString("es",{month:"long"})}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <p style={{ ...hs.rowSub, marginBottom:"8px" }}>Streamer</p>
            <select value={payForm.streamer_id}
              onChange={(e) => setPayForm({...payForm, streamer_id:e.target.value})}
              style={{ ...hs.input, width:"100%", appearance:"none" }}>
              <option value="">Selecciona un streamer...</option>
              {accounts.filter(a=>a.active).map(a => (
                <option key={a.id} value={a.id}>
                  {a.streamer_name} — {fmt2(a.rate_per_hour)}/h
                </option>
              ))}
            </select>
          </div>

          <div>
            <p style={{ ...hs.rowSub, marginBottom:"8px" }}>Horas streameadas este mes</p>
            <input type="number" step="0.5" placeholder="ej: 12.5"
              value={payForm.hours || ""}
              onChange={(e) => setPayForm({...payForm, hours:+e.target.value})}
              style={{ ...hs.input, width:"100%" }} />
          </div>

          {/* Preview */}
          {payForm.streamer_id && payForm.hours > 0 && (() => {
            const acc = accounts.find(a => a.id === payForm.streamer_id);
            if (!acc) return null;
            const total = payForm.hours * acc.rate_per_hour;
            return (
              <div style={{ padding:"20px 24px", background:"rgba(57,255,20,0.05)",
                border:"1px solid rgba(57,255,20,0.2)" }}>
                <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                  letterSpacing:"2px", textTransform:"uppercase",
                  color:"#39ff14", marginBottom:"12px" }}>
                  Preview del pago
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"16px" }}>
                  {[
                    { label:"Horas",  value:`${payForm.hours}h`       },
                    { label:"Tarifa", value:`${fmt2(acc.rate_per_hour)}/h` },
                    { label:"Total",  value:fmt2(total)                },
                  ].map((item) => (
                    <div key={item.label}>
                      <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"8px",
                        letterSpacing:"2px", textTransform:"uppercase",
                        color:"#555", marginBottom:"4px" }}>{item.label}</p>
                      <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"24px",
                        lineHeight:1, color:"#39ff14" }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div>
            <p style={{ ...hs.rowSub, marginBottom:"8px" }}>Notas (opcional)</p>
            <textarea placeholder="Observaciones sobre este mes..."
              value={payForm.notes}
              onChange={(e) => setPayForm({...payForm, notes:e.target.value})}
              style={{ ...hs.input, resize:"vertical", minHeight:"60px", width:"100%" }} />
          </div>

          <button onClick={addHours} disabled={loading} style={hs.btnGreen}>
            {loading ? "Guardando..." : "Guardar horas"}
          </button>
        </div>
      )}

      {/* PAGOS */}
      {tab === "payments" && (
        <div>
          <div style={{ marginBottom:"20px" }}>
            <input placeholder="Filtrar por streamer..." value={filterStreamer}
              onChange={(e) => setFilterStreamer(e.target.value)}
              style={{ ...hs.input, width:"300px" }} />
          </div>
          {filteredPayments.length === 0 ? (
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
              color:"#333", padding:"40px 0", textAlign:"center", letterSpacing:"2px" }}>
              Sin pagos registrados
            </p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
              <div style={{ display:"grid",
                gridTemplateColumns:"1fr 130px 80px 100px 110px 120px 80px",
                gap:"12px", padding:"10px 16px" }}>
                {["Streamer","Mes","Horas","Tarifa/h","Total","Estado",""].map((h,i) => (
                  <span key={i} style={{ fontFamily:"'Share Tech Mono',monospace",
                    fontSize:"9px", letterSpacing:"2px",
                    textTransform:"uppercase", color:"#333" }}>{h}</span>
                ))}
              </div>
              {filteredPayments.map((p,i) => {
                const acc = accounts.find(a => a.id === p.streamer_id);
                return (
                  <div key={p.id} style={{ display:"grid",
                    gridTemplateColumns:"1fr 130px 80px 100px 110px 120px 80px",
                    gap:"12px", padding:"14px 16px",
                    background: i%2===0 ? "#0e0e0e" : "#111", alignItems:"center" }}>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"12px", color:"#39ff14" }}>
                      {acc?.streamer_name || "—"}
                    </span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"11px", color:"#555", textTransform:"capitalize" }}>
                      {fmtMonthFull(p.month.slice(0,7))}
                    </span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"12px", color:"#e8e8e8" }}>
                      {Number(p.hours).toFixed(1)}h
                    </span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"11px", color:"#555" }}>
                      {fmt2(p.rate_per_hour)}
                    </span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"13px", color:"#39ff14", fontWeight:700 }}>
                      {fmt2(p.total)}
                    </span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                      letterSpacing:"1px", textTransform:"uppercase", padding:"3px 8px",
                      background: p.paid ? "rgba(29,185,84,0.1)" : "rgba(255,92,26,0.08)",
                      color: p.paid ? "#1DB954" : "#ff5c1a",
                      border:`1px solid ${p.paid ? "#1DB95444" : "#ff5c1a33"}` }}>
                      {p.paid ? "Pagado" : "Pendiente"}
                    </span>
                    <div style={{ display:"flex", gap:"4px" }}>
                      {!p.paid && (
                        <button onClick={() => markPaid(p.id)}
                          style={{ ...hs.btnSmall, color:"#1DB954",
                            borderColor:"#1DB954", padding:"4px 8px" }}>
                          ✓
                        </button>
                      )}
                      <button onClick={() => deletePayment(p.id)}
                        style={{ ...hs.btnSmall, color:"#ff4444",
                          borderColor:"#ff4444", padding:"4px 8px" }}>
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VODs */}
      {tab === "vods" && (
        <div>
          {vods.length === 0 ? (
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
              color:"#333", padding:"40px 0", textAlign:"center", letterSpacing:"2px" }}>
              Sin VODs enviados aún
            </p>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>

              {/* Pendientes primero */}
              {vods.filter(v => v.status === "pending").length > 0 && (
                <div style={{ marginBottom:"8px" }}>
                  <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                    letterSpacing:"3px", textTransform:"uppercase",
                    color:"#EF9F27", marginBottom:"12px", padding:"0 4px" }}>
                    ⚠ Pendientes de revisión ({vods.filter(v => v.status === "pending").length})
                  </p>
                  {vods.filter(v => v.status === "pending").map((v,i) => (
                    <div key={v.id} style={{ padding:"20px",
                      marginBottom:"2px",
                      background: i%2===0 ? "#0e0e0e" : "#111",
                      borderLeft:"2px solid #EF9F27" }}>
                      <div style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"flex-start", marginBottom:"12px",
                        flexWrap:"wrap", gap:"12px" }}>
                        <div>
                          <p style={{ fontFamily:"'Share Tech Mono',monospace",
                            fontSize:"13px", color:"#39ff14", marginBottom:"4px" }}>
                            {v.streamer_accounts?.streamer_name || "—"}
                          </p>
                          <p style={{ fontFamily:"'Share Tech Mono',monospace",
                            fontSize:"9px", color:"#555" }}>
                            {fmtDate(v.stream_date)} · {v.platform}
                          </p>
                        </div>
                        <span style={{ fontFamily:"'Share Tech Mono',monospace",
                          fontSize:"9px", letterSpacing:"1px",
                          textTransform:"uppercase", padding:"4px 10px",
                          background:"rgba(239,159,39,0.1)", color:"#EF9F27",
                          border:"1px solid #EF9F2744" }}>
                          En revisión
                        </span>
                      </div>

                      <a href={v.vod_url} target="_blank" rel="noreferrer"
                        style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                          color:"#39ff14", display:"block", marginBottom:"16px",
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        🔗 {v.vod_url}
                      </a>

                      <div style={{ display:"flex", gap:"20px",
                        alignItems:"flex-end", flexWrap:"wrap" }}>
                        <div>
                          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"8px",
                            letterSpacing:"2px", textTransform:"uppercase",
                            color:"#444", marginBottom:"4px" }}>
                            Horas reportadas
                          </p>
                          <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px",
                            lineHeight:1, color:"#888" }}>
                            {Number(v.reported_hours).toFixed(1)}h
                          </p>
                        </div>

                        <div style={{ flex:1, minWidth:"180px" }}>
                          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"8px",
                            letterSpacing:"2px", textTransform:"uppercase",
                            color:"#444", marginBottom:"4px" }}>
                            Horas a aprobar
                          </p>
                          <input
                            type="number" step="0.5" min="0"
                            placeholder={String(v.reported_hours)}
                            value={vodHours[v.id] ?? String(v.reported_hours)}
                            onChange={(e) => setVodHours(prev => ({...prev, [v.id]:e.target.value}))}
                            style={{ ...hs.input, width:"120px" }} />
                        </div>

                        <div style={{ display:"flex", gap:"8px" }}>
                          <button onClick={() => approveVod(v)}
                            style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                              letterSpacing:"2px", textTransform:"uppercase",
                              padding:"10px 20px", background:"rgba(29,185,84,0.1)",
                              border:"1px solid #1DB954", color:"#1DB954",
                              cursor:"pointer", transition:"all .2s" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(29,185,84,0.2)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(29,185,84,0.1)"; }}>
                            ✓ Aprobar
                          </button>
                          <button onClick={() => rejectVod(v.id)}
                            style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                              letterSpacing:"2px", textTransform:"uppercase",
                              padding:"10px 20px", background:"rgba(255,68,68,0.08)",
                              border:"1px solid #ff444444", color:"#ff4444",
                              cursor:"pointer", transition:"all .2s" }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,68,68,0.15)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,68,68,0.08)"; }}>
                            ✕ Rechazar
                          </button>
                        </div>
                      </div>

                      {v.notes && (
                        <div style={{ marginTop:"12px", padding:"10px 14px",
                          background:"rgba(255,255,255,0.02)",
                          border:"1px solid rgba(255,255,255,0.05)" }}>
                          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                            letterSpacing:"2px", textTransform:"uppercase",
                            color:"#444", marginBottom:"4px" }}>Notas del streamer</p>
                          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                            color:"#555", lineHeight:1.6 }}>{v.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Revisados */}
              {vods.filter(v => v.status !== "pending").length > 0 && (
                <div>
                  <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                    letterSpacing:"3px", textTransform:"uppercase",
                    color:"#333", marginBottom:"12px", padding:"8px 4px 0" }}>
                    Historial revisados
                  </p>
                  {vods.filter(v => v.status !== "pending").map((v,i) => (
                    <div key={v.id} style={{ padding:"16px",
                      marginBottom:"2px",
                      background: i%2===0 ? "#0e0e0e" : "#111",
                      borderLeft:`2px solid ${STATUS_COLORS[v.status]}44` }}>
                      <div style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"center", flexWrap:"wrap", gap:"12px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
                          <div>
                            <p style={{ fontFamily:"'Share Tech Mono',monospace",
                              fontSize:"12px", color:"#39ff14", marginBottom:"2px" }}>
                              {v.streamer_accounts?.streamer_name || "—"}
                            </p>
                            <p style={{ fontFamily:"'Share Tech Mono',monospace",
                              fontSize:"9px", color:"#555" }}>
                              {fmtDate(v.stream_date)} · {v.platform}
                            </p>
                          </div>
                          <a href={v.vod_url} target="_blank" rel="noreferrer"
                            style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                              color:"rgba(57,255,20,0.5)", maxWidth:"200px",
                              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            Ver VOD ↗
                          </a>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
                          <div style={{ textAlign:"right" }}>
                            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"8px",
                              letterSpacing:"1px", textTransform:"uppercase",
                              color:"#444", marginBottom:"2px" }}>
                              {v.status === "approved" ? "Aprobadas" : "Reportadas"}
                            </p>
                            <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px",
                              lineHeight:1,
                              color: v.status === "approved" ? "#1DB954" : "#ff4444" }}>
                              {v.status === "approved"
                                ? `${Number(v.approved_hours).toFixed(1)}h`
                                : `${Number(v.reported_hours).toFixed(1)}h`}
                            </p>
                          </div>
                          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                            letterSpacing:"1px", textTransform:"uppercase",
                            padding:"4px 10px",
                            background:`rgba(${v.status === "approved" ? "29,185,84" : "255,68,68"},0.1)`,
                            color: STATUS_COLORS[v.status],
                            border:`1px solid ${STATUS_COLORS[v.status]}44` }}>
                            {STATUS_LABELS[v.status]}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}