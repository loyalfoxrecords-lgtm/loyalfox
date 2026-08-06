"use client";
import { useState, useEffect, useRef } from "react";
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
type Message = {
  id: string; sender: "artist"|"admin"; message: string;
  read: boolean; created_at: string;
};
type Contract = {
  id: string; title: string; description: string; pdf_url: string;
  status: "pending"|"signed"; signature_url: string|null;
  signed_at: string|null; created_at: string;
};

const c = {
  bg:"#f9fafb", white:"#ffffff", border:"#e5e7eb", borderLight:"#f3f4f6",
  text:"#111827", textSub:"#6b7280", textMute:"#9ca3af", accent:"#111827",
  green:"#16a34a", greenBg:"#f0fdf4", greenBorder:"#bbf7d0",
  blue:"#2563eb", blueBg:"#eff6ff", blueBorder:"#bfdbfe",
  red:"#dc2626", redBg:"#fef2f2", redBorder:"#fecaca",
  yellow:"#d97706", yellowBg:"#fffbeb", yellowBorder:"#fde68a",
  purple:"#7c3aed",
};

const CHART_COLORS = [c.blue, c.green, c.purple, "#f59e0b", "#ef4444", "#06b6d4", "#84cc16", "#f97316"];
type Lang = "es"|"en";

const i18n = {
  es: {
    portal:"Portal de artistas", welcome:"Bienvenido de nuevo",
    months:"meses de datos", month1:"mes de datos", logout:"Cerrar sesión",
    kpi1:"Streams totales", kpi1sub:"Acumulado",
    kpi2:"Ingresos totales", kpi2sub:"Tu parte",
    kpi3:"Ya cobrado", kpi3sub:"Pagado",
    kpi4:"Pendiente de cobro", kpi4sub:"Acumulando",
    tabOverview:"Resumen", tabMonthly:"Por mes", tabTracks:"Tracks",
    tabPayments:"Pagos", tabFaq:"FAQ", tabContracts:"Contratos", tabChat:"Mensajes",
    streamEvolution:"Evolución de streams", revenueByMonth:"Ingresos por mes (USD)",
    topTracks:"Top tracks", byPlatform:"Por plataforma",
    noData:"Sin datos", noDataFilter:"Sin datos para este filtro",
    clickTracks:"Ver tracks de este mes →",
    allMonths:"Todos", allPlatforms:"Todas las plataformas",
    showBreakdown:"Ver desglose →", hideBreakdown:"Ocultar ←",
    breakdown:"Desglose por plataforma", totalStreams:"Total streams", totalRevenue:"Total ingresos",
    platformNote:"El ingreso por stream varía según la plataforma. YouTube Premium y Spotify pagan más que TikTok o plataformas ad-supported.",
    paymentsTitle:"Historial mes a mes",
    kpiEarned:"Total generado", kpiPaid:"Total cobrado", kpiPending:"Pendiente de pago",
    nextPayment:"Próximo pago", progress:"Progreso hacia el mínimo de $50.00",
    readyLabel:"✓ Listo para cobrar", accumulatingLabel:"Acumulando",
    readyMsg:(label:string) => `✓ Superas el mínimo — recibirás el pago en ${label}`,
    pendingMsg:(amt:string) => `Faltan ${amt} para el mínimo. Tu saldo se acumulará al siguiente trimestre.`,
    policy:"Pagos trimestrales — enero, abril, julio y octubre. Mínimo por pago: $50.00. El saldo se acumula si no llegas al mínimo. Para cualquier duda:",
    historyMes:"Mes", historyStreams:"Streams", historyShare:"Tu parte", historyStatus:"Estado", historyDate:"Fecha de pago",
    paid:"✓ Pagado", accumulating:"Acumulando",
    faqTitle:"Preguntas frecuentes",
    faqs:[
      { q:"¿Por qué no se ven reflejadas las estadísticas del último mes de Spotify?", a:"Spotify reporta las estadísticas con un retraso de aproximadamente 2 meses. Es completamente normal y aplica a todas las plataformas." },
      { q:"¿Cuándo recibiré mi pago?", a:"Los pagos se realizan trimestralmente: enero, abril, julio y octubre. Mínimo $50.00. Si no llegas, el saldo se acumula." },
      { q:"¿Por qué los ingresos son bajos si tengo muchas reproducciones?", a:"Spotify paga entre $0.003 y $0.005 por stream, YouTube entre $0.001 y $0.003, TikTok menos aún. Son cifras del sector." },
      { q:"¿Qué es el ingreso bruto y cuál es mi parte?", a:"El ingreso bruto es el total que genera tu música. Tu parte es el porcentaje acordado (normalmente 60%), ya calculado en tu dashboard." },
      { q:"¿Cómo actualizo mi método de pago?", a:"Escríbenos a info@loyalfoxrecords.com con tu nombre artístico y el nuevo método (PayPal o IBAN)." },
    ],
    contractsTitle:"Mis contratos",
    contractsPending:"Pendiente de firma",
    contractsSigned:"Firmado",
    contractsSign:"Firmar contrato",
    contractsSigning:"Guardando firma...",
    contractsViewPdf:"Ver PDF",
    contractsNoData:"No tienes contratos aún.",
    contractsSignTitle:"Firma tu contrato",
    contractsSignSub:"Dibuja tu firma en el recuadro con el ratón o el dedo.",
    contractsClear:"Limpiar",
    contractsConfirm:"Confirmar firma",
    contractsSignedMsg:"✓ Contrato firmado correctamente.",
    chatTitle:"Mensajes con LoyalFox Records",
    chatPlaceholder:"Escribe tu mensaje...",
    chatSend:"Enviar",
    chatNoMessages:"Sin mensajes aún. Escríbenos con cualquier duda.",
    chatYou:"Tú",
    chatAdmin:"LoyalFox Records",
  },
  en: {
    portal:"Artist portal", welcome:"Welcome back",
    months:"months of data", month1:"month of data", logout:"Log out",
    kpi1:"Total streams", kpi1sub:"Accumulated",
    kpi2:"Total earnings", kpi2sub:"Your share",
    kpi3:"Already paid", kpi3sub:"Transferred",
    kpi4:"Pending payment", kpi4sub:"Accumulating",
    tabOverview:"Overview", tabMonthly:"By month", tabTracks:"Tracks",
    tabPayments:"Payments", tabFaq:"FAQ", tabContracts:"Contracts", tabChat:"Messages",
    streamEvolution:"Stream evolution", revenueByMonth:"Revenue by month (USD)",
    topTracks:"Top tracks", byPlatform:"By platform",
    noData:"No data yet", noDataFilter:"No data for this filter",
    clickTracks:"View tracks for this month →",
    allMonths:"All", allPlatforms:"All platforms",
    showBreakdown:"View breakdown →", hideBreakdown:"Hide ←",
    breakdown:"Platform breakdown", totalStreams:"Total streams", totalRevenue:"Total revenue",
    platformNote:"Revenue per stream varies by platform. YouTube Premium and Spotify pay more than TikTok or ad-supported platforms.",
    paymentsTitle:"Month by month history",
    kpiEarned:"Total generated", kpiPaid:"Total paid", kpiPending:"Pending payment",
    nextPayment:"Next payment", progress:"Progress towards $50.00 minimum",
    readyLabel:"✓ Ready to collect", accumulatingLabel:"Accumulating",
    readyMsg:(label:string) => `✓ You've reached the minimum — payment in ${label}`,
    pendingMsg:(amt:string) => `${amt} remaining. Your balance will roll over to the next quarter.`,
    policy:"Quarterly payments — January, April, July and October. Minimum: $50.00. Balance accumulates if you don't reach the minimum. Questions:",
    historyMes:"Month", historyStreams:"Streams", historyShare:"Your share", historyStatus:"Status", historyDate:"Payment date",
    paid:"✓ Paid", accumulating:"Accumulating",
    faqTitle:"Frequently asked questions",
    faqs:[
      { q:"Why don't the latest Spotify stats show up?", a:"Spotify reports stats with ~2 month delay. Streams from June appear in August. This is normal across all platforms." },
      { q:"When will I receive my payment?", a:"Quarterly: January, April, July, October. Minimum $50.00. Balance rolls over if not reached." },
      { q:"Why are earnings low with many streams?", a:"Spotify pays $0.003–$0.005 per stream, YouTube $0.001–$0.003, TikTok less. Industry-wide figures." },
      { q:"What is gross revenue and what is my share?", a:"Gross revenue is total generated by your music. Your share is the agreed % (usually 60%), already shown in your dashboard." },
      { q:"How do I update my payment method?", a:"Email info@loyalfoxrecords.com with your artist name and new method (PayPal or IBAN)." },
    ],
    contractsTitle:"My contracts",
    contractsPending:"Pending signature",
    contractsSigned:"Signed",
    contractsSign:"Sign contract",
    contractsSigning:"Saving signature...",
    contractsViewPdf:"View PDF",
    contractsNoData:"No contracts yet.",
    contractsSignTitle:"Sign your contract",
    contractsSignSub:"Draw your signature in the box below with mouse or finger.",
    contractsClear:"Clear",
    contractsConfirm:"Confirm signature",
    contractsSignedMsg:"✓ Contract signed successfully.",
    chatTitle:"Messages with LoyalFox Records",
    chatPlaceholder:"Write your message...",
    chatSend:"Send",
    chatNoMessages:"No messages yet. Write to us with any question.",
    chatYou:"You",
    chatAdmin:"LoyalFox Records",
  },
};

const fmt          = (n:number) => n>=1000000?`${(n/1000000).toFixed(1)}M`:n>=1000?`${(n/1000).toFixed(1)}K`:String(n);
const fmtUSD       = (n:number) => `$${Number(n).toFixed(4)}`;
const fmtUSD2      = (n:number) => `$${Number(n).toFixed(2)}`;
const fmtMonth     = (m:string,lang:Lang) => { try { return new Date(m+"-02").toLocaleString(lang==="en"?"en":"es",{month:"short",year:"numeric"}); } catch { return m; } };
const fmtMonthFull = (m:string,lang:Lang) => { try { return new Date(m+"-02").toLocaleString(lang==="en"?"en":"es",{month:"long",year:"numeric"}); } catch { return m; } };
const fmtTime      = (d:string) => { const date=new Date(d); const diff=Date.now()-date.getTime(); if(diff<60000)return"Now"; if(diff<3600000)return`${Math.floor(diff/60000)}m`; if(diff<86400000)return date.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}); return date.toLocaleDateString([],{day:"numeric",month:"short"}); };

const base:React.CSSProperties = { fontFamily:"system-ui, -apple-system, sans-serif" };

const ChartTooltip = ({ active, payload, label }:any) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ background:c.white, border:`1px solid ${c.border}`, borderRadius:"8px", padding:"10px 14px", boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }}>
      <p style={{ ...base, fontSize:"12px", fontWeight:500, color:c.textSub, marginBottom:"6px" }}>{label}</p>
      {payload.map((p:any,i:number) => (
        <p key={i} style={{ ...base, fontSize:"13px", fontWeight:600, color:c.text }}>
          {p.name}: {typeof p.value==="number"&&p.value<10?fmtUSD(p.value):fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Componente de firma ───
function SignatureCanvas({ onSave, onCancel, t }: {
  onSave:(data:string)=>void; onCancel:()=>void; t:typeof i18n.en;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing   = useRef(false);

  const startDraw = (e:React.MouseEvent|React.TouchEvent) => {
    drawing.current = true;
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    ctx.beginPath();
    const pos = getPos(e, canvas);
    ctx.moveTo(pos.x, pos.y);
  };
  const draw = (e:React.MouseEvent|React.TouchEvent) => {
    if (!drawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;
    ctx.strokeStyle = "#111827";
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };
  const endDraw = () => { drawing.current = false; };
  const clear   = () => {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
  };
  const getPos = (e:any, canvas:HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) return { x:e.touches[0].clientX-rect.left, y:e.touches[0].clientY-rect.top };
    return { x:e.clientX-rect.left, y:e.clientY-rect.top };
  };
  const save = () => {
    const canvas = canvasRef.current!;
    onSave(canvas.toDataURL("image/png"));
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
      zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:c.white, borderRadius:"12px", padding:"28px",
        width:"500px", maxWidth:"95vw" }}>
        <h3 style={{ ...base, fontSize:"16px", fontWeight:700, color:c.text, marginBottom:"6px" }}>
          {t.contractsSignTitle}
        </h3>
        <p style={{ ...base, fontSize:"13px", color:c.textMute, marginBottom:"16px" }}>
          {t.contractsSignSub}
        </p>
        <canvas ref={canvasRef} width={450} height={160}
          style={{ border:`2px solid ${c.border}`, borderRadius:"8px",
            width:"100%", cursor:"crosshair", touchAction:"none",
            background:"#fafafa", display:"block" }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        <div style={{ display:"flex", gap:"8px", marginTop:"16px", justifyContent:"flex-end" }}>
          <button onClick={clear}
            style={{ ...base, padding:"8px 16px", borderRadius:"6px", border:`1px solid ${c.border}`,
              background:c.white, fontSize:"13px", cursor:"pointer", color:c.textSub }}>
            {t.contractsClear}
          </button>
          <button onClick={onCancel}
            style={{ ...base, padding:"8px 16px", borderRadius:"6px", border:`1px solid ${c.border}`,
              background:c.white, fontSize:"13px", cursor:"pointer", color:c.textSub }}>
            Cancelar
          </button>
          <button onClick={save}
            style={{ ...base, padding:"8px 20px", borderRadius:"6px", border:"none",
              background:c.accent, color:c.white, fontSize:"13px",
              fontWeight:600, cursor:"pointer" }}>
            {t.contractsConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ArtistDashboard() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("en");
  const t = i18n[lang];

  const [name, setName]               = useState("");
  const [artistName, setArtistName]   = useState("");
  const [royalties, setRoyalties]     = useState<Royalty[]>([]);
  const [tracks, setTracks]           = useState<Track[]>([]);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [contracts, setContracts]     = useState<Contract[]>([]);
  const [loading, setLoading]         = useState(true);

  const [activeTab, setActiveTab]     = useState<"overview"|"monthly"|"tracks"|"payments"|"faq"|"contracts"|"chat">("overview");
  const [activeMonth, setActiveMonth] = useState<string|null>(null);
  const [activeStore, setActiveStore] = useState<string|null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string|null>(null);
  const [openFaq, setOpenFaq]         = useState<number|null>(null);

  // Chat
  const [chatMsg, setChatMsg]         = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef                 = useRef<HTMLDivElement>(null);

  // Contratos
  const [signingId, setSigningId]     = useState<string|null>(null);
  const [signingLoading, setSigningLoading] = useState(false);
  const [signedIds, setSignedIds]     = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/artists-portal/me")
      .then(r => { if(!r.ok) router.push("/artists-portal/login"); return r.json(); })
      .then(data => {
        setName(data.name); setArtistName(data.artist_name);
        setRoyalties(data.royalties||[]); setTracks(data.tracks||[]);
        setLoading(false);
      }).catch(() => router.push("/artists-portal/login"));
  }, [router]);

  useEffect(() => {
    if (activeTab==="chat") loadMessages();
    if (activeTab==="contracts") loadContracts();
  }, [activeTab]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, activeTab]);

  // Poll mensajes cada 10s cuando está en chat
  useEffect(() => {
    if (activeTab!=="chat") return;
    const t = setInterval(loadMessages, 10000);
    return () => clearInterval(t);
  }, [activeTab]);

  const loadMessages = async () => {
    const res = await fetch("/api/artists-portal/messages");
    if (res.ok) setMessages(await res.json());
  };

  const loadContracts = async () => {
    const res = await fetch("/api/artists-portal/contracts");
    if (res.ok) setContracts(await res.json());
  };

  const sendMessage = async () => {
    if (!chatMsg.trim()) return;
    setChatSending(true);
    await fetch("/api/artists-portal/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ message:chatMsg.trim() }),
    });
    setChatMsg("");
    await loadMessages();
    setChatSending(false);
  };

  const signContract = async (contractId:string, signatureData:string) => {
  setSigningLoading(true);
  const res = await fetch("/api/artists-portal/contracts/sign", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ contract_id:contractId, signature_data:signatureData }),
  });
  if (res.ok) {
    const data = await res.json();
    setSignedIds(s => new Set([...s, contractId]));
    await loadContracts();
    // Abrir PDF firmado automáticamente
    if (data.signed_pdf_url) {
      window.open(data.signed_pdf_url, "_blank");
    }
  }
  setSigningId(null);
  setSigningLoading(false);
};

  const logout = async () => {
    await fetch("/api/artists-portal/logout", { method:"POST" });
    router.push("/artists-portal/login");
  };

  const totalStreams  = royalties.reduce((a,r) => a+r.total_streams, 0);
  const totalEarned   = royalties.reduce((a,r) => a+Number(r.artist_share), 0);
  const totalPaid     = royalties.filter(r=>r.paid).reduce((a,r) => a+Number(r.artist_share), 0);
  const totalPending  = royalties.filter(r=>!r.paid).reduce((a,r) => a+Number(r.artist_share), 0);

  const monthlyChart = [...royalties].reverse().map(r => ({
    label:fmtMonth(r.month.slice(0,7),lang), streams:r.total_streams, revenue:Number(r.artist_share),
  }));

  const filteredTracks = activeMonth ? tracks.filter(tr=>tr.month===activeMonth) : tracks;
  const topTracks = Object.values(
    filteredTracks.reduce((acc:Record<string,any>,tr) => {
      if(!acc[tr.track_name]) acc[tr.track_name]={name:tr.track_name,streams:0,revenue:0};
      acc[tr.track_name].streams+=tr.streams; acc[tr.track_name].revenue+=tr.revenue;
      return acc;
    },{})
  ).sort((a:any,b:any)=>b.streams-a.streams) as any[];

  const byStore = Object.values(
    filteredTracks.reduce((acc:Record<string,any>,tr) => {
      if(!acc[tr.store]) acc[tr.store]={name:tr.store,streams:0,revenue:0};
      acc[tr.store].streams+=tr.streams; acc[tr.store].revenue+=tr.revenue;
      return acc;
    },{})
  ).sort((a:any,b:any)=>b.streams-a.streams) as any[];

  const storeFilteredTracks = activeStore
    ? Object.values(filteredTracks.filter(tr=>tr.store===activeStore).reduce((acc:Record<string,any>,tr)=>{
        if(!acc[tr.track_name]) acc[tr.track_name]={name:tr.track_name,streams:0,revenue:0};
        acc[tr.track_name].streams+=tr.streams; acc[tr.track_name].revenue+=tr.revenue; return acc;
      },{})).sort((a:any,b:any)=>b.streams-a.streams) as any[]
    : topTracks;

  const allStores = Array.from(new Set(filteredTracks.map(tr=>tr.store).filter(Boolean)));

  const trackBreakdown = selectedTrack
    ? Object.values(filteredTracks.filter(tr=>tr.track_name===selectedTrack).reduce((acc:Record<string,any>,tr)=>{
        if(!acc[tr.store]) acc[tr.store]={store:tr.store,streams:0,revenue:0};
        acc[tr.store].streams+=tr.streams; acc[tr.store].revenue+=tr.revenue; return acc;
      },{})).sort((a:any,b:any)=>b.streams-a.streams) as any[]
    : [];

  const THRESHOLD   = 50;
  const now         = new Date();
  const nextMonthIdx = [0,3,6,9].find(m=>m>now.getMonth())??0;
  const nextYear    = nextMonthIdx===0?now.getFullYear()+1:now.getFullYear();
  const nextLabel   = new Date(nextYear,nextMonthIdx,1).toLocaleString(lang==="en"?"en":"es",{month:"long",year:"numeric"});
  const canReceive  = totalPending>=THRESHOLD;
  const progressPct = Math.max(Math.min((totalPending/THRESHOLD)*100,100),3);

  const unreadCount = messages.filter(m=>m.sender==="admin"&&!m.read).length;
  const pendingContracts = contracts.filter(c=>c.status==="pending").length;

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:c.bg }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:"36px", height:"36px", borderRadius:"50%", border:`2px solid ${c.border}`,
          borderTopColor:c.text, margin:"0 auto 12px", animation:"spin 0.8s linear infinite" }} />
        <p style={{ ...base, fontSize:"13px", color:c.textMute }}>Loading...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const card:React.CSSProperties        = { background:c.white, border:`1px solid ${c.border}`, borderRadius:"8px", overflow:"hidden" };
  const cardHeader:React.CSSProperties  = { padding:"14px 20px", borderBottom:`1px solid ${c.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" };
  const cardTitle:React.CSSProperties   = { ...base, fontSize:"13px", fontWeight:600, color:c.text };
  const lbl:React.CSSProperties         = { ...base, fontSize:"11px", fontWeight:500, color:c.textMute, textTransform:"uppercase", letterSpacing:"0.04em" };
  const badge = (ok:boolean):React.CSSProperties => ({
    ...base, display:"inline-flex", alignItems:"center", padding:"2px 8px", borderRadius:"9999px",
    fontSize:"11px", fontWeight:500,
    color:ok?c.green:c.yellow, background:ok?c.greenBg:c.yellowBg,
    border:`1px solid ${ok?c.greenBorder:c.yellowBorder}`,
  });

  const tabBtn = (id:string, label:string, badge?:number) => (
    <button key={id} onClick={()=>setActiveTab(id as any)}
      style={{ ...base, padding:"10px 16px", fontSize:"13px", fontWeight:500,
        background:"transparent", border:"none", cursor:"pointer", position:"relative",
        color:activeTab===id?c.text:c.textMute,
        borderBottom:activeTab===id?`2px solid ${c.text}`:"2px solid transparent",
        marginBottom:"-1px", transition:"all .15s", display:"flex", alignItems:"center", gap:"6px" }}>
      {label}
      {badge && badge>0 ? (
        <span style={{ ...base, width:"18px", height:"18px", borderRadius:"50%",
          background:c.red, color:c.white, fontSize:"10px", fontWeight:700,
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          {badge}
        </span>
      ) : null}
    </button>
  );

  return (
    <div style={{ minHeight:"100vh", background:c.bg, color:c.text }}>
      {signingId && (
        <SignatureCanvas
          t={t}
          onCancel={() => setSigningId(null)}
          onSave={(data) => signContract(signingId, data)}
        />
      )}

      {/* NAV */}
      <nav style={{ height:"60px", display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 32px", background:c.white, borderBottom:`1px solid ${c.border}`,
        position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <span style={{ ...base, fontSize:"15px", fontWeight:700, color:c.text, letterSpacing:"-0.3px" }}>LoyalFox Records</span>
          <span style={{ width:"1px", height:"16px", background:c.border }} />
          <span style={{ ...base, fontSize:"12px", color:c.textMute }}>{t.portal}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <div style={{ display:"flex", gap:"2px", background:c.bg, borderRadius:"6px", padding:"2px", border:`1px solid ${c.border}` }}>
            {(["en","es"] as Lang[]).map(l => (
              <button key={l} onClick={()=>setLang(l)}
                style={{ ...base, padding:"4px 10px", borderRadius:"4px", fontSize:"12px", fontWeight:500,
                  border:"none", cursor:"pointer", background:lang===l?c.white:"transparent",
                  color:lang===l?c.text:c.textMute, boxShadow:lang===l?"0 1px 3px rgba(0,0,0,0.08)":"none" }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{ textAlign:"right" }}>
            <p style={{ ...base, fontSize:"13px", fontWeight:600, color:c.text }}>{artistName}</p>
            <p style={{ ...base, fontSize:"11px", color:c.textMute }}>{name}</p>
          </div>
          <button onClick={logout}
            style={{ ...base, padding:"6px 14px", borderRadius:"6px", border:`1px solid ${c.border}`,
              background:c.white, fontSize:"13px", color:c.textSub, cursor:"pointer" }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=c.red;(e.currentTarget as HTMLElement).style.color=c.red;}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=c.border;(e.currentTarget as HTMLElement).style.color=c.textSub;}}>
            {t.logout}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth:"1200px", margin:"0 auto", padding:"32px 24px" }}>

        {/* HEADER */}
        <div style={{ marginBottom:"32px" }}>
          <p style={{ ...base, fontSize:"13px", color:c.textMute, marginBottom:"4px" }}>{t.welcome}</p>
          <h1 style={{ ...base, fontSize:"28px", fontWeight:700, color:c.text, letterSpacing:"-0.5px", marginBottom:"4px" }}>{artistName}</h1>
          <p style={{ ...base, fontSize:"13px", color:c.textMute }}>
            LoyalFox Records · {royalties.length} {royalties.length===1?t.month1:t.months}
          </p>
        </div>

        {/* KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"16px", marginBottom:"32px" }}>
          {[
            { label:t.kpi1, value:fmt(totalStreams),     sub:t.kpi1sub, color:c.text  },
            { label:t.kpi2, value:fmtUSD2(totalEarned),  sub:t.kpi2sub, color:c.blue  },
            { label:t.kpi3, value:fmtUSD2(totalPaid),    sub:t.kpi3sub, color:c.green },
            { label:t.kpi4, value:fmtUSD2(totalPending), sub:t.kpi4sub, color:canReceive?c.green:c.yellow },
          ].map((k,i) => (
            <div key={i} style={{ ...card, padding:"20px 24px" }}>
              <p style={lbl}>{k.label}</p>
              <p style={{ ...base, fontSize:"28px", fontWeight:700, color:k.color, lineHeight:1, margin:"8px 0 4px" }}>{k.value}</p>
              <p style={{ ...base, fontSize:"12px", color:c.textMute }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display:"flex", gap:"0", marginBottom:"24px", borderBottom:`1px solid ${c.border}`, flexWrap:"wrap" }}>
          {tabBtn("overview",  t.tabOverview)}
          {tabBtn("monthly",   t.tabMonthly)}
          {tabBtn("tracks",    t.tabTracks)}
          {tabBtn("payments",  t.tabPayments)}
          {tabBtn("contracts", t.tabContracts, pendingContracts)}
          {tabBtn("chat",      t.tabChat, unreadCount)}
          {tabBtn("faq",       t.tabFaq)}
        </div>

        {/* OVERVIEW */}
        {activeTab==="overview" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
            {monthlyChart.length>0 && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                <div style={card}>
                  <div style={cardHeader}><p style={cardTitle}>{t.streamEvolution}</p></div>
                  <div style={{ padding:"20px" }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={monthlyChart}>
                        <defs>
                          <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={c.blue} stopOpacity={0.15}/>
                            <stop offset="95%" stopColor={c.blue} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="label" tick={{ fontFamily:"system-ui", fontSize:11, fill:c.textMute }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontFamily:"system-ui", fontSize:11, fill:c.textMute }} tickFormatter={fmt} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="streams" stroke={c.blue} strokeWidth={2} fill="url(#sg)" name="Streams" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div style={card}>
                  <div style={cardHeader}><p style={cardTitle}>{t.revenueByMonth}</p></div>
                  <div style={{ padding:"20px" }}>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={monthlyChart}>
                        <defs>
                          <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={c.green} stopOpacity={0.15}/>
                            <stop offset="95%" stopColor={c.green} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="label" tick={{ fontFamily:"system-ui", fontSize:11, fill:c.textMute }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontFamily:"system-ui", fontSize:11, fill:c.textMute }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="revenue" stroke={c.green} strokeWidth={2} fill="url(#rg)" name={lang==="en"?"Revenue $":"Ingresos $"} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
              <div style={card}>
                <div style={cardHeader}><p style={cardTitle}>{t.topTracks}</p></div>
                <div>
                  {topTracks.slice(0,5).map((tr,i) => (
                    <div key={tr.name} style={{ display:"flex", alignItems:"center", gap:"12px",
                      padding:"12px 20px", borderBottom:i<4?`1px solid ${c.borderLight}`:"none" }}>
                      <span style={{ ...base, fontSize:"12px", color:c.textMute, minWidth:"20px", fontWeight:500 }}>{i+1}</span>
                      <span style={{ ...base, fontSize:"13px", color:c.text, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:500 }}>{tr.name}</span>
                      <div style={{ width:"60px", height:"4px", background:c.borderLight, borderRadius:"2px" }}>
                        <div style={{ height:"100%", background:c.blue, borderRadius:"2px", width:`${(tr.streams/topTracks[0]?.streams)*100}%` }} />
                      </div>
                      <span style={{ ...base, fontSize:"12px", color:c.blue, fontWeight:600, minWidth:"40px", textAlign:"right" }}>{fmt(tr.streams)}</span>
                    </div>
                  ))}
                  {topTracks.length===0 && <p style={{ ...base, fontSize:"13px", color:c.textMute, padding:"32px", textAlign:"center" }}>{t.noData}</p>}
                </div>
              </div>
              <div style={card}>
                <div style={cardHeader}><p style={cardTitle}>{t.byPlatform}</p></div>
                <div style={{ padding:"20px" }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={byStore.slice(0,6)} layout="vertical">
                      <XAxis type="number" tick={{ fontFamily:"system-ui", fontSize:11, fill:c.textMute }} tickFormatter={fmt} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontFamily:"system-ui", fontSize:11, fill:c.textSub }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="streams" name="Streams" radius={[0,4,4,0]}>
                        {byStore.slice(0,6).map((_,i) => <Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MONTHLY */}
        {activeTab==="monthly" && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"16px" }}>
            {royalties.map(r => (
              <div key={r.id}
                onClick={() => { setActiveMonth(activeMonth===r.month?null:r.month); setActiveStore(null); setSelectedTrack(null); setActiveTab("tracks"); }}
                style={{ ...card, padding:"20px", cursor:"pointer", transition:"box-shadow .15s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow="0 4px 12px rgba(0,0,0,0.08)"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow="none"}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" }}>
                  <p style={{ ...base, fontSize:"15px", fontWeight:600, color:c.text, textTransform:"capitalize" }}>
                    {fmtMonthFull(r.month.slice(0,7),lang)}
                  </p>
                  <span style={badge(r.paid)}>{r.paid?t.paid:t.accumulating}</span>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                  <div>
                    <p style={lbl}>Streams</p>
                    <p style={{ ...base, fontSize:"22px", fontWeight:700, color:c.text, lineHeight:1, marginTop:"4px" }}>{fmt(r.total_streams)}</p>
                  </div>
                  <div>
                    <p style={lbl}>{lang==="en"?"Your share":"Tu parte"}</p>
                    <p style={{ ...base, fontSize:"22px", fontWeight:700, color:c.green, lineHeight:1, marginTop:"4px" }}>{fmtUSD(r.artist_share)}</p>
                  </div>
                </div>
                <p style={{ ...base, fontSize:"12px", color:c.textMute, marginTop:"14px" }}>{t.clickTracks}</p>
              </div>
            ))}
            {royalties.length===0 && <p style={{ ...base, fontSize:"13px", color:c.textMute, gridColumn:"1/-1", textAlign:"center", padding:"48px" }}>{t.noData}</p>}
          </div>
        )}

        {/* TRACKS */}
        {activeTab==="tracks" && (
          <div style={{ display:"grid", gridTemplateColumns:selectedTrack?"1fr 320px":"1fr", gap:"16px" }}>
            <div>
              <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"10px" }}>
                <button onClick={()=>{setActiveMonth(null);setActiveStore(null);setSelectedTrack(null);}}
                  style={{ ...base, padding:"5px 12px", borderRadius:"6px", fontSize:"12px", fontWeight:500,
                    cursor:"pointer", border:`1px solid ${c.border}`, background:!activeMonth?c.text:c.white, color:!activeMonth?c.white:c.textSub }}>
                  {t.allMonths}
                </button>
                {royalties.map(r => (
                  <button key={r.month} onClick={()=>{setActiveMonth(r.month);setActiveStore(null);setSelectedTrack(null);}}
                    style={{ ...base, padding:"5px 12px", borderRadius:"6px", fontSize:"12px", fontWeight:500,
                      cursor:"pointer", border:`1px solid ${c.border}`, background:activeMonth===r.month?c.text:c.white, color:activeMonth===r.month?c.white:c.textSub }}>
                    {fmtMonth(r.month.slice(0,7),lang)}
                  </button>
                ))}
              </div>
              {allStores.length>0 && (
                <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", marginBottom:"16px" }}>
                  <button onClick={()=>setActiveStore(null)}
                    style={{ ...base, padding:"4px 10px", borderRadius:"6px", fontSize:"11px",
                      cursor:"pointer", border:`1px solid ${c.border}`, background:!activeStore?c.accent:c.white, color:!activeStore?c.white:c.textSub }}>
                    {t.allPlatforms}
                  </button>
                  {allStores.map(store => (
                    <button key={store} onClick={()=>setActiveStore(activeStore===store?null:store)}
                      style={{ ...base, padding:"4px 10px", borderRadius:"6px", fontSize:"11px",
                        cursor:"pointer", border:`1px solid ${c.border}`, background:activeStore===store?c.accent:c.white, color:activeStore===store?c.white:c.textSub }}>
                      {store}
                    </button>
                  ))}
                </div>
              )}
              <div style={card}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ background:c.bg }}>
                      {["#","Track","Streams",lang==="en"?"Revenue":"Ingresos",""].map((h,i) => (
                        <th key={i} style={{ ...base, padding:"10px 16px", textAlign:"left", fontSize:"11px", fontWeight:500,
                          color:c.textMute, borderBottom:`1px solid ${c.border}`, textTransform:"uppercase", letterSpacing:"0.04em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {storeFilteredTracks.length===0 ? (
                      <tr><td colSpan={5} style={{ ...base, padding:"40px", textAlign:"center", fontSize:"13px", color:c.textMute }}>{t.noDataFilter}</td></tr>
                    ) : storeFilteredTracks.map((tr:any,i:number) => (
                      <tr key={tr.name}
                        onClick={()=>setSelectedTrack(selectedTrack===tr.name?null:tr.name)}
                        style={{ cursor:"pointer", background:selectedTrack===tr.name?c.blueBg:i%2===0?c.white:c.bg, borderBottom:`1px solid ${c.borderLight}`, transition:"background .1s" }}
                        onMouseEnter={e=>{if(selectedTrack!==tr.name)(e.currentTarget as HTMLElement).style.background=c.bg;}}
                        onMouseLeave={e=>{if(selectedTrack!==tr.name)(e.currentTarget as HTMLElement).style.background=i%2===0?c.white:c.bg;}}>
                        <td style={{ ...base, padding:"12px 16px", fontSize:"12px", color:c.textMute }}>{i+1}</td>
                        <td style={{ ...base, padding:"12px 16px", fontSize:"13px", fontWeight:500, color:selectedTrack===tr.name?c.blue:c.text }}>
                          {tr.name}
                          <div style={{ width:`${(tr.streams/storeFilteredTracks[0]?.streams)*100}%`, height:"2px", background:c.blue, borderRadius:"1px", marginTop:"4px", opacity:0.3 }} />
                        </td>
                        <td style={{ ...base, padding:"12px 16px", fontSize:"13px", fontWeight:600, color:c.text }}>{fmt(tr.streams)}</td>
                        <td style={{ ...base, padding:"12px 16px", fontSize:"13px", color:c.green, fontWeight:600 }}>{fmtUSD(tr.revenue)}</td>
                        <td style={{ ...base, padding:"12px 16px", fontSize:"12px", color:c.blue }}>{selectedTrack===tr.name?t.hideBreakdown:t.showBreakdown}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {selectedTrack && (
              <div style={{ ...card, padding:"20px", position:"sticky", top:"80px", height:"fit-content", maxHeight:"80vh", overflowY:"auto" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" }}>
                  <div>
                    <p style={lbl}>{t.breakdown}</p>
                    <p style={{ ...base, fontSize:"14px", fontWeight:600, color:c.text, marginTop:"4px" }}>{selectedTrack}</p>
                  </div>
                  <button onClick={()=>setSelectedTrack(null)} style={{ ...base, background:"none", border:"none", fontSize:"16px", color:c.textMute, cursor:"pointer" }}>✕</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"16px" }}>
                  <div style={{ padding:"12px", background:c.bg, borderRadius:"6px" }}>
                    <p style={lbl}>{t.totalStreams}</p>
                    <p style={{ ...base, fontSize:"22px", fontWeight:700, color:c.text, lineHeight:1, marginTop:"4px" }}>{fmt(trackBreakdown.reduce((a:number,s:any)=>a+s.streams,0))}</p>
                  </div>
                  <div style={{ padding:"12px", background:c.greenBg, borderRadius:"6px" }}>
                    <p style={lbl}>{t.totalRevenue}</p>
                    <p style={{ ...base, fontSize:"22px", fontWeight:700, color:c.green, lineHeight:1, marginTop:"4px" }}>{fmtUSD(trackBreakdown.reduce((a:number,s:any)=>a+s.revenue,0))}</p>
                  </div>
                </div>
                {trackBreakdown.map((s:any,i:number) => {
                  const total = trackBreakdown.reduce((a:number,x:any)=>a+x.streams,0);
                  const pct   = total>0?(s.streams/total*100).toFixed(1):"0";
                  return (
                    <div key={s.store} style={{ padding:"12px", background:c.bg, borderRadius:"6px", marginBottom:"8px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                        <span style={{ ...base, fontSize:"13px", fontWeight:500, color:c.text }}>{s.store}</span>
                        <span style={{ ...base, fontSize:"12px", color:c.textMute }}>{pct}%</span>
                      </div>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                        <span style={{ ...base, fontSize:"13px", fontWeight:600, color:c.text }}>{fmt(s.streams)}</span>
                        <span style={{ ...base, fontSize:"12px", color:c.green, fontWeight:600 }}>{fmtUSD(s.revenue)}</span>
                      </div>
                      <div style={{ height:"4px", background:c.border, borderRadius:"2px" }}>
                        <div style={{ height:"100%", borderRadius:"2px", background:CHART_COLORS[i%CHART_COLORS.length], width:`${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div style={{ marginTop:"8px", padding:"12px", background:c.blueBg, borderRadius:"6px", border:`1px solid ${c.blueBorder}` }}>
                  <p style={{ ...base, fontSize:"12px", color:c.blue, lineHeight:1.6 }}>{t.platformNote}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PAYMENTS */}
        {activeTab==="payments" && (
          <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px" }}>
              {[
                { label:t.kpiEarned, value:fmtUSD2(totalEarned),  color:c.text  },
                { label:t.kpiPaid,   value:fmtUSD2(totalPaid),    color:c.green },
                { label:t.kpiPending,value:fmtUSD2(totalPending), color:canReceive?c.green:c.yellow },
              ].map((k,i) => (
                <div key={i} style={{ ...card, padding:"20px 24px" }}>
                  <p style={lbl}>{k.label}</p>
                  <p style={{ ...base, fontSize:"32px", fontWeight:700, color:k.color, lineHeight:1, marginTop:"8px" }}>{k.value}</p>
                </div>
              ))}
            </div>
            <div style={{ ...card, padding:"24px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" }}>
                <div>
                  <p style={lbl}>{t.nextPayment}</p>
                  <p style={{ ...base, fontSize:"16px", fontWeight:600, color:c.text, marginTop:"4px", textTransform:"capitalize" }}>{nextLabel}</p>
                </div>
                <span style={badge(canReceive)}>{canReceive?t.readyLabel:t.accumulatingLabel}</span>
              </div>
              <p style={{ ...base, fontSize:"32px", fontWeight:700, color:canReceive?c.green:c.text, marginBottom:"16px" }}>{fmtUSD2(totalPending)}</p>
              <div style={{ marginBottom:"8px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                  <span style={{ ...base, fontSize:"12px", color:c.textMute }}>{t.progress}</span>
                  <span style={{ ...base, fontSize:"12px", fontWeight:600, color:c.text }}>{fmtUSD2(totalPending)} / $50.00</span>
                </div>
                <div style={{ height:"8px", background:c.borderLight, borderRadius:"4px", overflow:"hidden" }}>
                  <div style={{ height:"100%", borderRadius:"4px", transition:"width .4s",
                    background:canReceive?c.green:totalPending>=THRESHOLD*0.5?c.yellow:c.red, width:`${progressPct}%` }} />
                </div>
              </div>
              {canReceive
                ? <p style={{ ...base, fontSize:"13px", color:c.green, fontWeight:500 }}>{t.readyMsg(nextLabel)}</p>
                : <p style={{ ...base, fontSize:"13px", color:c.yellow }}>{t.pendingMsg(fmtUSD2(THRESHOLD-totalPending))}</p>}
            </div>
            <div style={{ ...card, padding:"20px 24px", background:c.bg }}>
              <p style={{ ...base, fontSize:"13px", color:c.textSub, lineHeight:1.8 }}>
                {t.policy}{" "}
                <a href="mailto:info@loyalfoxrecords.com" style={{ color:c.blue, textDecoration:"none" }}>info@loyalfoxrecords.com</a>
              </p>
            </div>
            <div style={card}>
              <div style={cardHeader}><p style={cardTitle}>{t.paymentsTitle}</p></div>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:c.bg }}>
                    {[t.historyMes,t.historyStreams,t.historyShare,t.historyStatus,t.historyDate].map((h,i) => (
                      <th key={i} style={{ ...base, padding:"10px 16px", textAlign:"left", fontSize:"11px", fontWeight:500,
                        color:c.textMute, borderBottom:`1px solid ${c.border}`, textTransform:"uppercase", letterSpacing:"0.04em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {royalties.length===0
                    ? <tr><td colSpan={5} style={{ ...base, padding:"40px", textAlign:"center", fontSize:"13px", color:c.textMute }}>{t.noData}</td></tr>
                    : royalties.map((r,i) => (
                      <tr key={r.id} style={{ borderBottom:`1px solid ${c.borderLight}`, background:i%2===0?c.white:c.bg }}>
                        <td style={{ ...base, padding:"12px 16px", fontSize:"13px", fontWeight:500, color:c.text, textTransform:"capitalize" }}>{fmtMonthFull(r.month.slice(0,7),lang)}</td>
                        <td style={{ ...base, padding:"12px 16px", fontSize:"13px", color:c.textSub }}>{fmt(r.total_streams)}</td>
                        <td style={{ ...base, padding:"12px 16px", fontSize:"13px", fontWeight:600, color:c.green }}>{fmtUSD(r.artist_share)}</td>
                        <td style={{ padding:"12px 16px" }}><span style={badge(r.paid)}>{r.paid?t.paid:t.accumulating}</span></td>
                        <td style={{ ...base, padding:"12px 16px", fontSize:"12px", color:c.textMute }}>
                          {r.paid&&r.paid_at?new Date(r.paid_at).toLocaleDateString(lang==="en"?"en":"es"):"—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTRACTS */}
        {activeTab==="contracts" && (
          <div style={{ maxWidth:"800px", display:"flex", flexDirection:"column", gap:"16px" }}>
            <p style={{ ...base, fontSize:"13px", color:c.textMute }}>
              {lang==="en"
                ? "Here you can view and sign contracts sent by LoyalFox Records."
                : "Aquí puedes ver y firmar los contratos enviados por LoyalFox Records."}
            </p>
            {contracts.length===0 ? (
              <div style={{ ...card, padding:"48px", textAlign:"center" }}>
                <p style={{ ...base, fontSize:"13px", color:c.textMute }}>{t.contractsNoData}</p>
              </div>
            ) : contracts.map(contract => (
              <div key={contract.id} style={{ ...card, padding:"24px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"16px" }}>
                  <div>
                    <p style={{ ...base, fontSize:"16px", fontWeight:600, color:c.text, marginBottom:"4px" }}>{contract.title}</p>
                    {contract.description && (
                      <p style={{ ...base, fontSize:"13px", color:c.textMute }}>{contract.description}</p>
                    )}
                    <p style={{ ...base, fontSize:"11px", color:c.textMute, marginTop:"6px" }}>
                      {lang==="en"?"Sent":"Enviado"}: {new Date(contract.created_at).toLocaleDateString(lang==="en"?"en":"es",{day:"numeric",month:"long",year:"numeric"})}
                    </p>
                  </div>
                  <span style={badge(contract.status==="signed")}>
                    {contract.status==="signed" ? t.contractsSigned : t.contractsPending}
                  </span>
                </div>

                {contract.status==="signed" && contract.signature_url && (
                  <div style={{ padding:"12px", background:c.greenBg, borderRadius:"6px",
                    border:`1px solid ${c.greenBorder}`, marginBottom:"16px",
                    display:"flex", alignItems:"center", gap:"12px" }}>
                    <span style={{ color:c.green, fontSize:"16px" }}>✓</span>
                    <div>
                      <p style={{ ...base, fontSize:"13px", color:c.green, fontWeight:500 }}>
                        {t.contractsSignedMsg}
                      </p>
                      {contract.signed_at && (
                        <p style={{ ...base, fontSize:"11px", color:c.green, marginTop:"2px" }}>
                          {new Date(contract.signed_at).toLocaleDateString(lang==="en"?"en":"es",{day:"numeric",month:"long",year:"numeric"})}
                        </p>
                      )}
                    </div>
                    <img src={contract.signature_url} alt="firma"
                      style={{ height:"40px", border:`1px solid ${c.greenBorder}`,
                        borderRadius:"4px", background:c.white, padding:"4px", marginLeft:"auto" }} />
                  </div>
                )}

                <div style={{ display:"flex", gap:"8px" }}>
                  <a href={contract.pdf_url} target="_blank" rel="noreferrer"
                    style={{ ...base, padding:"7px 14px", borderRadius:"6px",
                      border:`1px solid ${c.border}`, background:c.white,
                      fontSize:"13px", fontWeight:500, color:c.textSub,
                      textDecoration:"none", display:"inline-flex", alignItems:"center", gap:"6px" }}>
                    📄 {t.contractsViewPdf}
                  </a>
                  {contract.status==="pending" && (
                    <button onClick={() => setSigningId(contract.id)} disabled={signingLoading}
                      style={{ ...base, padding:"7px 18px", borderRadius:"6px", border:"none",
                        background:c.accent, color:c.white, fontSize:"13px",
                        fontWeight:600, cursor:"pointer", opacity:signingLoading?0.6:1 }}>
                      ✍️ {signingLoading?t.contractsSigning:t.contractsSign}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CHAT */}
        {activeTab==="chat" && (
          <div style={{ maxWidth:"700px" }}>
            <p style={{ ...base, fontSize:"13px", fontWeight:600, color:c.text, marginBottom:"4px" }}>{t.chatTitle}</p>
            <p style={{ ...base, fontSize:"12px", color:c.textMute, marginBottom:"16px" }}>
              {lang==="en"
                ? "We usually reply within 24–48 hours."
                : "Solemos responder en 24–48 horas."}
            </p>
            <div style={{ ...card, display:"flex", flexDirection:"column", height:"500px" }}>
              {/* Mensajes */}
              <div style={{ flex:1, overflowY:"auto", padding:"20px", display:"flex", flexDirection:"column", gap:"12px" }}>
                {messages.length===0 ? (
                  <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <p style={{ ...base, fontSize:"13px", color:c.textMute, textAlign:"center" }}>{t.chatNoMessages}</p>
                  </div>
                ) : messages.map(m => (
                  <div key={m.id} style={{ display:"flex", justifyContent:m.sender==="artist"?"flex-end":"flex-start" }}>
                    <div style={{ maxWidth:"75%" }}>
                      <p style={{ ...base, fontSize:"10px", color:c.textMute, marginBottom:"3px",
                        textAlign:m.sender==="artist"?"right":"left" }}>
                        {m.sender==="artist"?t.chatYou:t.chatAdmin}
                      </p>
                      <div style={{
                        padding:"10px 14px",
                        borderRadius:m.sender==="artist"?"12px 12px 2px 12px":"12px 12px 12px 2px",
                        background:m.sender==="artist"?c.accent:c.bg,
                        border:m.sender==="artist"?"none":`1px solid ${c.border}`,
                      }}>
                        <p style={{ ...base, fontSize:"13px", lineHeight:1.6, margin:0,
                          color:m.sender==="artist"?c.white:c.text }}>
                          {m.message}
                        </p>
                      </div>
                      <p style={{ ...base, fontSize:"10px", color:c.textMute, marginTop:"3px",
                        textAlign:m.sender==="artist"?"right":"left" }}>
                        {fmtTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={chatBottomRef} />
              </div>
              {/* Input */}
              <div style={{ padding:"14px 16px", borderTop:`1px solid ${c.border}`,
                display:"flex", gap:"8px", alignItems:"flex-end" }}>
                <textarea
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();} }}
                  placeholder={t.chatPlaceholder}
                  rows={2}
                  style={{ flex:1, padding:"10px 12px", border:`1px solid ${c.border}`,
                    borderRadius:"8px", fontFamily:"system-ui", fontSize:"13px",
                    color:c.text, resize:"none", outline:"none", background:c.white }}
                  onFocus={e=>e.currentTarget.style.borderColor=c.accent}
                  onBlur={e=>e.currentTarget.style.borderColor=c.border}
                />
                <button onClick={sendMessage} disabled={chatSending||!chatMsg.trim()}
                  style={{ ...base, padding:"10px 18px", borderRadius:"8px", border:"none",
                    background:c.accent, color:c.white, fontSize:"13px",
                    fontWeight:600, cursor:"pointer", opacity:(chatSending||!chatMsg.trim())?0.5:1 }}>
                  {t.chatSend}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ */}
        {activeTab==="faq" && (
          <div style={{ maxWidth:"720px" }}>
            <p style={{ ...base, fontSize:"13px", color:c.textMute, marginBottom:"24px" }}>
              {lang==="en"?"Answers to the most common questions about your dashboard and payments.":"Respuestas a las preguntas más comunes sobre tu dashboard y pagos."}
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
              {t.faqs.map((faq,i) => (
                <div key={i} style={card}>
                  <button onClick={()=>setOpenFaq(openFaq===i?null:i)}
                    style={{ ...base, width:"100%", padding:"18px 20px", display:"flex",
                      justifyContent:"space-between", alignItems:"center",
                      background:"none", border:"none", cursor:"pointer", textAlign:"left" }}>
                    <span style={{ fontSize:"14px", fontWeight:600, color:c.text, flex:1, paddingRight:"16px" }}>{faq.q}</span>
                    <span style={{ fontSize:"18px", color:c.textMute, flexShrink:0,
                      transform:openFaq===i?"rotate(45deg)":"none", transition:"transform .2s", display:"inline-block" }}>+</span>
                  </button>
                  {openFaq===i && (
                    <div style={{ padding:"0 20px 18px", borderTop:`1px solid ${c.borderLight}` }}>
                      <p style={{ ...base, fontSize:"13px", color:c.textSub, lineHeight:1.8, paddingTop:"14px" }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ marginTop:"24px", padding:"16px 20px", background:c.blueBg, borderRadius:"8px", border:`1px solid ${c.blueBorder}` }}>
              <p style={{ ...base, fontSize:"13px", color:c.blue, lineHeight:1.7 }}>
                {lang==="en"
                  ? <>Still have questions? <a href="mailto:info@loyalfoxrecords.com" style={{ fontWeight:600 }}>info@loyalfoxrecords.com</a></>
                  : <>¿Más dudas? <a href="mailto:info@loyalfoxrecords.com" style={{ fontWeight:600 }}>info@loyalfoxrecords.com</a></>}
              </p>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
