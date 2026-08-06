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

// ─── Colores estilo Stripe ───
const c = {
  bg:          "#f9fafb",
  white:       "#ffffff",
  border:      "#e5e7eb",
  borderLight: "#f3f4f6",
  text:        "#111827",
  textSub:     "#6b7280",
  textMute:    "#9ca3af",
  accent:      "#111827",
  green:       "#16a34a",
  greenBg:     "#f0fdf4",
  greenBorder: "#bbf7d0",
  blue:        "#2563eb",
  blueBg:      "#eff6ff",
  blueBorder:  "#bfdbfe",
  red:         "#dc2626",
  redBg:       "#fef2f2",
  redBorder:   "#fecaca",
  yellow:      "#d97706",
  yellowBg:    "#fffbeb",
  yellowBorder:"#fde68a",
  purple:      "#7c3aed",
};

const CHART_COLORS = [c.blue, c.green, c.purple, "#f59e0b", "#ef4444", "#06b6d4", "#84cc16", "#f97316"];

const fmt          = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n);
const fmtUSD       = (n: number) => `$${Number(n).toFixed(4)}`;
const fmtUSD2      = (n: number) => `$${Number(n).toFixed(2)}`;
const fmtMonth     = (m: string) => { try { const d = new Date(m+"-02"); return d.toLocaleString("es",{month:"short",year:"numeric"}); } catch { return m; } };
const fmtMonthFull = (m: string) => { try { const d = new Date(m+"-02"); return d.toLocaleString("es",{month:"long",year:"numeric"}); } catch { return m; } };

const base: React.CSSProperties = { fontFamily:"system-ui, -apple-system, sans-serif" };

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:c.white, border:`1px solid ${c.border}`, borderRadius:"8px",
      padding:"10px 14px", boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }}>
      <p style={{ ...base, fontSize:"12px", fontWeight:500, color:c.textSub, marginBottom:"6px" }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ ...base, fontSize:"13px", fontWeight:600, color:c.text }}>
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
  const [activeMonth, setActiveMonth] = useState<string|null>(null);
  const [activeStore, setActiveStore] = useState<string|null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string|null>(null);

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

  const totalStreams  = royalties.reduce((a,r) => a + r.total_streams, 0);
  const totalEarned   = royalties.reduce((a,r) => a + Number(r.artist_share), 0);
  const totalPaid     = royalties.filter(r=>r.paid).reduce((a,r) => a + Number(r.artist_share), 0);
  const totalPending  = royalties.filter(r=>!r.paid).reduce((a,r) => a + Number(r.artist_share), 0);

  const monthlyChart = [...royalties].reverse().map(r => ({
    month:   r.month.slice(0,7),
    label:   fmtMonth(r.month.slice(0,7)),
    streams: r.total_streams,
    revenue: Number(r.artist_share),
  }));

  const filteredTracks = activeMonth ? tracks.filter(t => t.month === activeMonth) : tracks;

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

  const threshold   = 20;
  const now         = new Date();
  const nextMonth   = [0,3,6,9].find(m => m > now.getMonth()) ?? 0;
  const nextYear    = nextMonth === 0 ? now.getFullYear()+1 : now.getFullYear();
  const nextLabel   = new Date(nextYear, nextMonth, 1).toLocaleString("es",{month:"long",year:"numeric"});
  const canReceive  = totalPending >= threshold;
  const progressPct = Math.max(Math.min((totalPending/threshold)*100, 100), 3);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", background:c.bg }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:"36px", height:"36px", borderRadius:"50%",
          border:`2px solid ${c.border}`, borderTopColor:c.text,
          margin:"0 auto 12px", animation:"spin 0.8s linear infinite" }} />
        <p style={{ ...base, fontSize:"13px", color:c.textMute }}>Cargando...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ─── Estilos reutilizables ───
  const card: React.CSSProperties = {
    background:c.white, border:`1px solid ${c.border}`,
    borderRadius:"8px", overflow:"hidden",
  };
  const cardHeader: React.CSSProperties = {
    padding:"14px 20px", borderBottom:`1px solid ${c.border}`,
    display:"flex", alignItems:"center", justifyContent:"space-between",
  };
  const cardTitle: React.CSSProperties = {
    ...base, fontSize:"13px", fontWeight:600, color:c.text,
  };
  const label: React.CSSProperties = {
    ...base, fontSize:"11px", fontWeight:500, color:c.textMute,
    textTransform:"uppercase", letterSpacing:"0.04em",
  };

  const badge = (paid: boolean): React.CSSProperties => ({
    ...base, display:"inline-flex", alignItems:"center",
    padding:"2px 8px", borderRadius:"9999px",
    fontSize:"11px", fontWeight:500,
    color: paid ? c.green : c.yellow,
    background: paid ? c.greenBg : c.yellowBg,
    border: `1px solid ${paid ? c.greenBorder : c.yellowBorder}`,
  });

  return (
    <div style={{ minHeight:"100vh", background:c.bg, color:c.text }}>

      {/* ─── NAV ─── */}
      <nav style={{ height:"60px", display:"flex", alignItems:"center",
        justifyContent:"space-between", padding:"0 32px",
        background:c.white, borderBottom:`1px solid ${c.border}`,
        position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <span style={{ ...base, fontSize:"15px", fontWeight:700, color:c.text, letterSpacing:"-0.3px" }}>
            LoyalFox Records
          </span>
          <span style={{ width:"1px", height:"16px", background:c.border }} />
          <span style={{ ...base, fontSize:"12px", color:c.textMute }}>
            Portal de artistas
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <div style={{ textAlign:"right" }}>
            <p style={{ ...base, fontSize:"13px", fontWeight:600, color:c.text }}>{artistName}</p>
            <p style={{ ...base, fontSize:"11px", color:c.textMute }}>{name}</p>
          </div>
          <button onClick={logout}
            style={{ ...base, padding:"6px 14px", borderRadius:"6px",
              border:`1px solid ${c.border}`, background:c.white,
              fontSize:"13px", color:c.textSub, cursor:"pointer",
              transition:"all .15s" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = c.red; (e.currentTarget as HTMLElement).style.color = c.red; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = c.border; (e.currentTarget as HTMLElement).style.color = c.textSub; }}>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"32px 24px" }}>

        {/* ─── HEADER ─── */}
        <div style={{ marginBottom:"32px" }}>
          <p style={{ ...base, fontSize:"13px", color:c.textMute, marginBottom:"4px" }}>
            Bienvenido de nuevo
          </p>
          <h1 style={{ ...base, fontSize:"28px", fontWeight:700, color:c.text,
            letterSpacing:"-0.5px", marginBottom:"4px" }}>
            {artistName}
          </h1>
          <p style={{ ...base, fontSize:"13px", color:c.textMute }}>
            LoyalFox Records · {royalties.length} {royalties.length===1?"mes":"meses"} de datos
          </p>
        </div>

        {/* ─── KPIs ─── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)",
          gap:"16px", marginBottom:"32px" }}>
          {[
            { label:"Streams totales",    value:fmt(totalStreams),    sub:"Acumulado", color:c.text, bg:c.white },
            { label:"Ingresos totales",   value:fmtUSD2(totalEarned), sub:"Tu parte",  color:c.blue, bg:c.blueBg },
            { label:"Ya cobrado",         value:fmtUSD2(totalPaid),   sub:"Pagado",    color:c.green,bg:c.greenBg },
            { label:"Pendiente de cobro", value:fmtUSD2(totalPending),sub:"Acumulando",color:canReceive?c.green:c.yellow, bg:canReceive?c.greenBg:c.yellowBg },
          ].map((k,i) => (
            <div key={i} style={{ ...card, padding:"20px 24px" }}>
              <p style={label}>{k.label}</p>
              <p style={{ ...base, fontSize:"28px", fontWeight:700,
                color:k.color, lineHeight:1, margin:"8px 0 4px" }}>{k.value}</p>
              <p style={{ ...base, fontSize:"12px", color:c.textMute }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* ─── TABS ─── */}
        <div style={{ display:"flex", gap:"4px", marginBottom:"24px",
          borderBottom:`1px solid ${c.border}`, paddingBottom:"0" }}>
          {([
            { id:"overview", label:"Resumen"  },
            { id:"monthly",  label:"Por mes"  },
            { id:"tracks",   label:"Tracks"   },
            { id:"payments", label:"Pagos"    },
          ] as const).map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ ...base, padding:"10px 20px", fontSize:"13px", fontWeight:500,
                background:"transparent", border:"none", cursor:"pointer",
                color: activeTab===tab.id ? c.text : c.textMute,
                borderBottom: activeTab===tab.id ? `2px solid ${c.text}` : "2px solid transparent",
                marginBottom:"-1px", transition:"all .15s" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW ─── */}
        {activeTab==="overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
            {monthlyChart.length > 0 && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                <div style={card}>
                  <div style={cardHeader}>
                    <p style={cardTitle}>Evolución de streams</p>
                  </div>
                  <div style={{ padding:"20px" }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={monthlyChart}>
                        <defs>
                          <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={c.blue} stopOpacity={0.15}/>
                            <stop offset="95%" stopColor={c.blue} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="label" tick={{ fontFamily:"system-ui", fontSize:11, fill:c.textMute }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontFamily:"system-ui", fontSize:11, fill:c.textMute }} tickFormatter={fmt} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="streams" stroke={c.blue}
                          strokeWidth={2} fill="url(#streamGrad)" name="Streams" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div style={card}>
                  <div style={cardHeader}>
                    <p style={cardTitle}>Ingresos por mes (USD)</p>
                  </div>
                  <div style={{ padding:"20px" }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={monthlyChart}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={c.green} stopOpacity={0.15}/>
                            <stop offset="95%" stopColor={c.green} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="label" tick={{ fontFamily:"system-ui", fontSize:11, fill:c.textMute }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontFamily:"system-ui", fontSize:11, fill:c.textMute }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="revenue" stroke={c.green}
                          strokeWidth={2} fill="url(#revGrad)" name="Ingresos $" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
              {/* Top tracks */}
              <div style={card}>
                <div style={cardHeader}>
                  <p style={cardTitle}>Top tracks</p>
                </div>
                <div style={{ padding:"0" }}>
                  {topTracks.slice(0,5).map((tr,i) => (
                    <div key={tr.name} style={{ display:"flex", alignItems:"center",
                      gap:"12px", padding:"12px 20px",
                      borderBottom: i<4 ? `1px solid ${c.borderLight}` : "none" }}>
                      <span style={{ ...base, fontSize:"12px", color:c.textMute, minWidth:"20px", fontWeight:500 }}>
                        {i+1}
                      </span>
                      <span style={{ ...base, fontSize:"13px", color:c.text, flex:1,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:500 }}>
                        {tr.name}
                      </span>
                      <div style={{ width:"60px", height:"4px", background:c.borderLight, borderRadius:"2px" }}>
                        <div style={{ height:"100%", background:c.blue, borderRadius:"2px",
                          width:`${(tr.streams/topTracks[0]?.streams)*100}%` }} />
                      </div>
                      <span style={{ ...base, fontSize:"12px", color:c.blue,
                        fontWeight:600, minWidth:"40px", textAlign:"right" }}>
                        {fmt(tr.streams)}
                      </span>
                    </div>
                  ))}
                  {topTracks.length===0 && (
                    <p style={{ ...base, fontSize:"13px", color:c.textMute,
                      padding:"32px", textAlign:"center" }}>Sin datos</p>
                  )}
                </div>
              </div>

              {/* Por plataforma */}
              <div style={card}>
                <div style={cardHeader}>
                  <p style={cardTitle}>Por plataforma</p>
                </div>
                <div style={{ padding:"20px" }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byStore.slice(0,6)} layout="vertical">
                      <XAxis type="number" tick={{ fontFamily:"system-ui", fontSize:11, fill:c.textMute }} tickFormatter={fmt} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={90}
                        tick={{ fontFamily:"system-ui", fontSize:11, fill:c.textSub }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="streams" name="Streams" radius={[0,4,4,0]}>
                        {byStore.slice(0,6).map((_,i) => (
                          <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── MONTHLY ─── */}
        {activeTab==="monthly" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"16px" }}>
            {royalties.map((r) => (
              <div key={r.id}
                onClick={() => { setActiveMonth(activeMonth===r.month?null:r.month); setActiveStore(null); setSelectedTrack(null); setActiveTab("tracks"); }}
                style={{ ...card, padding:"20px", cursor:"pointer", transition:"box-shadow .15s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = "none"}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" }}>
                  <p style={{ ...base, fontSize:"15px", fontWeight:600, color:c.text, textTransform:"capitalize" }}>
                    {fmtMonthFull(r.month.slice(0,7))}
                  </p>
                  <span style={badge(r.paid)}>{r.paid?"✓ Pagado":"Acumulando"}</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                  <div>
                    <p style={label}>Streams</p>
                    <p style={{ ...base, fontSize:"22px", fontWeight:700, color:c.text, lineHeight:1, marginTop:"4px" }}>
                      {fmt(r.total_streams)}
                    </p>
                  </div>
                  <div>
                    <p style={label}>Tu parte</p>
                    <p style={{ ...base, fontSize:"22px", fontWeight:700, color:c.green, lineHeight:1, marginTop:"4px" }}>
                      {fmtUSD(r.artist_share)}
                    </p>
                  </div>
                </div>
                <p style={{ ...base, fontSize:"12px", color:c.textMute, marginTop:"14px" }}>
                  Ver tracks de este mes →
                </p>
              </div>
            ))}
            {royalties.length===0 && (
              <p style={{ ...base, fontSize:"13px", color:c.textMute, gridColumn:"1/-1", textAlign:"center", padding:"48px" }}>
                Sin datos aún
              </p>
            )}
          </div>
        )}

        {/* ─── TRACKS ─── */}
        {activeTab==="tracks" && (
          <div style={{ display:"grid", gridTemplateColumns:selectedTrack?"1fr 320px":"1fr", gap:"16px" }}>
            <div>
              {/* Filtros mes */}
              <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"10px" }}>
                <button onClick={() => { setActiveMonth(null); setActiveStore(null); setSelectedTrack(null); }}
                  style={{ ...base, padding:"5px 12px", borderRadius:"6px", fontSize:"12px",
                    fontWeight:500, cursor:"pointer", border:`1px solid ${c.border}`,
                    background: !activeMonth ? c.text : c.white,
                    color: !activeMonth ? c.white : c.textSub }}>
                  Todos
                </button>
                {royalties.map((r) => (
                  <button key={r.month}
                    onClick={() => { setActiveMonth(r.month); setActiveStore(null); setSelectedTrack(null); }}
                    style={{ ...base, padding:"5px 12px", borderRadius:"6px", fontSize:"12px",
                      fontWeight:500, cursor:"pointer", border:`1px solid ${c.border}`,
                      background: activeMonth===r.month ? c.text : c.white,
                      color: activeMonth===r.month ? c.white : c.textSub }}>
                    {fmtMonth(r.month.slice(0,7))}
                  </button>
                ))}
              </div>

              {/* Filtros plataforma */}
              {allStores.length>0 && (
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"16px" }}>
                  <button onClick={() => setActiveStore(null)}
                    style={{ ...base, padding:"4px 10px", borderRadius:"6px", fontSize:"11px",
                      cursor:"pointer", border:`1px solid ${c.border}`,
                      background: !activeStore ? c.accent : c.white,
                      color: !activeStore ? c.white : c.textSub }}>
                    Todas las plataformas
                  </button>
                  {allStores.map(store => (
                    <button key={store} onClick={() => setActiveStore(activeStore===store?null:store)}
                      style={{ ...base, padding:"4px 10px", borderRadius:"6px", fontSize:"11px",
                        cursor:"pointer", border:`1px solid ${c.border}`,
                        background: activeStore===store ? c.accent : c.white,
                        color: activeStore===store ? c.white : c.textSub }}>
                      {store}
                    </button>
                  ))}
                </div>
              )}

              {/* Tabla */}
              <div style={card}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:c.bg }}>
                      {["#","Track","Streams","Ingresos",""].map((h,i) => (
                        <th key={i} style={{ ...base, padding:"10px 16px", textAlign:"left",
                          fontSize:"11px", fontWeight:500, color:c.textMute,
                          borderBottom:`1px solid ${c.border}`, letterSpacing:"0.04em",
                          textTransform:"uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {storeFilteredTracks.length===0 ? (
                      <tr>
                        <td colSpan={5} style={{ ...base, padding:"40px", textAlign:"center",
                          fontSize:"13px", color:c.textMute }}>Sin datos para este filtro</td>
                      </tr>
                    ) : storeFilteredTracks.map((tr: any, i: number) => (
                      <tr key={tr.name}
                        onClick={() => setSelectedTrack(selectedTrack===tr.name?null:tr.name)}
                        style={{ cursor:"pointer", background:selectedTrack===tr.name?c.blueBg:i%2===0?c.white:c.bg,
                          borderBottom:`1px solid ${c.borderLight}`, transition:"background .1s" }}
                        onMouseEnter={e => { if(selectedTrack!==tr.name)(e.currentTarget as HTMLElement).style.background=c.bg; }}
                        onMouseLeave={e => { if(selectedTrack!==tr.name)(e.currentTarget as HTMLElement).style.background=i%2===0?c.white:c.bg; }}>
                        <td style={{ ...base, padding:"12px 16px", fontSize:"12px", color:c.textMute }}>{i+1}</td>
                        <td style={{ ...base, padding:"12px 16px", fontSize:"13px", fontWeight:500,
                          color:selectedTrack===tr.name?c.blue:c.text }}>
                          {tr.name}
                          <div style={{ width:`${(tr.streams/storeFilteredTracks[0]?.streams)*100}%`,
                            height:"2px", background:c.blue, borderRadius:"1px", marginTop:"4px", opacity:0.3 }} />
                        </td>
                        <td style={{ ...base, padding:"12px 16px", fontSize:"13px", fontWeight:600, color:c.text }}>
                          {fmt(tr.streams)}
                        </td>
                        <td style={{ ...base, padding:"12px 16px", fontSize:"13px", color:c.green, fontWeight:600 }}>
                          {fmtUSD(tr.revenue)}
                        </td>
                        <td style={{ ...base, padding:"12px 16px", fontSize:"12px", color:c.blue }}>
                          {selectedTrack===tr.name?"Ocultar ←":"Ver desglose →"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Panel desglose por plataforma */}
            {selectedTrack && (
              <div style={{ ...card, padding:"20px", position:"sticky", top:"80px",
                height:"fit-content", maxHeight:"80vh", overflowY:"auto" }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"flex-start", marginBottom:"16px" }}>
                  <div>
                    <p style={label}>Desglose por plataforma</p>
                    <p style={{ ...base, fontSize:"14px", fontWeight:600, color:c.text, marginTop:"4px" }}>
                      {selectedTrack}
                    </p>
                  </div>
                  <button onClick={() => setSelectedTrack(null)}
                    style={{ ...base, background:"none", border:"none", fontSize:"16px",
                      color:c.textMute, cursor:"pointer" }}>✕</button>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"16px" }}>
                  <div style={{ padding:"12px", background:c.bg, borderRadius:"6px" }}>
                    <p style={label}>Total streams</p>
                    <p style={{ ...base, fontSize:"22px", fontWeight:700, color:c.text, lineHeight:1, marginTop:"4px" }}>
                      {fmt(trackStoreBreakdown.reduce((a:number,s:any)=>a+s.streams,0))}
                    </p>
                  </div>
                  <div style={{ padding:"12px", background:c.greenBg, borderRadius:"6px" }}>
                    <p style={label}>Total ingresos</p>
                    <p style={{ ...base, fontSize:"22px", fontWeight:700, color:c.green, lineHeight:1, marginTop:"4px" }}>
                      {fmtUSD(trackStoreBreakdown.reduce((a:number,s:any)=>a+s.revenue,0))}
                    </p>
                  </div>
                </div>

                <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  {trackStoreBreakdown.map((s:any,i:number) => {
                    const total = trackStoreBreakdown.reduce((a:number,x:any)=>a+x.streams,0);
                    const pct = total > 0 ? (s.streams/total*100).toFixed(1) : "0";
                    return (
                      <div key={s.store} style={{ padding:"12px", background:c.bg, borderRadius:"6px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                          <span style={{ ...base, fontSize:"13px", fontWeight:500, color:c.text }}>{s.store}</span>
                          <span style={{ ...base, fontSize:"12px", color:c.textMute }}>{pct}%</span>
                        </div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                          <span style={{ ...base, fontSize:"13px", fontWeight:600, color:c.text }}>{fmt(s.streams)}</span>
                          <span style={{ ...base, fontSize:"12px", color:c.green, fontWeight:600 }}>{fmtUSD(s.revenue)}</span>
                        </div>
                        <div style={{ height:"4px", background:c.border, borderRadius:"2px" }}>
                          <div style={{ height:"100%", borderRadius:"2px",
                            background:CHART_COLORS[i%CHART_COLORS.length], width:`${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop:"12px", padding:"12px", background:c.blueBg,
                  borderRadius:"6px", border:`1px solid ${c.blueBorder}` }}>
                  <p style={{ ...base, fontSize:"12px", color:c.blue, lineHeight:1.6 }}>
                    El ingreso por stream varía según la plataforma. YouTube Premium y Spotify pagan más que TikTok o plataformas ad-supported.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── PAYMENTS ─── */}
        {activeTab==="payments" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

            {/* KPIs */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px" }}>
              {[
                { label:"Total generado",    value:fmtUSD2(totalEarned),  color:c.text  },
                { label:"Total cobrado",     value:fmtUSD2(totalPaid),    color:c.green },
                { label:"Pendiente de pago", value:fmtUSD2(totalPending), color:canReceive?c.green:c.yellow },
              ].map((k,i) => (
                <div key={i} style={{ ...card, padding:"20px 24px" }}>
                  <p style={label}>{k.label}</p>
                  <p style={{ ...base, fontSize:"32px", fontWeight:700, color:k.color, lineHeight:1, marginTop:"8px" }}>
                    {k.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Próximo pago */}
            <div style={{ ...card, padding:"24px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" }}>
                <div>
                  <p style={label}>Próximo pago</p>
                  <p style={{ ...base, fontSize:"16px", fontWeight:600, color:c.text, marginTop:"4px", textTransform:"capitalize" }}>
                    {nextLabel}
                  </p>
                </div>
                <span style={badge(canReceive)}>
                  {canReceive ? "✓ Listo para cobrar" : "Acumulando"}
                </span>
              </div>

              <p style={{ ...base, fontSize:"32px", fontWeight:700,
                color:canReceive?c.green:c.text, marginBottom:"16px" }}>
                {fmtUSD2(totalPending)}
              </p>

              <div style={{ marginBottom:"8px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                  <span style={{ ...base, fontSize:"12px", color:c.textMute }}>
                    Progreso hacia el mínimo de $20.00
                  </span>
                  <span style={{ ...base, fontSize:"12px", fontWeight:600, color:c.text }}>
                    {fmtUSD2(totalPending)} / $20.00
                  </span>
                </div>
                <div style={{ height:"8px", background:c.borderLight, borderRadius:"4px", overflow:"hidden" }}>
                  <div style={{
                    height:"100%", borderRadius:"4px", transition:"width .4s",
                    background: canReceive ? c.green : totalPending>=threshold*0.5 ? c.yellow : c.red,
                    width:`${progressPct}%`,
                  }} />
                </div>
              </div>

              {canReceive ? (
                <p style={{ ...base, fontSize:"13px", color:c.green, fontWeight:500 }}>
                  ✓ Superas el mínimo — recibirás el pago en {nextLabel}
                </p>
              ) : (
                <p style={{ ...base, fontSize:"13px", color:c.yellow }}>
                  Faltan <strong>{fmtUSD2(threshold-totalPending)}</strong> para el mínimo. Tu saldo se acumulará al siguiente trimestre.
                </p>
              )}
            </div>

            {/* Política */}
            <div style={{ ...card, padding:"20px 24px",
              background:c.bg, border:`1px solid ${c.border}` }}>
              <p style={{ ...base, fontSize:"13px", color:c.textSub, lineHeight:1.8 }}>
                <strong style={{ color:c.text }}>Pagos trimestrales</strong> — enero, abril, julio y octubre.
                Mínimo por pago: <strong>$20.00</strong>. El saldo se acumula si no llegas al mínimo.
                Para cualquier duda: <a href="mailto:info@loyalfoxrecords.com"
                  style={{ color:c.blue, textDecoration:"none" }}>info@loyalfoxrecords.com</a>
              </p>
            </div>

            {/* Historial */}
            <div style={card}>
              <div style={cardHeader}>
                <p style={cardTitle}>Historial mes a mes</p>
              </div>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:c.bg }}>
                    {["Mes","Streams","Tu parte","Estado","Fecha de pago"].map((h,i) => (
                      <th key={i} style={{ ...base, padding:"10px 16px", textAlign:"left",
                        fontSize:"11px", fontWeight:500, color:c.textMute,
                        borderBottom:`1px solid ${c.border}`,
                        textTransform:"uppercase", letterSpacing:"0.04em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {royalties.length===0 ? (
                    <tr>
                      <td colSpan={5} style={{ ...base, padding:"40px", textAlign:"center",
                        fontSize:"13px", color:c.textMute }}>Sin datos aún</td>
                    </tr>
                  ) : royalties.map((r,i) => (
                    <tr key={r.id} style={{ borderBottom:`1px solid ${c.borderLight}`,
                      background:i%2===0?c.white:c.bg }}>
                      <td style={{ ...base, padding:"12px 16px", fontSize:"13px",
                        fontWeight:500, color:c.text, textTransform:"capitalize" }}>
                        {fmtMonthFull(r.month.slice(0,7))}
                      </td>
                      <td style={{ ...base, padding:"12px 16px", fontSize:"13px", color:c.textSub }}>
                        {fmt(r.total_streams)}
                      </td>
                      <td style={{ ...base, padding:"12px 16px", fontSize:"13px",
                        fontWeight:600, color:c.green }}>
                        {fmtUSD(r.artist_share)}
                      </td>
                      <td style={{ padding:"12px 16px" }}>
                        <span style={badge(r.paid)}>{r.paid?"✓ Pagado":"Acumulando"}</span>
                      </td>
                      <td style={{ ...base, padding:"12px 16px", fontSize:"12px", color:c.textMute }}>
                        {r.paid && r.paid_at ? new Date(r.paid_at).toLocaleDateString("es") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
