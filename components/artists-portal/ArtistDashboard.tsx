"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

type Royalty = {
  id: string; month: string; total_streams: number;
  gross_revenue: number; artist_share: number;
  paid: boolean; paid_at: string | null; notes: string;
};
type Track = {
  id: string; track_name: string; streams: number;
  revenue: number; store: string; month: string;
};

const GREEN  = "#39ff14";
const COLORS = [GREEN,"#22cc00","#00ff88","#00ccaa","#00aaff","#0066ff","#9147ff","#ff0050","#ff5c1a","#EF9F27"];
const fmt         = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n);
const fmtUSD      = (n: number) => `$${Number(n).toFixed(4)}`;
const fmtUSD2     = (n: number) => `$${Number(n).toFixed(2)}`;
const fmtMonth    = (m: string) => { try { const d = new Date(m+"-02"); return d.toLocaleString("es",{month:"short",year:"numeric"}); } catch { return m; } };
const fmtMonthFull= (m: string) => { try { const d = new Date(m+"-02"); return d.toLocaleString("es",{month:"long",year:"numeric"}); } catch { return m; } };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0e0e0e", border:"1px solid rgba(57,255,20,0.2)", padding:"12px 16px" }}>
      <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px", color:GREEN, marginBottom:"6px" }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px", color:"#e8e8e8" }}>
          {p.name}: {typeof p.value === "number" && p.value < 10 ? fmtUSD(p.value) : fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function ArtistDashboard() {
  const router = useRouter();
  const [name, setName]               = useState("");
  const [artistName, setArtistName]   = useState("");
  const [royalties, setRoyalties]     = useState<Royalty[]>([]);
  const [tracks, setTracks]           = useState<Track[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState<"overview"|"monthly"|"tracks"|"payments">("overview");
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [activeStore, setActiveStore] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/artists-portal/me")
      .then((r) => { if (!r.ok) router.push("/artists-portal/login"); return r.json(); })
      .then((data) => {
        setName(data.name); setArtistName(data.artist_name);
        setRoyalties(data.royalties || []); setTracks(data.tracks || []);
        setLoading(false);
      })
      .catch(() => router.push("/artists-portal/login"));
  }, [router]);

  const logout = async () => {
    await fetch("/api/artists-portal/logout", { method:"POST" });
    router.push("/artists-portal/login");
  };

  const totalStreams = royalties.reduce((a,r) => a + r.total_streams, 0);
  const totalEarned  = royalties.reduce((a,r) => a + Number(r.artist_share), 0);
  const totalPaid    = royalties.filter(r=>r.paid).reduce((a,r) => a + Number(r.artist_share), 0);
  const totalPending = royalties.filter(r=>!r.paid).reduce((a,r) => a + Number(r.artist_share), 0);

  const monthlyChart = [...royalties].reverse().map(r => ({
    month:   r.month.slice(0,7),
    label:   fmtMonth(r.month.slice(0,7)),
    streams: r.total_streams,
    revenue: Number(r.artist_share),
  }));

  const filteredTracks = activeMonth
    ? tracks.filter(t => t.month === activeMonth)
    : tracks;

  const topTracks = Object.values(
    filteredTracks.reduce((acc: Record<string,any>, t) => {
      if (!acc[t.track_name]) acc[t.track_name] = { name:t.track_name, streams:0, revenue:0 };
      acc[t.track_name].streams += t.streams;
      acc[t.track_name].revenue += t.revenue;
      return acc;
    }, {})
  ).sort((a:any,b:any) => b.streams - a.streams) as any[];

  const byStore = Object.values(
    filteredTracks.reduce((acc: Record<string,any>, t) => {
      if (!acc[t.store]) acc[t.store] = { name:t.store, streams:0, revenue:0 };
      acc[t.store].streams += t.streams;
      acc[t.store].revenue += t.revenue;
      return acc;
    }, {})
  ).sort((a:any,b:any) => b.streams - a.streams) as any[];

  const storeFilteredTracks = activeStore
    ? Object.values(
        filteredTracks
          .filter(t => t.store === activeStore)
          .reduce((acc: Record<string,any>, t) => {
            if (!acc[t.track_name]) acc[t.track_name] = { name:t.track_name, streams:0, revenue:0 };
            acc[t.track_name].streams += t.streams;
            acc[t.track_name].revenue += t.revenue;
            return acc;
          }, {})
      ).sort((a:any,b:any) => b.streams - a.streams) as any[]
    : topTracks;

  const allStores = Array.from(new Set(filteredTracks.map(t => t.store).filter(Boolean)));

  const trackStoreBreakdown = selectedTrack
    ? Object.values(
        filteredTracks
          .filter(t => t.track_name === selectedTrack)
          .reduce((acc: Record<string,any>, t) => {
            if (!acc[t.store]) acc[t.store] = { store:t.store, streams:0, revenue:0 };
            acc[t.store].streams += t.streams;
            acc[t.store].revenue += t.revenue;
            return acc;
          }, {})
      ).sort((a:any,b:any) => b.streams - a.streams) as any[]
    : [];

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", background:"#060606" }}>
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

  const threshold = 20;
  const now = new Date();
  const nextPaymentMonths = [0, 3, 6, 9];
  const nextMonth = nextPaymentMonths.find(m => m > now.getMonth()) ?? 0;
  const nextYear  = nextMonth === 0 ? now.getFullYear() + 1 : now.getFullYear();
  const nextDate  = new Date(nextYear, nextMonth, 1);
  const nextLabel = nextDate.toLocaleString("es", { month:"long", year:"numeric" });
  const canReceive = totalPending >= threshold;
  const progressPct = Math.max(Math.min((totalPending / threshold) * 100, 100), 3);

  return (
    <div style={{ minHeight:"100vh", background:"#060606", color:"#e8e8e8" }}>

      {/* Nav */}
      <nav style={{ padding:"0 48px", height:"64px", display:"flex",
        alignItems:"center", justifyContent:"space-between",
        borderBottom:"1px solid #111", background:"rgba(6,6,6,0.97)",
        position:"sticky", top:0, zIndex:100, backdropFilter:"blur(10px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px", letterSpacing:"4px" }}>
            LOYAL<span style={{ color:GREEN }}>FOX</span>
          </span>
          <span style={{ width:"1px", height:"16px", background:"#222" }} />
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
            letterSpacing:"2px", textTransform:"uppercase", color:"#444" }}>
            Portal de artistas
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"20px" }}>
          <div style={{ textAlign:"right" }}>
            <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"16px",
              letterSpacing:"2px", color:"#e8e8e8" }}>{artistName}</p>
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
              color:"#555", letterSpacing:"1px" }}>{name}</p>
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
          borderBottom:"1px solid rgba(57,255,20,0.08)" }}>
          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
            letterSpacing:"3px", textTransform:"uppercase", color:GREEN,
            opacity:0.7, marginBottom:"8px" }}>
            Bienvenido de nuevo
          </p>
          <h1 style={{ fontFamily:"'Bebas Neue',sans-serif",
            fontSize:"clamp(40px,6vw,72px)", letterSpacing:"2px",
            marginBottom:"4px", lineHeight:1 }}>{artistName}</h1>
          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
            color:"#444", letterSpacing:"1px" }}>
            LoyalFox Records · {royalties.length} {royalties.length === 1 ? "mes" : "meses"} de datos
          </p>
        </div>

        {/* KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)",
          gap:"2px", marginBottom:"48px" }}>
          {[
            { label:"Total streams",        value: fmt(totalStreams),     sub:"Acumulado",     accent:false },
            { label:"Tus ingresos totales",  value: fmtUSD2(totalEarned),  sub:"50% acumulado", accent:true  },
            { label:"Ya cobrado",            value: fmtUSD2(totalPaid),    sub:"Transferido",   accent:false },
            { label:"Pendiente de cobro",    value: fmtUSD2(totalPending), sub:"Próximo pago",  accent:true  },
          ].map((k,i) => (
            <div key={i} style={{ padding:"24px 28px", background:"#0e0e0e",
              borderLeft:`2px solid ${k.accent ? GREEN : "#1a1a1a"}`,
              position:"relative", overflow:"hidden" }}>
              {k.accent && (
                <div style={{ position:"absolute", top:0, right:0, bottom:0, width:"40%",
                  background:"radial-gradient(ellipse at right, rgba(57,255,20,0.04), transparent)" }} />
              )}
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                letterSpacing:"2px", textTransform:"uppercase",
                color: k.accent ? GREEN : "#555", marginBottom:"10px" }}>{k.label}</p>
              <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"32px",
                lineHeight:1, color:"#e8e8e8", marginBottom:"4px" }}>{k.value}</p>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                color:"#333" }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:"2px", marginBottom:"40px", borderBottom:"1px solid #111" }}>
          {([
            { id:"overview", label:"Resumen" },
            { id:"monthly",  label:"Por mes" },
            { id:"tracks",   label:"Tracks"  },
            { id:"payments", label:"Pagos"   },
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
            {monthlyChart.length > 0 && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px" }}>
                <div style={{ background:"#0e0e0e", padding:"28px" }}>
                  <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                    letterSpacing:"2px", textTransform:"uppercase", color:"#555", marginBottom:"20px" }}>
                    Evolución de streams
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={monthlyChart}>
                      <defs>
                        <linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={GREEN} stopOpacity={0.2}/>
                          <stop offset="95%" stopColor={GREEN} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" tick={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, fill:"#555" }} />
                      <YAxis tick={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, fill:"#555" }} tickFormatter={fmt} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="streams" stroke={GREEN}
                        strokeWidth={2} fill="url(#gGrad)" name="Streams" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background:"#0e0e0e", padding:"28px" }}>
                  <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                    letterSpacing:"2px", textTransform:"uppercase", color:"#555", marginBottom:"20px" }}>
                    Tus ingresos por mes (USD)
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={monthlyChart}>
                      <defs>
                        <linearGradient id="bGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#00aaff" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#00aaff" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" tick={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, fill:"#555" }} />
                      <YAxis tick={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, fill:"#555" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="revenue" stroke="#00aaff"
                        strokeWidth={2} fill="url(#bGrad)" name="Ingresos $" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px" }}>
              <div style={{ background:"#0e0e0e", padding:"28px" }}>
                <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                  letterSpacing:"2px", textTransform:"uppercase", color:"#555", marginBottom:"20px" }}>
                  Top 5 tracks
                </p>
                {topTracks.slice(0,5).map((tr,i) => (
                  <div key={tr.name} style={{ display:"flex", alignItems:"center",
                    gap:"12px", padding:"10px 0", borderBottom:"1px solid #161616" }}>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"11px", color:"#333", minWidth:"20px" }}>{i+1}</span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"12px", color:"#e8e8e8", flex:1,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {tr.name}
                    </span>
                    <div style={{ width:"60px", height:"3px", background:"#1a1a1a", borderRadius:"2px" }}>
                      <div style={{ height:"100%", background:GREEN, borderRadius:"2px",
                        width:`${(tr.streams/topTracks[0]?.streams)*100}%` }} />
                    </div>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"11px", color:GREEN, minWidth:"40px", textAlign:"right" }}>
                      {fmt(tr.streams)}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ background:"#0e0e0e", padding:"28px" }}>
                <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                  letterSpacing:"2px", textTransform:"uppercase", color:"#555", marginBottom:"20px" }}>
                  Por plataforma
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={byStore.slice(0,6)} layout="vertical">
                    <XAxis type="number" tick={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, fill:"#555" }} tickFormatter={fmt} />
                    <YAxis type="category" dataKey="name" width={100}
                      tick={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, fill:"#aaa" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="streams" name="Streams" radius={[0,2,2,0]}>
                      {byStore.slice(0,6).map((_,i) => (
                        <Cell key={i} fill={COLORS[i%COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* MONTHLY */}
        {activeTab === "monthly" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:"2px" }}>
            {royalties.map((r) => (
              <div key={r.id}
                onClick={() => { setActiveMonth(activeMonth === r.month ? null : r.month); setActiveStore(null); setSelectedTrack(null); setActiveTab("tracks"); }}
                style={{ padding:"28px", background:"#0e0e0e", cursor:"pointer",
                  borderLeft:`2px solid ${activeMonth === r.month ? GREEN : "#1a1a1a"}`,
                  transition:"all .2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#111"; (e.currentTarget as HTMLElement).style.borderLeftColor = GREEN; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#0e0e0e"; (e.currentTarget as HTMLElement).style.borderLeftColor = activeMonth === r.month ? GREEN : "#1a1a1a"; }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"flex-start", marginBottom:"20px" }}>
                  <div>
                    <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                      letterSpacing:"2px", textTransform:"uppercase", color:"#555", marginBottom:"6px" }}>Mes</p>
                    <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"22px",
                      letterSpacing:"2px", color:"#e8e8e8", textTransform:"capitalize" }}>
                      {fmtMonthFull(r.month.slice(0,7))}
                    </p>
                  </div>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                    letterSpacing:"1px", textTransform:"uppercase", padding:"4px 10px",
                    background: r.paid ? "rgba(29,185,84,0.1)" : "rgba(255,92,26,0.1)",
                    color: r.paid ? "#1DB954" : "#ff5c1a",
                    border:`1px solid ${r.paid ? "#1DB95444" : "#ff5c1a44"}` }}>
                    {r.paid ? "Pagado" : "Acumulando"}
                  </span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                  {[
                    { label:"Streams",  value: fmt(r.total_streams)   },
                    { label:"Tu parte", value: fmtUSD(r.artist_share) },
                  ].map((item) => (
                    <div key={item.label}>
                      <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"8px",
                        letterSpacing:"1px", textTransform:"uppercase", color:"#444", marginBottom:"4px" }}>
                        {item.label}
                      </p>
                      <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px",
                        lineHeight:1, color: item.label === "Tu parte" ? GREEN : "#e8e8e8" }}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
                <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                  color:"#333", marginTop:"16px", letterSpacing:"1px" }}>
                  Click para ver tracks →
                </p>
              </div>
            ))}
          </div>
        )}

        {/* TRACKS */}
        {activeTab === "tracks" && (
          <div style={{ display:"grid", gridTemplateColumns: selectedTrack ? "1fr 320px" : "1fr", gap:"2px" }}>
            <div>
              <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginBottom:"12px" }}>
                <button onClick={() => { setActiveMonth(null); setActiveStore(null); setSelectedTrack(null); }}
                  style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                    letterSpacing:"2px", textTransform:"uppercase", padding:"7px 16px",
                    background: !activeMonth ? "rgba(57,255,20,0.08)" : "transparent",
                    border: !activeMonth ? `1px solid ${GREEN}` : "1px solid #222",
                    color: !activeMonth ? GREEN : "#555", cursor:"pointer" }}>
                  Todos los meses
                </button>
                {royalties.map((r) => (
                  <button key={r.month} onClick={() => { setActiveMonth(r.month); setActiveStore(null); setSelectedTrack(null); }}
                    style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                      letterSpacing:"2px", textTransform:"uppercase", padding:"7px 16px",
                      background: activeMonth === r.month ? "rgba(57,255,20,0.08)" : "transparent",
                      border: activeMonth === r.month ? `1px solid ${GREEN}` : "1px solid #222",
                      color: activeMonth === r.month ? GREEN : "#555", cursor:"pointer" }}>
                    {fmtMonth(r.month.slice(0,7))}
                  </button>
                ))}
              </div>

              {allStores.length > 0 && (
                <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginBottom:"24px" }}>
                  <button onClick={() => setActiveStore(null)}
                    style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                      letterSpacing:"2px", textTransform:"uppercase", padding:"6px 14px",
                      background: !activeStore ? "rgba(57,255,20,0.06)" : "transparent",
                      border: !activeStore ? "1px solid rgba(57,255,20,0.5)" : "1px solid #1a1a1a",
                      color: !activeStore ? GREEN : "#555", cursor:"pointer" }}>
                    Todas las plataformas
                  </button>
                  {allStores.map((store) => (
                    <button key={store} onClick={() => setActiveStore(activeStore === store ? null : store)}
                      style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                        letterSpacing:"2px", textTransform:"uppercase", padding:"6px 14px",
                        background: activeStore === store ? "rgba(57,255,20,0.06)" : "transparent",
                        border: activeStore === store ? "1px solid rgba(57,255,20,0.5)" : "1px solid #1a1a1a",
                        color: activeStore === store ? GREEN : "#555", cursor:"pointer" }}>
                      {store}
                    </button>
                  ))}
                </div>
              )}

              {activeStore && (
                <div style={{ padding:"12px 16px", marginBottom:"16px",
                  background:"rgba(57,255,20,0.03)", border:"1px solid rgba(57,255,20,0.1)",
                  display:"flex", alignItems:"center", gap:"12px" }}>
                  <span style={{ color:GREEN, fontSize:"14px" }}>ℹ</span>
                  <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                    color:"#555", lineHeight:1.6 }}>
                    Mostrando solo <span style={{ color:GREEN }}>{activeStore}</span>.
                    Cada plataforma tiene su propio modelo de pago por stream.
                  </p>
                </div>
              )}

              {storeFilteredTracks.length === 0 ? (
                <div style={{ padding:"60px", textAlign:"center", background:"#0e0e0e" }}>
                  <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                    color:"#333", letterSpacing:"2px" }}>Sin datos para este filtro</p>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"1px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"40px 1fr 110px 110px 60px",
                    gap:"16px", padding:"8px 16px" }}>
                    {["#","Track","Streams","Ingresos",""].map((h,i) => (
                      <span key={i} style={{ fontFamily:"'Share Tech Mono',monospace",
                        fontSize:"9px", letterSpacing:"2px", textTransform:"uppercase", color:"#333" }}>{h}</span>
                    ))}
                  </div>
                  {storeFilteredTracks.map((tr: any, i: number) => (
                    <div key={tr.name}
                      onClick={() => setSelectedTrack(selectedTrack === tr.name ? null : tr.name)}
                      style={{ display:"grid", gridTemplateColumns:"40px 1fr 110px 110px 60px",
                        gap:"16px", padding:"14px 16px", cursor:"pointer",
                        background: selectedTrack === tr.name ? "rgba(57,255,20,0.06)" : i%2===0 ? "#0e0e0e" : "#111",
                        borderLeft: selectedTrack === tr.name ? `2px solid ${GREEN}` : "2px solid transparent",
                        alignItems:"center", transition:"all .2s" }}
                      onMouseEnter={(e) => { if (selectedTrack !== tr.name) (e.currentTarget as HTMLElement).style.background = "#161616"; }}
                      onMouseLeave={(e) => { if (selectedTrack !== tr.name) (e.currentTarget as HTMLElement).style.background = i%2===0 ? "#0e0e0e" : "#111"; }}>
                      <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px", color:"#333" }}>{i+1}</span>
                      <div>
                        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"13px",
                          color: selectedTrack === tr.name ? GREEN : "#e8e8e8",
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                          display:"block" }}>{tr.name}</span>
                        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                          color:"rgba(57,255,20,0.4)", letterSpacing:"1px" }}>
                          Click para desglose por plataforma
                        </span>
                      </div>
                      <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"13px", color:GREEN }}>{fmt(tr.streams)}</span>
                      <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"12px", color:"#888" }}>{fmtUSD(tr.revenue)}</span>
                      <div style={{ height:"3px", background:"#1a1a1a", borderRadius:"2px" }}>
                        <div style={{ height:"100%", background:GREEN, borderRadius:"2px",
                          width:`${(tr.streams/storeFilteredTracks[0]?.streams)*100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedTrack && (
              <div style={{ background:"#0e0e0e", padding:"28px",
                borderLeft:"1px solid rgba(57,255,20,0.1)",
                position:"sticky", top:"64px", height:"fit-content",
                maxHeight:"80vh", overflowY:"auto" }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"flex-start", marginBottom:"24px" }}>
                  <div>
                    <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                      letterSpacing:"2px", textTransform:"uppercase", color:GREEN, marginBottom:"6px" }}>
                      Desglose por plataforma
                    </p>
                    <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"18px",
                      letterSpacing:"1px", color:"#e8e8e8", lineHeight:1.2 }}>
                      {selectedTrack}
                    </p>
                  </div>
                  <button onClick={() => setSelectedTrack(null)}
                    style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"14px",
                      background:"transparent", border:"none", color:"#555", cursor:"pointer" }}>
                    ✕
                  </button>
                </div>

                <div style={{ padding:"16px", background:"#111", marginBottom:"20px",
                  borderLeft:`2px solid ${GREEN}` }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                    <div>
                      <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"8px",
                        letterSpacing:"2px", textTransform:"uppercase", color:"#555", marginBottom:"4px" }}>
                        Total streams
                      </p>
                      <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px",
                        lineHeight:1, color:GREEN }}>
                        {fmt(trackStoreBreakdown.reduce((a:number,s:any) => a + s.streams, 0))}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"8px",
                        letterSpacing:"2px", textTransform:"uppercase", color:"#555", marginBottom:"4px" }}>
                        Total ingresos
                      </p>
                      <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px",
                        lineHeight:1, color:"#e8e8e8" }}>
                        {fmtUSD(trackStoreBreakdown.reduce((a:number,s:any) => a + s.revenue, 0))}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
                  {trackStoreBreakdown.map((s: any, i: number) => {
                    const total = trackStoreBreakdown.reduce((a:number,x:any) => a + x.streams, 0);
                    const pct = total > 0 ? (s.streams / total * 100).toFixed(1) : "0";
                    return (
                      <div key={s.store} style={{ padding:"14px 16px",
                        background: i%2===0 ? "#0a0a0a" : "#111" }}>
                        <div style={{ display:"flex", justifyContent:"space-between",
                          alignItems:"center", marginBottom:"8px" }}>
                          <span style={{ fontFamily:"'Share Tech Mono',monospace",
                            fontSize:"11px", color:"#e8e8e8" }}>{s.store}</span>
                          <span style={{ fontFamily:"'Share Tech Mono',monospace",
                            fontSize:"9px", color:"#555" }}>{pct}%</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between",
                          alignItems:"center", marginBottom:"8px" }}>
                          <span style={{ fontFamily:"'Bebas Neue',sans-serif",
                            fontSize:"22px", color:GREEN, lineHeight:1 }}>
                            {fmt(s.streams)}
                          </span>
                          <span style={{ fontFamily:"'Share Tech Mono',monospace",
                            fontSize:"11px", color:"#888" }}>
                            {fmtUSD(s.revenue)}
                          </span>
                        </div>
                        <div style={{ height:"3px", background:"#1a1a1a", borderRadius:"2px" }}>
                          <div style={{ height:"100%", borderRadius:"2px",
                            background:COLORS[i%COLORS.length], width:`${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop:"16px", padding:"12px 14px",
                  background:"rgba(57,255,20,0.02)", border:"1px solid rgba(57,255,20,0.08)" }}>
                  <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                    color:"#444", lineHeight:1.7 }}>
                    El ingreso por stream varía según la plataforma. YouTube Premium y Spotify
                    pagan más por stream que TikTok o plataformas ad-supported.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAYMENTS */}
        {activeTab === "payments" && (
          <div>
            {/* Info política */}
            <div style={{ padding:"20px 24px", marginBottom:"32px",
              borderLeft:"2px solid rgba(57,255,20,0.3)",
              background:"rgba(57,255,20,0.03)" }}>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                letterSpacing:"3px", textTransform:"uppercase", color:GREEN, marginBottom:"8px" }}>
                Política de pagos
              </p>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                color:"#555", lineHeight:1.9 }}>
                Los pagos se realizan <span style={{ color:"#e8e8e8" }}>trimestralmente</span> —
                enero, abril, julio y octubre. El mínimo por pago es de{" "}
                <span style={{ color:GREEN }}>$20.00</span>. Si no llegas al mínimo,
                el saldo se acumula para el siguiente trimestre.
              </p>
            </div>

            {/* KPIs */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"2px", marginBottom:"32px" }}>
              {[
                { label:"Total generado",    value: fmtUSD2(totalEarned),  accent:false },
                { label:"Total cobrado",     value: fmtUSD2(totalPaid),    accent:false },
                { label:"Pendiente de pago", value: fmtUSD2(totalPending), accent:true  },
              ].map((k,i) => (
                <div key={i} style={{ padding:"24px 28px", background:"#0e0e0e",
                  borderLeft:`2px solid ${k.accent ? GREEN : "#1a1a1a"}` }}>
                  <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                    letterSpacing:"2px", textTransform:"uppercase",
                    color: k.accent ? GREEN : "#555", marginBottom:"10px" }}>{k.label}</p>
                  <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"36px",
                    lineHeight:1, color:"#e8e8e8" }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Estado próximo pago */}
            <div style={{ padding:"28px", marginBottom:"32px", background:"#0e0e0e",
              border:`1px solid ${canReceive ? "rgba(57,255,20,0.2)" : "#1a1a1a"}` }}>

              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                letterSpacing:"3px", textTransform:"uppercase",
                color: canReceive ? GREEN : "#555", marginBottom:"16px" }}>
                Próximo pago — {nextLabel}
              </p>

              <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"40px",
                lineHeight:1, color:"#e8e8e8", marginBottom:"20px" }}>
                {fmtUSD2(totalPending)}
              </p>

              {/* Barra de progreso */}
              <div style={{ marginBottom:"16px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                    color:"#555" }}>Progreso hacia el mínimo de $20.00</span>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                    color:"#e8e8e8" }}>{fmtUSD2(totalPending)} / $20.00</span>
                </div>
                <div style={{ height:"8px", background:"#1a1a1a", borderRadius:"4px", overflow:"hidden" }}>
                  <div style={{
                    height:"100%",
                    borderRadius:"4px",
                    background: canReceive ? GREEN : totalPending >= threshold * 0.5 ? "#EF9F27" : "#ff5c1a",
                    width:`${progressPct}%`,
                    transition:"width .5s",
                    boxShadow: canReceive ? "0 0 8px rgba(57,255,20,0.5)" : "none",
                  }} />
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:"6px" }}>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px", color:"#333" }}>$0</span>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px", color:"#555" }}>$20.00</span>
                </div>
              </div>

              {canReceive ? (
                <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                  color:GREEN, letterSpacing:"1px" }}>
                  ✓ Superas el mínimo — recibirás el pago en {nextLabel}
                </p>
              ) : (
                <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                  color:"#ff5c1a", lineHeight:1.7 }}>
                  ⚠ Faltan <span style={{ color:"#e8e8e8" }}>{fmtUSD2(threshold - totalPending)}</span> para
                  llegar al mínimo. Tu saldo se acumulará al siguiente trimestre.
                </p>
              )}
            </div>

            {/* Historial */}
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
              letterSpacing:"3px", textTransform:"uppercase", color:"#555", marginBottom:"16px" }}>
              Historial mes a mes
            </p>

            <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 130px 130px",
                gap:"16px", padding:"8px 16px" }}>
                {["Mes","Streams","Tu parte (50%)","Estado"].map((h,i) => (
                  <span key={i} style={{ fontFamily:"'Share Tech Mono',monospace",
                    fontSize:"9px", letterSpacing:"2px", textTransform:"uppercase", color:"#333" }}>{h}</span>
                ))}
              </div>
              {royalties.length === 0 ? (
                <div style={{ padding:"40px", textAlign:"center", background:"#0e0e0e" }}>
                  <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                    color:"#333", letterSpacing:"2px" }}>Sin datos aún</p>
                </div>
              ) : (
                royalties.map((r,i) => (
                  <div key={r.id} style={{ display:"grid",
                    gridTemplateColumns:"1fr 100px 130px 130px",
                    gap:"16px", padding:"16px",
                    background: i%2===0 ? "#0e0e0e" : "#111", alignItems:"center" }}>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"13px", color:"#e8e8e8", textTransform:"capitalize" }}>
                      {fmtMonthFull(r.month.slice(0,7))}
                    </span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"12px", color:"#555" }}>{fmt(r.total_streams)}</span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace",
                      fontSize:"13px", color:GREEN, fontWeight:700 }}>
                      {fmtUSD(r.artist_share)}
                    </span>
                    <div>
                      <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                        letterSpacing:"1px", textTransform:"uppercase", padding:"5px 12px",
                        background: r.paid ? "rgba(29,185,84,0.1)" : "rgba(255,92,26,0.08)",
                        color: r.paid ? "#1DB954" : "#ff5c1a",
                        border:`1px solid ${r.paid ? "#1DB95444" : "#ff5c1a33"}` }}>
                        {r.paid ? "✓ Pagado" : "Acumulando"}
                      </span>
                      {r.paid && r.paid_at && (
                        <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                          color:"#333", marginTop:"4px" }}>
                          {new Date(r.paid_at).toLocaleDateString("es")}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop:"32px", padding:"20px 24px",
              borderLeft:"2px solid rgba(57,255,20,0.15)",
              background:"rgba(57,255,20,0.02)" }}>
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