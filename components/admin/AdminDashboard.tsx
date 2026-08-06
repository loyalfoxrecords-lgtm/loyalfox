"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminAnalytics from "./AdminAnalytics";
import AdminPlaylists from "./AdminPlaylists";
import AdminTracks from "./AdminTracks";
import AdminArtists from "./AdminArtists";
import AdminStreamers from "./AdminStreamers";
import AdminPosts from "./AdminPosts";
import AdminVideos from "./AdminVideos";
import AdminInstagram from "./AdminInstagram";
import AdminArtistAccounts from "./AdminArtistAccounts";
import AdminStreamerAccounts from "./AdminStreamerAccounts";
import AdminArtistPress from "./AdminArtistPress";
import AdminSendDemo from "./AdminSendDemo";
import AdminMessages from "./AdminMessages";
import AdminContracts from "./AdminContracts";

type Tab =
  | "home" | "analytics" | "tracks" | "playlists"
  | "artists" | "streamers" | "artist-accounts"
  | "streamer-accounts" | "posts" | "videos"
  | "instagram" | "press" | "send-demo"
  | "messages" | "contracts";

const NAV = [
  { id:"home"              as Tab, label:"Inicio",            icon:"⊡", group:"main"      },
  { id:"analytics"         as Tab, label:"Analytics",         icon:"↗", group:"main"      },
  { id:"artist-accounts"   as Tab, label:"Artistas",          icon:"♪", group:"gestion"   },
  { id:"streamer-accounts" as Tab, label:"Streamers",         icon:"◎", group:"gestion"   },
  { id:"messages"          as Tab, label:"Mensajes",          icon:"💬", group:"gestion"   },
  { id:"contracts"         as Tab, label:"Contratos",         icon:"📄", group:"gestion"   },
  { id:"tracks"            as Tab, label:"Tracks",            icon:"▶", group:"contenido" },
  { id:"playlists"         as Tab, label:"Playlists",         icon:"▤", group:"contenido" },
  { id:"artists"           as Tab, label:"Perfiles artistas", icon:"◉", group:"contenido" },
  { id:"streamers"         as Tab, label:"Perfiles streamers",icon:"◈", group:"contenido" },
  { id:"press"             as Tab, label:"Prensa",            icon:"◧", group:"contenido" },
  { id:"posts"             as Tab, label:"Noticias",          icon:"▧", group:"contenido" },
  { id:"videos"            as Tab, label:"Vídeos",            icon:"▸", group:"contenido" },
  { id:"instagram"         as Tab, label:"Instagram",         icon:"◑", group:"contenido" },
  { id:"send-demo"         as Tab, label:"Página demo",       icon:"◎", group:"contenido" },
];

const GROUPS = [
  { id:"main",      label:"General"   },
  { id:"gestion",   label:"Gestión"   },
  { id:"contenido", label:"Contenido" },
];

export const css = {
  bg:           "#f9fafb",
  white:        "#ffffff",
  border:       "#e5e7eb",
  borderLight:  "#f3f4f6",
  text:         "#111827",
  textSub:      "#6b7280",
  textMute:     "#9ca3af",
  accent:       "#111827",
  accentBg:     "#f3f4f6",
  green:        "#16a34a",
  greenBg:      "#f0fdf4",
  greenBorder:  "#bbf7d0",
  red:          "#dc2626",
  redBg:        "#fef2f2",
  redBorder:    "#fecaca",
  yellow:       "#d97706",
  yellowBg:     "#fffbeb",
  yellowBorder: "#fde68a",
  blue:         "#2563eb",
  blueBg:       "#eff6ff",
  blueBorder:   "#bfdbfe",
  purple:       "#7c3aed",
  purpleBg:     "#f5f3ff",
  purpleBorder: "#ddd6fe",
};

export default function AdminDashboard() {
  const [active, setActive] = useState<Tab>("home");
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingContracts, setPendingContracts] = useState(0);
  const [summary, setSummary] = useState({
    totalStreams:     0,
    totalRevenue:     0,
    totalArtistas:    0,
    totalSello:       0,
    pendingArtists:   0,
    pendingStreamers: 0,
    totalTracks:      0,
    totalArtists:     0,
    readyToPay:       [] as { name:string; amount:number }[],
  });
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const [
        { data: royalties },
        { data: tracks },
        { data: artists },
        { data: streamerPayments },
        { data: analytics },
        { data: artistAccounts },
      ] = await Promise.all([
        supabase.from("artist_royalties").select("artist_name, artist_share, gross_revenue, paid"),
        supabase.from("tracks").select("id"),
        supabase.from("artist_accounts").select("id").eq("active", true),
        supabase.from("streamer_payments").select("total, paid"),
        supabase.from("analytics_monthly").select("total_streams, total_revenue"),
        supabase.from("artist_accounts").select("artist_name, is_own_artist, royalty_percent").eq("active", true),
      ]);

      const totalStreams   = analytics?.reduce((a,m) => a+(m.total_streams||0), 0) || 0;
      const totalBruto    = royalties?.reduce((a,r) => a+Number(r.gross_revenue), 0) || 0;
      const totalArtistas = royalties?.filter(r => {
        const acc = artistAccounts?.find(a => a.artist_name===r.artist_name);
        return !acc?.is_own_artist;
      }).reduce((a,r) => a+Number(r.artist_share), 0) || 0;
      const totalSello    = totalBruto - totalArtistas;

      const pendingByArtist: Record<string,number> = {};
      royalties?.filter(r=>!r.paid).forEach(r => {
        pendingByArtist[r.artist_name] = (pendingByArtist[r.artist_name]||0) + Number(r.artist_share);
      });
      const readyToPay = Object.entries(pendingByArtist)
        .filter(([name, amount]) => {
          const acc = artistAccounts?.find(a => a.artist_name===name);
          return amount >= 50 && !acc?.is_own_artist;
        })
        .map(([name, amount]) => ({ name, amount }));

      setSummary({
        totalStreams,
        totalRevenue:   totalBruto,
        totalArtistas,
        totalSello,
        pendingArtists:   royalties?.filter(r=>!r.paid).length || 0,
        pendingStreamers: streamerPayments?.filter(p=>!p.paid).length || 0,
        totalTracks:  tracks?.length || 0,
        totalArtists: artists?.length || 0,
        readyToPay,
      });
    };
    load();
  }, []);

  // Cargar contadores de mensajes no leídos y contratos pendientes
  useEffect(() => {
    const loadBadges = async () => {
      const [msgRes, contractRes] = await Promise.all([
        fetch("/api/admin/messages"),
        fetch("/api/admin/contracts"),
      ]);
      if (msgRes.ok) {
        const msgs = await msgRes.json();
        setUnreadMessages(msgs.filter((m: any) => m.sender==="artist" && !m.read).length);
      }
      if (contractRes.ok) {
        const contracts = await contractRes.json();
        setPendingContracts(contracts.filter((c: any) => c.status==="pending").length);
      }
    };
    loadBadges();
    const t = setInterval(loadBadges, 15000);
    return () => clearInterval(t);
  }, []);

  const logout = async () => {
    await fetch("/api/admin/logout", { method:"POST" });
    router.push("/admin/login");
  };

  const fmtN   = (n:number) => n>=1000000?`${(n/1000000).toFixed(1)}M`:n>=1000?`${(n/1000).toFixed(1)}K`:String(n);
  const fmtUSD = (n:number) => `$${n.toFixed(2)}`;

  const currentNav = NAV.find(n => n.id === active);

  const getBadge = (id: string) => {
    if (id==="messages")  return unreadMessages;
    if (id==="contracts") return pendingContracts;
    return 0;
  };

  return (
    <div style={{ minHeight:"100vh", background:css.bg,
      display:"flex", fontFamily:"system-ui, -apple-system, sans-serif" }}>

      {/* ─── Sidebar ─── */}
      <div style={{ width:"220px", flexShrink:0, background:css.white,
        borderRight:`1px solid ${css.border}`,
        display:"flex", flexDirection:"column",
        position:"sticky", top:0, height:"100vh" }}>

        {/* Logo */}
        <div style={{ padding:"20px 16px", borderBottom:`1px solid ${css.border}` }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <div style={{ width:"28px", height:"28px", background:css.text,
              borderRadius:"6px", display:"flex", alignItems:"center",
              justifyContent:"center" }}>
              <span style={{ color:"#fff", fontSize:"12px", fontWeight:700 }}>LF</span>
            </div>
            <div>
              <p style={{ fontSize:"13px", fontWeight:600, color:css.text, lineHeight:1 }}>LoyalFox</p>
              <p style={{ fontSize:"11px", color:css.textMute, lineHeight:1.2 }}>Admin</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"8px", overflowY:"auto" }}>
          {GROUPS.map((group) => {
            const items = NAV.filter(n => n.group === group.id);
            return (
              <div key={group.id} style={{ marginBottom:"16px" }}>
                <p style={{ fontSize:"11px", fontWeight:500, color:css.textMute,
                  textTransform:"uppercase", letterSpacing:"0.05em",
                  padding:"4px 8px", marginBottom:"2px" }}>
                  {group.label}
                </p>
                {items.map((item) => {
                  const badgeCount = getBadge(item.id);
                  return (
                    <button key={item.id} onClick={() => setActive(item.id)}
                      style={{ display:"flex", alignItems:"center", gap:"8px",
                        width:"100%", padding:"7px 8px", borderRadius:"6px",
                        border:"none", cursor:"pointer", textAlign:"left",
                        background: active===item.id ? css.accentBg : "transparent",
                        color: active===item.id ? css.text : css.textSub,
                        fontSize:"13px", fontWeight: active===item.id ? 500 : 400,
                        transition:"all .1s", justifyContent:"space-between" }}
                      onMouseEnter={(e) => { if(active!==item.id)(e.currentTarget as HTMLElement).style.background=css.bg; }}
                      onMouseLeave={(e) => { if(active!==item.id)(e.currentTarget as HTMLElement).style.background="transparent"; }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                        <span style={{ fontSize:"13px", opacity:0.7 }}>{item.icon}</span>
                        {item.label}
                      </div>
                      {badgeCount > 0 && (
                        <span style={{ width:"18px", height:"18px", borderRadius:"50%",
                          background:css.red, color:"#fff", fontSize:"10px",
                          fontWeight:700, display:"flex", alignItems:"center",
                          justifyContent:"center", flexShrink:0 }}>
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding:"12px 16px", borderTop:`1px solid ${css.border}` }}>
          <button onClick={logout}
            style={{ width:"100%", padding:"7px 8px", borderRadius:"6px",
              border:`1px solid ${css.border}`, background:"transparent",
              color:css.textSub, fontSize:"13px", cursor:"pointer",
              display:"flex", alignItems:"center", gap:"6px", transition:"all .15s" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = css.redBg;
              (e.currentTarget as HTMLElement).style.color = css.red;
              (e.currentTarget as HTMLElement).style.borderColor = "#fecaca";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = css.textSub;
              (e.currentTarget as HTMLElement).style.borderColor = css.border;
            }}>
            ⎋ Cerrar sesión
          </button>
        </div>
      </div>

      {/* ─── Main ─── */}
      <div style={{ flex:1, overflow:"auto" }}>

        {/* Header */}
        <div style={{ padding:"16px 32px", borderBottom:`1px solid ${css.border}`,
          background:css.white, display:"flex", alignItems:"center",
          justifyContent:"space-between", position:"sticky", top:0, zIndex:50 }}>
          <div>
            <h1 style={{ fontSize:"15px", fontWeight:600, color:css.text, margin:0 }}>
              {currentNav?.label || "Inicio"}
            </h1>
            <p style={{ fontSize:"12px", color:css.textMute, margin:0 }}>
              {new Date().toLocaleDateString("es",{ weekday:"long", day:"numeric", month:"long" })}
            </p>
          </div>
          <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
            {unreadMessages > 0 && (
              <div onClick={() => setActive("messages")}
                style={{ display:"flex", alignItems:"center", gap:"6px", padding:"6px 12px",
                  borderRadius:"6px", cursor:"pointer", background:css.blueBg,
                  border:`1px solid ${css.blueBorder}` }}>
                <span style={{ fontSize:"10px", color:css.blue }}>💬</span>
                <span style={{ fontSize:"12px", fontWeight:500, color:css.blue }}>
                  {unreadMessages} mensaje{unreadMessages>1?"s":""} sin leer
                </span>
              </div>
            )}
            {summary.readyToPay.length > 0 && (
              <div onClick={() => setActive("artist-accounts")}
                style={{ display:"flex", alignItems:"center", gap:"6px", padding:"6px 12px",
                  borderRadius:"6px", cursor:"pointer", background:css.greenBg,
                  border:`1px solid ${css.greenBorder}` }}>
                <span style={{ fontSize:"10px", color:css.green }}>●</span>
                <span style={{ fontSize:"12px", fontWeight:500, color:css.green }}>
                  {summary.readyToPay.length} artista{summary.readyToPay.length>1?"s":""} listos para cobrar
                </span>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding:"32px" }}>

          {/* ─── HOME ─── */}
          {active === "home" && (
            <div style={{ maxWidth:"1200px" }}>
              <div style={{ marginBottom:"28px" }}>
                <h2 style={{ fontSize:"22px", fontWeight:700, color:css.text, marginBottom:"4px" }}>
                  Bienvenido 👋
                </h2>
                <p style={{ fontSize:"13px", color:css.textMute }}>
                  Panel de gestión de LoyalFox Records
                </p>
              </div>

              {/* KPIs financieros */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px", marginBottom:"16px" }}>
                {[
                  { label:"Total bruto generado",  value:fmtUSD(summary.totalRevenue),  sub:"Ingresos totales del sello",            highlight:false },
                  { label:"Pagado a artistas",      value:fmtUSD(summary.totalArtistas), sub:"Suma de regalías de artistas externos", highlight:false },
                  { label:"Ingresos del sello",     value:fmtUSD(summary.totalSello),    sub:"Lo que te queda a ti ✓",               highlight:true  },
                ].map((k,i) => (
                  <div key={i} style={{ background:k.highlight?css.greenBg:css.white,
                    border:`1px solid ${k.highlight?css.greenBorder:css.border}`,
                    borderRadius:"8px", padding:"20px 24px" }}>
                    <p style={{ fontSize:"12px", color:css.textMute, marginBottom:"8px" }}>{k.label}</p>
                    <p style={{ fontSize:"28px", fontWeight:700, marginBottom:"4px", color:k.highlight?css.green:css.text }}>{k.value}</p>
                    <p style={{ fontSize:"11px", color:css.textMute }}>{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* KPIs operativos */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px", marginBottom:"32px" }}>
                {[
                  { label:"Tracks publicados",  value:String(summary.totalTracks),        sub:"En el catálogo"  },
                  { label:"Artistas activos",   value:String(summary.totalArtists),       sub:"Con cuenta"      },
                  { label:"Reproducciones",     value:fmtN(summary.totalStreams),          sub:"Total acumulado" },
                  { label:"Listos para cobrar", value:String(summary.readyToPay.length),  sub:"Superan $50"     },
                ].map((k,i) => (
                  <div key={i} style={{ background:css.white, border:`1px solid ${css.border}`, borderRadius:"8px", padding:"20px 24px" }}>
                    <p style={{ fontSize:"12px", color:css.textMute, marginBottom:"8px" }}>{k.label}</p>
                    <p style={{ fontSize:"22px", fontWeight:700, color:css.text, marginBottom:"2px" }}>{k.value}</p>
                    <p style={{ fontSize:"11px", color:css.textMute }}>{k.sub}</p>
                  </div>
                ))}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                {/* Artistas listos para cobrar */}
                <div style={{ background:css.white, border:`1px solid ${css.border}`, borderRadius:"8px", overflow:"hidden" }}>
                  <div style={{ padding:"16px 20px", borderBottom:`1px solid ${css.border}`,
                    display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <p style={{ fontSize:"13px", fontWeight:600, color:css.text }}>Pagos pendientes</p>
                    <button onClick={() => setActive("artist-accounts")}
                      style={{ fontSize:"12px", color:css.blue, background:"none", border:"none", cursor:"pointer", fontWeight:500 }}>
                      Ver todos →
                    </button>
                  </div>
                  {summary.readyToPay.length === 0 ? (
                    <div style={{ padding:"32px 20px", textAlign:"center" }}>
                      <p style={{ fontSize:"13px", color:css.textMute }}>No hay pagos pendientes</p>
                    </div>
                  ) : summary.readyToPay.map((a,i) => (
                    <div key={a.name} style={{ display:"flex", alignItems:"center",
                      justifyContent:"space-between", padding:"12px 20px",
                      borderBottom:i<summary.readyToPay.length-1?`1px solid ${css.border}`:"none" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                        <div style={{ width:"32px", height:"32px", borderRadius:"50%",
                          background:css.accentBg, display:"flex", alignItems:"center",
                          justifyContent:"center", fontSize:"12px", fontWeight:600, color:css.text }}>
                          {a.name[0].toUpperCase()}
                        </div>
                        <p style={{ fontSize:"13px", fontWeight:500, color:css.text }}>{a.name}</p>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                        <span style={{ fontSize:"13px", fontWeight:600, color:css.green }}>{fmtUSD(a.amount)}</span>
                        <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 8px",
                          borderRadius:"9999px", fontSize:"11px", fontWeight:500,
                          color:css.green, background:css.greenBg, border:`1px solid ${css.greenBorder}` }}>
                          Listo
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Accesos rápidos */}
                <div style={{ background:css.white, border:`1px solid ${css.border}`, borderRadius:"8px", overflow:"hidden" }}>
                  <div style={{ padding:"16px 20px", borderBottom:`1px solid ${css.border}` }}>
                    <p style={{ fontSize:"13px", fontWeight:600, color:css.text }}>Accesos rápidos</p>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1px", background:css.border }}>
                    {[
                      { id:"analytics"       as Tab, label:"Analytics",  icon:"↗", desc:"Ver estadísticas"   },
                      { id:"artist-accounts" as Tab, label:"Artistas",   icon:"♪", desc:"Regalías y pagos"   },
                      { id:"messages"        as Tab, label:"Mensajes",   icon:"💬", desc:"Chat con artistas"  },
                      { id:"contracts"       as Tab, label:"Contratos",  icon:"📄", desc:"Firmas digitales"   },
                    ].map((item) => (
                      <button key={item.id} onClick={() => setActive(item.id)}
                        style={{ padding:"16px 20px", background:css.white, border:"none",
                          cursor:"pointer", textAlign:"left", transition:"background .1s" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background=css.bg; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background=css.white; }}>
                        <p style={{ fontSize:"18px", marginBottom:"6px" }}>{item.icon}</p>
                        <p style={{ fontSize:"13px", fontWeight:500, color:css.text, marginBottom:"2px" }}>{item.label}</p>
                        <p style={{ fontSize:"11px", color:css.textMute }}>{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {active === "analytics"         && <AdminAnalytics />}
          {active === "playlists"         && <AdminPlaylists />}
          {active === "tracks"            && <AdminTracks />}
          {active === "artists"           && <AdminArtists />}
          {active === "streamers"         && <AdminStreamers />}
          {active === "artist-accounts"   && <AdminArtistAccounts />}
          {active === "streamer-accounts" && <AdminStreamerAccounts />}
          {active === "posts"             && <AdminPosts />}
          {active === "videos"            && <AdminVideos />}
          {active === "instagram"         && <AdminInstagram />}
          {active === "press"             && <AdminArtistPress />}
          {active === "send-demo"         && <AdminSendDemo />}
          {active === "messages"          && <AdminMessages />}
          {active === "contracts"         && <AdminContracts />}
        </div>
      </div>
    </div>
  );
}
