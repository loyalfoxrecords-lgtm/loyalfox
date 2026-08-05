"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Payment = {
  id: string; month: string; hours: number;
  rate_per_hour: number; total: number;
  paid: boolean; paid_at: string | null; notes: string;
};
type VOD = {
  id: string; vod_url: string; platform: string;
  stream_date: string; reported_hours: number;
  approved_hours: number; notes: string;
  status: string; created_at: string;
};

const GREEN        = "#a8e63d";
const fmt2         = (n: number) => `$${Number(n).toFixed(2)}`;
const fmtMonthFull = (m: string) => { try { const d = new Date(m+"-02"); return d.toLocaleString("es",{month:"long",year:"numeric"}); } catch { return m; } };
const fmtDate      = (d: string) => { try { return new Date(d).toLocaleDateString("es",{day:"numeric",month:"long",year:"numeric"}); } catch { return d; } };

const STATUS_COLORS: Record<string, string> = {
  pending:  "#EF9F27",
  approved: "#1DB954",
  rejected: "#ff4444",
};
const STATUS_LABELS: Record<string, string> = {
  pending:  "En revisión",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export default function StreamerDashboard() {
  const router = useRouter();
  const [name, setName]                 = useState("");
  const [streamerName, setStreamerName] = useState("");
  const [streamerId, setStreamerId]     = useState("");
  const [ratePerHour, setRatePerHour]   = useState(0);
  const [platform, setPlatform]         = useState("");
  const [channelUrl, setChannelUrl]     = useState("");
  const [overlayToken, setOverlayToken] = useState("");
  const [payments, setPayments]         = useState<Payment[]>([]);
  const [vods, setVods]                 = useState<VOD[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<"overview"|"vods"|"overlay"|"payments">("overview");
  const [copied, setCopied]             = useState(false);

  // VOD form
  const [vodForm, setVodForm] = useState({
    vod_url: "", platform: "Twitch", stream_date: "", reported_hours: "", notes: ""
  });
  const [vodStatus, setVodStatus] = useState("");
  const [vodLoading, setVodLoading] = useState(false);

  useEffect(() => {
    fetch("/api/streamers-portal/me")
      .then((r) => { if (!r.ok) router.push("/streamers-portal/login"); return r.json(); })
      .then((data) => {
        setName(data.name); setStreamerName(data.streamer_name);
        setRatePerHour(data.rate_per_hour); setPlatform(data.platform);
        setChannelUrl(data.channel_url); setOverlayToken(data.overlay_token || "");
        setPayments(data.payments || []); setVods(data.vods || []);
        setLoading(false);
      })
      .catch(() => router.push("/streamers-portal/login"));
  }, [router]);

  const logout = async () => {
    await fetch("/api/streamers-portal/logout", { method:"POST" });
    router.push("/streamers-portal/login");
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(`https://loyalfoxrecords.com/overlay/${overlayToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitVod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vodForm.vod_url || !vodForm.stream_date || !vodForm.reported_hours) {
      setVodStatus("⚠ Rellena todos los campos obligatorios");
      return;
    }
    setVodLoading(true);
    setVodStatus("");

    // Obtenemos el streamer_id desde Supabase
    const { data: account } = await supabase
      .from("streamer_accounts")
      .select("id")
      .eq("overlay_token", overlayToken)
      .single();

    if (!account) { setVodStatus("⚠ Error al obtener tu cuenta"); setVodLoading(false); return; }

    const { error } = await supabase.from("streamer_vods").insert({
      streamer_id:    account.id,
      vod_url:        vodForm.vod_url,
      platform:       vodForm.platform,
      stream_date:    vodForm.stream_date,
      reported_hours: parseFloat(vodForm.reported_hours),
      notes:          vodForm.notes,
      status:         "pending",
    });

    if (error) {
      setVodStatus("⚠ Error al enviar el VOD. Inténtalo de nuevo.");
    } else {
      setVodStatus("✓ VOD enviado correctamente. Lo revisaremos pronto.");
      setVodForm({ vod_url:"", platform:"Twitch", stream_date:"", reported_hours:"", notes:"" });
      // Recargar VODs
      const { data: newVods } = await supabase
        .from("streamer_vods").select("*")
        .eq("streamer_id", account.id)
        .order("created_at", { ascending:false });
      if (newVods) setVods(newVods);
    }
    setVodLoading(false);
  };

  const totalHours   = payments.reduce((a,p) => a + Number(p.hours), 0);
  const totalEarned  = payments.reduce((a,p) => a + Number(p.total), 0);
  const totalPaid    = payments.filter(p=>p.paid).reduce((a,p) => a + Number(p.total), 0);
  const totalPending = payments.filter(p=>!p.paid).reduce((a,p) => a + Number(p.total), 0);
  const pendingVods  = vods.filter(v => v.status === "pending").length;

  const threshold   = 20;
  const canReceive  = totalPending >= threshold;
  const progressPct = Math.max(Math.min((totalPending/threshold)*100, 100), 3);
  const now         = new Date();
  const nextPaymentMonths = [0, 3, 6, 9];
  const nextMonth   = nextPaymentMonths.find(m => m > now.getMonth()) ?? 0;
  const nextYear    = nextMonth === 0 ? now.getFullYear() + 1 : now.getFullYear();
  const nextLabel   = new Date(nextYear, nextMonth, 1).toLocaleString("es", { month:"long", year:"numeric" });

  const inp: React.CSSProperties = {
    width:"100%", padding:"14px 16px", background:"#0d0d0d",
    border:"1px solid rgba(255,255,255,0.08)", color:"#f0f0f0",
    fontSize:"13px", fontFamily:"'Share Tech Mono',monospace",
    outline:"none", transition:"border-color .2s",
    letterSpacing:"0.5px",
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", background:"#080808" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:"40px", height:"40px", borderRadius:"50%",
          border:"2px solid #1a1a1a", borderTopColor:GREEN,
          margin:"0 auto 16px", animation:"spin 1s linear infinite" }} />
        <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
          color:"#555", letterSpacing:"4px" }}>CARGANDO...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#080808", color:"#f0f0f0" }}>

      {/* Nav */}
      <nav style={{ padding:"0 48px", height:"64px", display:"flex",
        alignItems:"center", justifyContent:"space-between",
        borderBottom:"1px solid rgba(255,255,255,0.06)",
        background:"rgba(8,8,8,0.97)", position:"sticky", top:0,
        zIndex:100, backdropFilter:"blur(10px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", letterSpacing:"4px" }}>
            LOYAL<span style={{ color:GREEN }}>FOX</span>
          </span>
          <span style={{ width:"1px", height:"16px", background:"#222" }} />
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
            letterSpacing:"2px", textTransform:"uppercase", color:"#444" }}>
            Portal de streamers
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"20px" }}>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"16px",
              letterSpacing:"2px", color:"#f0f0f0" }}>{streamerName}</p>
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
              color:"#555", letterSpacing:"1px" }}>{platform}</p>
          </div>
          <button onClick={logout}
            style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
              letterSpacing:"2px", textTransform:"uppercase", padding:"8px 16px",
              background:"transparent", border:"1px solid #222",
              color:"#555", cursor:"pointer", transition:"all .2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#ff4444"; (e.currentTarget as HTMLElement).style.color = "#ff4444"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#222"; (e.currentTarget as HTMLElement).style.color = "#555"; }}>
            Salir
          </button>
        </div>
      </nav>

      <div style={{ padding:"48px" }}>

        {/* Hero */}
        <div style={{ marginBottom:"48px", paddingBottom:"48px",
          borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
            letterSpacing:"3px", textTransform:"uppercase", color:GREEN,
            opacity:0.7, marginBottom:"8px" }}>Bienvenido de nuevo</p>
          <h1 style={{ fontFamily:"'Bebas Neue',sans-serif",
            fontSize:"clamp(40px,6vw,72px)", letterSpacing:"2px",
            marginBottom:"4px", lineHeight:1 }}>{streamerName}</h1>
          <div style={{ display:"flex", alignItems:"center", gap:"16px", flexWrap:"wrap" }}>
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
              color:"#444", letterSpacing:"1px" }}>
              LoyalFox Records · {fmt2(ratePerHour)}/hora
            </p>
            {channelUrl && (
              <a href={channelUrl} target="_blank" rel="noreferrer"
                style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                  color:GREEN, letterSpacing:"1px", textDecoration:"none" }}>
                Ver canal ↗
              </a>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)",
          gap:"2px", marginBottom:"48px" }}>
          {[
            { label:"Horas totales",      value:`${totalHours.toFixed(1)}h`, sub:"Aprobadas",      accent:false },
            { label:"Ingresos totales",   value:fmt2(totalEarned),           sub:"Acumulado",      accent:true  },
            { label:"Ya cobrado",         value:fmt2(totalPaid),             sub:"Transferido",    accent:false },
            { label:"Pendiente de cobro", value:fmt2(totalPending),          sub:"Próximo pago",   accent:true  },
          ].map((k,i) => (
            <div key={i} style={{ padding:"24px 28px", background:"#0d0d0d",
              borderLeft:`2px solid ${k.accent ? GREEN : "#1a1a1a"}`,
              position:"relative", overflow:"hidden" }}>
              {k.accent && (
                <div style={{ position:"absolute", top:0, right:0, bottom:0, width:"40%",
                  background:`radial-gradient(ellipse at right, rgba(168,230,61,0.04), transparent)` }} />
              )}
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                letterSpacing:"2px", textTransform:"uppercase",
                color: k.accent ? GREEN : "#555", marginBottom:"10px" }}>{k.label}</p>
              <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"32px",
                lineHeight:1, color:"#f0f0f0", marginBottom:"4px" }}>{k.value}</p>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                color:"#333" }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:"2px", marginBottom:"40px",
          borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
          {([
            { id:"overview", label:"Resumen"   },
            { id:"vods",     label:`Enviar VOD${pendingVods > 0 ? ` (${pendingVods})` : ""}` },
            { id:"overlay",  label:"Overlay OBS" },
            { id:"payments", label:"Pagos"      },
          ] as const).map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                letterSpacing:"2px", textTransform:"uppercase",
                padding:"12px 24px", background:"transparent", border:"none",
                borderBottom: activeTab === t.id ? `2px solid ${GREEN}` : "2px solid transparent",
                color: activeTab === t.id ? GREEN : "#555",
                cursor:"pointer", transition:"all .2s", marginBottom:"-1px" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"32px" }}>
            <div style={{ padding:"28px", background:"#0d0d0d",
              border:"1px solid rgba(168,230,61,0.1)",
              display:"flex", alignItems:"center", gap:"32px", flexWrap:"wrap" }}>
              <div>
                <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                  letterSpacing:"3px", textTransform:"uppercase", color:GREEN, marginBottom:"8px" }}>
                  Tu tarifa acordada
                </p>
                <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"48px",
                  lineHeight:1, color:"#f0f0f0" }}>
                  {fmt2(ratePerHour)}<span style={{ fontSize:"24px", color:"#555" }}>/hora</span>
                </p>
              </div>
              <div style={{ flex:1, borderLeft:"1px solid #1a1a1a", paddingLeft:"32px" }}>
                <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                  color:"#555", lineHeight:1.8 }}>
                  Cada vez que termines un stream con música de LoyalFox Records,
                  envíanos el VOD desde la pestaña <span style={{ color:GREEN }}>"Enviar VOD"</span>.
                  Revisaremos las horas y las registraremos automáticamente.
                  Los pagos son trimestrales con un mínimo de{" "}
                  <span style={{ color:GREEN }}>$20.00</span>.
                </p>
              </div>
            </div>

            {/* VODs recientes */}
            {vods.length > 0 && (
              <div>
                <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                  letterSpacing:"3px", textTransform:"uppercase",
                  color:"#555", marginBottom:"16px" }}>
                  Últimos VODs enviados
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
                  {vods.slice(0,5).map((v,i) => (
                    <div key={v.id} style={{ display:"grid",
                      gridTemplateColumns:"1fr 100px 80px 120px 120px",
                      gap:"16px", padding:"14px 16px", alignItems:"center",
                      background: i%2===0 ? "#0d0d0d" : "#111" }}>
                      <a href={v.vod_url} target="_blank" rel="noreferrer"
                        style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                          color:GREEN, textDecoration:"none", overflow:"hidden",
                          textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {v.vod_url}
                      </a>
                      <span style={{ fontFamily:"'Share Tech Mono',monospace",
                        fontSize:"10px", color:"#555" }}>
                        {fmtDate(v.stream_date)}
                      </span>
                      <span style={{ fontFamily:"'Share Tech Mono',monospace",
                        fontSize:"11px", color:"#f0f0f0" }}>
                        {Number(v.reported_hours).toFixed(1)}h
                      </span>
                      <span style={{ fontFamily:"'Share Tech Mono',monospace",
                        fontSize:"11px",
                        color: v.status === "approved" ? GREEN : "#888" }}>
                        {v.status === "approved" ? `${Number(v.approved_hours).toFixed(1)}h aprobadas` : "—"}
                      </span>
                      <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                        letterSpacing:"1px", textTransform:"uppercase",
                        padding:"4px 10px", display:"inline-block",
                        background:`rgba(${v.status === "approved" ? "29,185,84" : v.status === "rejected" ? "255,68,68" : "239,159,39"},0.1)`,
                        color: STATUS_COLORS[v.status] || "#888",
                        border:`1px solid ${STATUS_COLORS[v.status] || "#888"}44` }}>
                        {STATUS_LABELS[v.status] || v.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Horas aprobadas por mes */}
            {payments.length > 0 && (
              <div>
                <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                  letterSpacing:"3px", textTransform:"uppercase",
                  color:"#555", marginBottom:"16px" }}>
                  Horas registradas por mes
                </p>
                <div style={{ display:"grid",
                  gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:"2px" }}>
                  {payments.map((p) => (
                    <div key={p.id} style={{ padding:"20px", background:"#0d0d0d",
                      borderLeft:`2px solid ${p.paid ? "#1DB954" : "rgba(168,230,61,0.2)"}` }}>
                      <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                        letterSpacing:"2px", textTransform:"uppercase",
                        color:"#555", marginBottom:"8px" }}>
                        {fmtMonthFull(p.month.slice(0,7))}
                      </p>
                      <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"32px",
                        lineHeight:1, color:GREEN, marginBottom:"4px" }}>
                        {Number(p.hours).toFixed(1)}h
                      </p>
                      <p style={{ fontFamily:"'Share Tech Mono',monospace",
                        fontSize:"11px", color:"#888", marginBottom:"10px" }}>
                        {fmt2(p.total)}
                      </p>
                      <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                        letterSpacing:"1px", textTransform:"uppercase", padding:"3px 8px",
                        background: p.paid ? "rgba(29,185,84,0.1)" : "rgba(255,92,26,0.08)",
                        color: p.paid ? "#1DB954" : "#ff5c1a",
                        border:`1px solid ${p.paid ? "#1DB95444" : "#ff5c1a33"}` }}>
                        {p.paid ? "✓ Pagado" : "Acumulando"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {payments.length === 0 && vods.length === 0 && (
              <div style={{ padding:"60px", textAlign:"center", background:"#0d0d0d",
                border:"1px dashed #1a1a1a" }}>
                <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                  color:"#333", letterSpacing:"2px", marginBottom:"16px" }}>
                  Aún no hay actividad registrada
                </p>
                <button onClick={() => setActiveTab("vods")}
                  style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                    letterSpacing:"2px", textTransform:"uppercase", padding:"12px 24px",
                    background:"rgba(168,230,61,0.08)", border:`1px solid rgba(168,230,61,0.3)`,
                    color:GREEN, cursor:"pointer" }}>
                  Enviar primer VOD →
                </button>
              </div>
            )}
          </div>
        )}

        {/* VODs */}
        {activeTab === "vods" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"48px" }}>

            {/* Formulario */}
            <div>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                letterSpacing:"3px", textTransform:"uppercase",
                color:GREEN, marginBottom:"24px" }}>
                Enviar nuevo VOD
              </p>

              <form onSubmit={submitVod}
                style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

                <div>
                  <label style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                    letterSpacing:"2px", textTransform:"uppercase",
                    color:"#555", display:"block", marginBottom:"8px" }}>
                    Enlace del VOD *
                  </label>
                  <input type="url" placeholder="https://www.twitch.tv/videos/..."
                    value={vodForm.vod_url}
                    onChange={(e) => setVodForm({...vodForm, vod_url:e.target.value})}
                    style={inp} required
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(168,230,61,0.4)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                  <div>
                    <label style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                      letterSpacing:"2px", textTransform:"uppercase",
                      color:"#555", display:"block", marginBottom:"8px" }}>
                      Plataforma *
                    </label>
                    <select value={vodForm.platform}
                      onChange={(e) => setVodForm({...vodForm, platform:e.target.value})}
                      style={{ ...inp, appearance:"none" }}>
                      <option>Twitch</option>
                      <option>YouTube</option>
                      <option>Kick</option>
                      <option>TikTok</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                      letterSpacing:"2px", textTransform:"uppercase",
                      color:"#555", display:"block", marginBottom:"8px" }}>
                      Fecha del stream *
                    </label>
                    <input type="date"
                      value={vodForm.stream_date}
                      onChange={(e) => setVodForm({...vodForm, stream_date:e.target.value})}
                      style={{ ...inp, colorScheme:"dark" }} required
                      onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(168,230,61,0.4)")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
                  </div>
                </div>

                <div>
                  <label style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                    letterSpacing:"2px", textTransform:"uppercase",
                    color:"#555", display:"block", marginBottom:"8px" }}>
                    Horas aproximadas con música LoyalFox *
                  </label>
                  <input type="number" step="0.5" min="0.5" placeholder="ej: 3.5"
                    value={vodForm.reported_hours}
                    onChange={(e) => setVodForm({...vodForm, reported_hours:e.target.value})}
                    style={inp} required
                    onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(168,230,61,0.4)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")} />
                  <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                    color:"#444", marginTop:"6px", letterSpacing:"0.5px" }}>
                    Tiempo aproximado que sonó música de LoyalFox Records en el stream
                  </p>
                </div>

                <div>
                  <label style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                    letterSpacing:"2px", textTransform:"uppercase",
                    color:"#555", display:"block", marginBottom:"8px" }}>
                    Notas adicionales (opcional)
                  </label>
                  <textarea placeholder="Cualquier información relevante sobre el stream..."
                    value={vodForm.notes}
                    onChange={(e) => setVodForm({...vodForm, notes:e.target.value})}
                    style={{ ...inp, resize:"vertical", minHeight:"80px" }} />
                </div>

                <button type="submit" disabled={vodLoading}
                  style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                    letterSpacing:"3px", textTransform:"uppercase",
                    padding:"16px 32px", background:GREEN, color:"#080808",
                    border:"none", cursor: vodLoading ? "not-allowed" : "pointer",
                    opacity: vodLoading ? 0.7 : 1, fontWeight:700,
                    transition:"all .2s" }}
                  onMouseEnter={(e) => { if (!vodLoading) (e.currentTarget as HTMLElement).style.background = "#c5f560"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = GREEN; }}>
                  {vodLoading ? "Enviando..." : "Enviar VOD →"}
                </button>

                {vodStatus && (
                  <div style={{ padding:"14px 16px",
                    background: vodStatus.startsWith("✓") ? "rgba(29,185,84,0.08)" : "rgba(255,92,26,0.08)",
                    border:`1px solid ${vodStatus.startsWith("✓") ? "#1DB95444" : "#ff5c1a44"}` }}>
                    <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                      color: vodStatus.startsWith("✓") ? "#1DB954" : "#ff5c1a" }}>
                      {vodStatus}
                    </p>
                  </div>
                )}
              </form>
            </div>

            {/* Historial VODs */}
            <div>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                letterSpacing:"3px", textTransform:"uppercase",
                color:"#555", marginBottom:"24px" }}>
                Historial de VODs enviados
              </p>
              {vods.length === 0 ? (
                <div style={{ padding:"40px", textAlign:"center",
                  background:"#0d0d0d", border:"1px dashed #1a1a1a" }}>
                  <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                    color:"#333", letterSpacing:"2px" }}>
                    Aún no has enviado ningún VOD
                  </p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
                  {vods.map((v,i) => (
                    <div key={v.id} style={{ padding:"16px",
                      background: i%2===0 ? "#0d0d0d" : "#111",
                      borderLeft:`2px solid ${STATUS_COLORS[v.status] || "#333"}44` }}>
                      <div style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"flex-start", marginBottom:"8px" }}>
                        <div>
                          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                            color:"#555", marginBottom:"4px", letterSpacing:"1px" }}>
                            {fmtDate(v.stream_date)} · {v.platform}
                          </p>
                          <a href={v.vod_url} target="_blank" rel="noreferrer"
                            style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                              color:GREEN, textDecoration:"none",
                              overflow:"hidden", textOverflow:"ellipsis",
                              whiteSpace:"nowrap", display:"block", maxWidth:"280px" }}>
                            {v.vod_url}
                          </a>
                        </div>
                        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                          letterSpacing:"1px", textTransform:"uppercase",
                          padding:"4px 10px", flexShrink:0,
                          background:`rgba(${v.status === "approved" ? "29,185,84" : v.status === "rejected" ? "255,68,68" : "239,159,39"},0.1)`,
                          color: STATUS_COLORS[v.status] || "#888",
                          border:`1px solid ${STATUS_COLORS[v.status] || "#888"}44` }}>
                          {STATUS_LABELS[v.status] || v.status}
                        </span>
                      </div>
                      <div style={{ display:"flex", gap:"20px", flexWrap:"wrap" }}>
                        <div>
                          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"8px",
                            letterSpacing:"2px", textTransform:"uppercase",
                            color:"#444", marginBottom:"2px" }}>Reportadas</p>
                          <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px",
                            lineHeight:1, color:"#888" }}>
                            {Number(v.reported_hours).toFixed(1)}h
                          </p>
                        </div>
                        {v.status === "approved" && (
                          <div>
                            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"8px",
                              letterSpacing:"2px", textTransform:"uppercase",
                              color:"#444", marginBottom:"2px" }}>Aprobadas</p>
                            <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px",
                              lineHeight:1, color:GREEN }}>
                              {Number(v.approved_hours).toFixed(1)}h
                            </p>
                          </div>
                        )}
                        {v.notes && (
                          <div style={{ flex:1 }}>
                            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"8px",
                              letterSpacing:"2px", textTransform:"uppercase",
                              color:"#444", marginBottom:"2px" }}>Notas</p>
                            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                              color:"#555", lineHeight:1.5 }}>{v.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* OVERLAY */}
        {activeTab === "overlay" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"24px", maxWidth:"700px" }}>
            <div style={{ padding:"24px 28px", background:"#0d0d0d",
              borderLeft:"2px solid rgba(168,230,61,0.3)" }}>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                letterSpacing:"3px", textTransform:"uppercase", color:GREEN, marginBottom:"16px" }}>
                Tu URL de overlay
              </p>
              <div style={{ display:"flex", gap:"8px", alignItems:"center", flexWrap:"wrap" }}>
                <code style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"12px",
                  color:"#f0f0f0", background:"#111", padding:"12px 16px",
                  border:"1px solid #222", flex:1, wordBreak:"break-all" }}>
                  {`https://loyalfoxrecords.com/overlay/${overlayToken}`}
                </code>
                <button onClick={copyUrl}
                  style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                    letterSpacing:"2px", textTransform:"uppercase", padding:"12px 20px",
                    background: copied ? "rgba(29,185,84,0.1)" : "rgba(168,230,61,0.08)",
                    border: copied ? "1px solid #1DB954" : `1px solid rgba(168,230,61,0.3)`,
                    color: copied ? "#1DB954" : GREEN, cursor:"pointer",
                    transition:"all .2s", whiteSpace:"nowrap" }}>
                  {copied ? "✓ Copiado" : "Copiar URL"}
                </button>
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                letterSpacing:"3px", textTransform:"uppercase",
                color:"#555", marginBottom:"12px" }}>
                Cómo añadirlo en OBS
              </p>
              {[
                { n:"01", title:"Añadir fuente",      desc:"En OBS haz clic en + en Fuentes y selecciona Navegador." },
                { n:"02", title:"Pegar la URL",       desc:"Pega tu URL de overlay. Marca la opción de fondo transparente." },
                { n:"03", title:"Ajustar resolución", desc:"Ancho 1920 · Alto 1080." },
                { n:"04", title:"Seleccionar playlist",desc:"Al iniciar el stream selecciona la playlist de LoyalFox." },
                { n:"05", title:"Enviar el VOD",      desc:"Al acabar el stream envíanos el enlace desde la pestaña Enviar VOD." },
              ].map((step) => (
                <div key={step.n} style={{ display:"grid",
                  gridTemplateColumns:"40px 1fr", gap:"16px",
                  padding:"16px", background:"#0d0d0d", alignItems:"start" }}>
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"24px",
                    lineHeight:1, color:"rgba(168,230,61,0.3)" }}>{step.n}</span>
                  <div>
                    <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                      color:"#f0f0f0", marginBottom:"4px", letterSpacing:"1px" }}>
                      {step.title}
                    </p>
                    <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                      color:"#555", lineHeight:1.7 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding:"20px 24px", background:"rgba(168,230,61,0.03)",
              border:"1px solid rgba(168,230,61,0.1)" }}>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                color:"#444", lineHeight:1.8 }}>
                El overlay sirve como verificación visual de que usas música de LoyalFox Records.
                Asegúrate de que sea visible en todo momento durante el stream.
              </p>
            </div>
          </div>
        )}

        {/* PAYMENTS */}
        {activeTab === "payments" && (
          <div>
            <div style={{ padding:"20px 24px", marginBottom:"32px",
              borderLeft:"2px solid rgba(168,230,61,0.3)",
              background:"rgba(168,230,61,0.03)" }}>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                letterSpacing:"3px", textTransform:"uppercase", color:GREEN, marginBottom:"8px" }}>
                Política de pagos
              </p>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                color:"#555", lineHeight:1.9 }}>
                Los pagos se realizan <span style={{ color:"#f0f0f0" }}>trimestralmente</span> —
                enero, abril, julio y octubre. El mínimo es{" "}
                <span style={{ color:GREEN }}>$20.00</span>.
                Si no llegas, el saldo se acumula al siguiente trimestre.
              </p>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
              gap:"2px", marginBottom:"32px" }}>
              {[
                { label:"Total generado",    value:fmt2(totalEarned),  accent:false },
                { label:"Total cobrado",     value:fmt2(totalPaid),    accent:false },
                { label:"Pendiente de pago", value:fmt2(totalPending), accent:true  },
              ].map((k,i) => (
                <div key={i} style={{ padding:"24px 28px", background:"#0d0d0d",
                  borderLeft:`2px solid ${k.accent ? GREEN : "#1a1a1a"}` }}>
                  <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                    letterSpacing:"2px", textTransform:"uppercase",
                    color: k.accent ? GREEN : "#555", marginBottom:"10px" }}>{k.label}</p>
                  <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"36px",
                    lineHeight:1, color:"#f0f0f0" }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Barra progreso */}
            <div style={{ padding:"28px", marginBottom:"32px", background:"#0d0d0d",
              border:`1px solid ${canReceive ? "rgba(168,230,61,0.2)" : "#1a1a1a"}` }}>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                letterSpacing:"3px", textTransform:"uppercase",
                color: canReceive ? GREEN : "#555", marginBottom:"16px" }}>
                Próximo pago — {nextLabel}
              </p>
              <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"40px",
                lineHeight:1, color:"#f0f0f0", marginBottom:"20px" }}>
                {fmt2(totalPending)}
              </p>
              <div style={{ marginBottom:"16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px", color:"#555" }}>
                    Progreso hacia el mínimo de $20.00
                  </span>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px", color:"#f0f0f0" }}>
                    {fmt2(totalPending)} / $20.00
                  </span>
                </div>
                <div style={{ height:"8px", background:"#1a1a1a", borderRadius:"4px", overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:"4px",
                    background: canReceive ? GREEN : totalPending >= threshold*0.5 ? "#EF9F27" : "#ff5c1a",
                    width:`${progressPct}%`, transition:"width .5s",
                    boxShadow: canReceive ? `0 0 8px ${GREEN}50` : "none" }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:"6px" }}>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px", color:"#333" }}>$0</span>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px", color:"#555" }}>$20.00</span>
                </div>
              </div>
              {canReceive ? (
                <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px", color:GREEN }}>
                  ✓ Superas el mínimo — recibirás el pago en {nextLabel}
                </p>
              ) : (
                <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                  color:"#ff5c1a", lineHeight:1.7 }}>
                  ⚠ Faltan <span style={{ color:"#f0f0f0" }}>{fmt2(threshold - totalPending)}</span> para
                  el mínimo. Tu saldo se acumulará al siguiente trimestre.
                </p>
              )}
            </div>

            {/* Historial */}
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
              letterSpacing:"3px", textTransform:"uppercase",
              color:"#555", marginBottom:"16px" }}>
              Historial mes a mes
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
              <div style={{ display:"grid",
                gridTemplateColumns:"1fr 80px 100px 110px 130px",
                gap:"16px", padding:"8px 16px" }}>
                {["Mes","Horas","Tarifa/h","Total","Estado"].map((h,i) => (
                  <span key={i} style={{ fontFamily:"'Share Tech Mono',monospace",
                    fontSize:"9px", letterSpacing:"2px",
                    textTransform:"uppercase", color:"#333" }}>{h}</span>
                ))}
              </div>
              {payments.length === 0 ? (
                <div style={{ padding:"40px", textAlign:"center", background:"#0d0d0d" }}>
                  <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                    color:"#333", letterSpacing:"2px" }}>Sin datos aún</p>
                </div>
              ) : (
                payments.map((p,i) => (
                  <div key={p.id} style={{ display:"grid",
                    gridTemplateColumns:"1fr 80px 100px 110px 130px",
                    gap:"16px", padding:"16px",
                    background: i%2===0 ? "#0d0d0d" : "#111", alignItems:"center" }}>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"13px", color:"#f0f0f0", textTransform:"capitalize" }}>
                      {fmtMonthFull(p.month.slice(0,7))}
                    </span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"13px", color:GREEN }}>{Number(p.hours).toFixed(1)}h</span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"12px", color:"#555" }}>{fmt2(p.rate_per_hour)}</span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"13px", color:GREEN, fontWeight:700 }}>{fmt2(p.total)}</span>
                    <div>
                      <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                        letterSpacing:"1px", textTransform:"uppercase", padding:"5px 12px",
                        background: p.paid ? "rgba(29,185,84,0.1)" : "rgba(255,92,26,0.08)",
                        color: p.paid ? "#1DB954" : "#ff5c1a",
                        border:`1px solid ${p.paid ? "#1DB95444" : "#ff5c1a33"}` }}>
                        {p.paid ? "✓ Pagado" : "Acumulando"}
                      </span>
                      {p.paid && p.paid_at && (
                        <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                          color:"#333", marginTop:"4px" }}>
                          {new Date(p.paid_at).toLocaleDateString("es")}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop:"32px", padding:"20px 24px",
              borderLeft:"2px solid rgba(168,230,61,0.15)",
              background:"rgba(168,230,61,0.02)" }}>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                color:"#444", lineHeight:1.8 }}>
                Pagos trimestrales · Mínimo $20.00 · Saldo acumulable.
                Para cualquier duda contacta con{" "}
                <span style={{ color:GREEN }}>info@loyalfoxrecords.com</span>
              </p>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}