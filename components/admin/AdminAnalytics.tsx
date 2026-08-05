"use client";
import { useState, useEffect } from "react";
import Papa from "papaparse";
import { supabase } from "@/lib/supabase";
import { css, hs } from "./styles";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

type MonthData = {
  month: string;
  total_streams: number; total_revenue: number;
  total_tracks: number; total_countries: number;
  by_artist: any[]; by_store: any[];
  by_country: any[]; by_media: any[];
};
type Aggregated = {
  totalStreams: number; totalRevenue: number;
  byArtist:  { name:string; streams:number; revenue:number }[];
  byStore:   { name:string; streams:number; revenue:number }[];
  byCountry: { name:string; streams:number; revenue:number }[];
  byMonth:   { month:string; streams:number; revenue:number }[];
};

const COLORS = ["#111827","#374151","#4b5563","#6b7280","#9ca3af",
                "#16a34a","#2563eb","#7c3aed","#d97706","#dc2626"];

const fmt          = (n:number) => n>=1000000?`${(n/1000000).toFixed(1)}M`:n>=1000?`${(n/1000).toFixed(1)}K`:String(n);
const fmtUSD2      = (n:number) => `$${Number(n).toFixed(2)}`;
const fmtUSD4      = (n:number) => `$${Number(n).toFixed(4)}`;
const fmtMonth     = (m:string) => { try { const d=new Date(m+"-02"); return `${d.toLocaleString("es",{month:"short"})} ${d.getFullYear()}`; } catch { return m; } };
const fmtMonthFull = (m:string) => { try { const d=new Date(m+"-02"); return d.toLocaleString("es",{month:"long",year:"numeric"}); } catch { return m; } };

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:css.white, border:`1px solid ${css.border}`,
      borderRadius:"6px", padding:"10px 14px",
      boxShadow:"0 2px 8px rgba(0,0,0,0.08)" }}>
      <p style={{ fontSize:"11px", fontWeight:600, color:css.textSub,
        marginBottom:"4px", fontFamily:"system-ui" }}>
        {fmtMonth(label)}
      </p>
      {payload.map((p:any,i:number) => (
        <p key={i} style={{ fontSize:"13px", fontWeight:600,
          color:css.text, fontFamily:"system-ui" }}>
          {p.name}: {typeof p.value==="number"&&p.value<1?fmtUSD4(p.value):fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

function KPI({ label, value, sub }: { label:string; value:string; sub?:string }) {
  return (
    <div style={{ background:css.white, border:`1px solid ${css.border}`,
      borderRadius:"8px", padding:"20px 24px" }}>
      <p style={{ fontSize:"12px", color:css.textMute, marginBottom:"8px",
        fontFamily:"system-ui" }}>{label}</p>
      <p style={{ fontSize:"24px", fontWeight:700, color:css.text,
        marginBottom:"2px", fontFamily:"system-ui" }}>{value}</p>
      {sub && <p style={{ fontSize:"11px", color:css.textMute,
        fontFamily:"system-ui" }}>{sub}</p>}
    </div>
  );
}

function Section({ title, children, action }: {
  title:string; children:React.ReactNode; action?:React.ReactNode
}) {
  return (
    <div style={{ ...hs.section, marginBottom:"24px" }}>
      <div style={hs.sectionHeader}>
        <p style={hs.cardTitle}>{title}</p>
        {action}
      </div>
      <div style={{ padding:"20px" }}>{children}</div>
    </div>
  );
}

function FinancialSummary() {
  const [data, setData] = useState({ bruto:0, artistas:0, sello:0, loaded:false });

  useEffect(() => {
    const load = async () => {
      const [{ data:royalties }, { data:accounts }] = await Promise.all([
        supabase.from("artist_royalties").select("gross_revenue, artist_share, artist_name"),
        supabase.from("artist_accounts").select("artist_name, is_own_artist"),
      ]);
      if (!royalties) return;
      const bruto    = royalties.reduce((a,r) => a+Number(r.gross_revenue), 0);
      const artistas = royalties.filter(r => {
        const acc = accounts?.find(a => a.artist_name===r.artist_name);
        return !acc?.is_own_artist;
      }).reduce((a,r) => a+Number(r.artist_share), 0);
      setData({ bruto, artistas, sello:bruto-artistas, loaded:true });
    };
    load();
  }, []);

  if (!data.loaded) return null;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
      gap:"16px", marginBottom:"24px" }}>
      {[
        { label:"Total bruto generado", value:fmtUSD2(data.bruto),
          sub:"Ingresos totales del sello", highlight:false },
        { label:"Pagado a artistas",    value:fmtUSD2(data.artistas),
          sub:"Suma de sus regalías", highlight:false },
        { label:"Ingresos del sello",   value:fmtUSD2(data.sello),
          sub:"Lo que te queda a ti ✓", highlight:true },
      ].map((k,i) => (
        <div key={i} style={{ background:k.highlight?css.greenBg:css.white,
          border:`1px solid ${k.highlight?css.greenBorder:css.border}`,
          borderRadius:"8px", padding:"20px 24px" }}>
          <p style={{ fontSize:"12px", color:css.textMute, marginBottom:"8px",
            fontFamily:"system-ui" }}>{k.label}</p>
          <p style={{ fontSize:"24px", fontWeight:700, marginBottom:"4px",
            color:k.highlight?css.green:css.text,
            fontFamily:"system-ui" }}>{k.value}</p>
          <p style={{ fontSize:"11px", color:css.textMute,
            fontFamily:"system-ui" }}>{k.sub}</p>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalytics() {
  const [savedMonths, setSavedMonths]     = useState<MonthData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string|null>(null);
  const [uploadMonth, setUploadMonth]     = useState("");
  const [csvStatus, setCsvStatus]         = useState("");
  const [loading, setLoading]             = useState(false);
  const [viewMode, setViewMode]           = useState<"streams"|"revenue">("streams");
  const [aggregated, setAggregated]       = useState<Aggregated|null>(null);

  const loadSaved = async () => {
    const { data } = await supabase.from("analytics_monthly").select("*")
      .order("month", { ascending:true });
    if (data) setSavedMonths(data);
  };
  useEffect(() => { loadSaved(); }, []);

  useEffect(() => {
    if (savedMonths.length===0) { setAggregated(null); return; }
    const artistAcc:  Record<string,any> = {};
    const storeAcc:   Record<string,any> = {};
    const countryAcc: Record<string,any> = {};
    savedMonths.forEach(m => {
      (m.by_artist as any[]).forEach((a:any) => {
        if(!artistAcc[a.name]) artistAcc[a.name]={streams:0,revenue:0};
        artistAcc[a.name].streams+=a.streams; artistAcc[a.name].revenue+=a.revenue;
      });
      (m.by_store as any[]).forEach((s:any) => {
        if(!storeAcc[s.name]) storeAcc[s.name]={streams:0,revenue:0};
        storeAcc[s.name].streams+=s.streams; storeAcc[s.name].revenue+=s.revenue;
      });
      (m.by_country as any[]).forEach((c:any) => {
        if(!countryAcc[c.name]) countryAcc[c.name]={streams:0,revenue:0};
        countryAcc[c.name].streams+=c.streams; countryAcc[c.name].revenue+=c.revenue;
      });
    });
    setAggregated({
      totalStreams: savedMonths.reduce((a,m)=>a+m.total_streams,0),
      totalRevenue: savedMonths.reduce((a,m)=>a+Number(m.total_revenue),0),
      byArtist:  Object.entries(artistAcc).map(([name,v])=>({name,...v})).sort((a,b)=>b.streams-a.streams),
      byStore:   Object.entries(storeAcc).map(([name,v])=>({name,...v})).sort((a,b)=>b.streams-a.streams),
      byCountry: Object.entries(countryAcc).map(([name,v])=>({name,...v})).sort((a,b)=>b.streams-a.streams).slice(0,25),
      byMonth:   savedMonths.map(m=>({month:m.month,streams:m.total_streams,revenue:Number(m.total_revenue)})),
    });
  }, [savedMonths]);

  const processCSV = (file: File) => {
    if (!uploadMonth) { setCsvStatus("⚠ Selecciona el mes primero"); return; }
    setLoading(true); setCsvStatus("Procesando...");
    Papa.parse(file, {
      header:true, skipEmptyLines:true,
      complete: async (result) => {
        const rows = result.data as Record<string,string>[];
        const acc: any = {
          streams:0, revenue:0,
          tracks:new Set<string>(), countries:new Set<string>(),
          artists:{}, stores:{}, countries_map:{}, media:{},
        };
        rows.forEach((row:any) => {
          const qty=parseInt(row.Quantity||"0");
          const rev=parseFloat(row["Recipient Net Royalty ($ USD)"]||"0");
          const artist=row.Artist?.trim()||"Unknown";
          const title=row.Title?.trim()||"Unknown";
          const store=row.Store?.trim()||"Unknown";
          const country=row.Country?.trim()||"";
          const media=row.Media?.trim()||"Unknown";
          const key=`${title}|||${artist}`;
          acc.streams+=qty; acc.revenue+=rev;
          acc.tracks.add(key); if(country) acc.countries.add(country);
          if(!acc.artists[artist]) acc.artists[artist]={streams:0,revenue:0};
          acc.artists[artist].streams+=qty; acc.artists[artist].revenue+=rev;
          if(!acc.stores[store]) acc.stores[store]={streams:0,revenue:0};
          acc.stores[store].streams+=qty; acc.stores[store].revenue+=rev;
          if(country){
            if(!acc.countries_map[country]) acc.countries_map[country]={streams:0,revenue:0};
            acc.countries_map[country].streams+=qty; acc.countries_map[country].revenue+=rev;
          }
          if(!acc.media[media]) acc.media[media]={value:0,revenue:0};
          acc.media[media].value+=qty; acc.media[media].revenue+=rev;
        });

        const byArtist  = Object.entries(acc.artists).map(([name,v]:any)=>({name,streams:v.streams,revenue:v.revenue})).sort((a:any,b:any)=>b.streams-a.streams);
        const byStore   = Object.entries(acc.stores).map(([name,v]:any)=>({name,streams:v.streams,revenue:v.revenue})).sort((a:any,b:any)=>b.streams-a.streams);
        const byCountry = Object.entries(acc.countries_map).map(([name,v]:any)=>({name,streams:v.streams,revenue:v.revenue})).sort((a:any,b:any)=>b.streams-a.streams);
        const byMedia   = Object.entries(acc.media).map(([name,v]:any)=>({name,value:v.value,revenue:v.revenue}));

        const { error } = await supabase.from("analytics_monthly").upsert({
          month:uploadMonth,
          total_streams:acc.streams, total_revenue:acc.revenue,
          total_tracks:acc.tracks.size, total_countries:acc.countries.size,
          by_artist:byArtist, by_store:byStore, by_country:byCountry, by_media:byMedia,
        }, { onConflict:"month" });

        const trackMap: Record<string,any> = {};
        rows.forEach((row:any) => {
          const key=`${row.Title?.trim()}|||${row.Artist?.trim()}`;
          const qty=parseInt(row.Quantity||"0");
          const rev=parseFloat(row["Recipient Net Royalty ($ USD)"]||"0");
          if(!trackMap[key]) trackMap[key]={streams:0,revenue:0,artist:row.Artist?.trim()||""};
          trackMap[key].streams+=qty; trackMap[key].revenue+=rev;
        });
        await supabase.from("analytics_tracks").delete().eq("month",uploadMonth);
        const trackRows=Object.entries(trackMap).map(([key,v]:any)=>({
          month:uploadMonth, track_name:key.split("|||")[0],
          artist:v.artist, streams:v.streams, revenue:v.revenue,
        }));
        for (let i=0;i<trackRows.length;i+=100)
          await supabase.from("analytics_tracks").insert(trackRows.slice(i,i+100));

        await loadSaved();
        setCsvStatus(error
          ?`Error: ${error.message}`
          :`✓ Guardado — ${fmtMonthFull(uploadMonth.slice(0,7))} · ${trackRows.length} tracks`
        );
        setLoading(false);
      },
    });
  };

  const deleteMonth = async (month:string) => {
    if (!confirm(`¿Eliminar datos de ${fmtMonthFull(month.slice(0,7))}?`)) return;
    await supabase.from("analytics_monthly").delete().eq("month",month);
    await supabase.from("analytics_tracks").delete().eq("month",month);
    await loadSaved();
    if (selectedMonth===month) setSelectedMonth(null);
  };

  const selectedData = savedMonths.find(m=>m.month===selectedMonth)||null;
  const currentYear  = new Date().getFullYear();

  return (
    <div style={{ maxWidth:"1100px" }}>
      <p style={hs.subtitle}>
        Sube los CSV mensuales de Label Engine. Los datos se acumulan automáticamente.
      </p>

      {/* Resumen financiero del sello */}
      <FinancialSummary />

      {/* KPIs de streams */}
      {aggregated && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)",
          gap:"16px", marginBottom:"24px" }}>
          <KPI label="Reproducciones totales" value={fmt(aggregated.totalStreams)}      sub="Todos los meses" />
          <KPI label="Ingresos brutos"         value={fmtUSD2(aggregated.totalRevenue)} sub="USD acumulado"   />
          <KPI label="Artistas con streams"    value={String(aggregated.byArtist.length)} />
          <KPI label="Plataformas"             value={String(aggregated.byStore.length)}  />
        </div>
      )}

      {/* Subir CSV */}
      <Section title="Subir datos mensuales">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)",
          gap:"8px", marginBottom:"20px" }}>
          {Array.from({length:12},(_,i) => {
            const date     = new Date(currentYear,i,1);
            const monthKey = `${currentYear}-${String(i+1).padStart(2,"0")}-01`;
            const hasData  = savedMonths.some(m=>m.month===monthKey);
            const mData    = savedMonths.find(m=>m.month===monthKey);
            const isSel    = selectedMonth===monthKey;
            return (
              <div key={monthKey} style={{ position:"relative" }}>
                <div onClick={() => { if(hasData) setSelectedMonth(isSel?null:monthKey); }}
                  style={{ padding:"10px 12px", borderRadius:"6px",
                    cursor:hasData?"pointer":"default",
                    border:`1px solid ${isSel?css.text:hasData?css.green:css.border}`,
                    background:isSel?css.text:hasData?css.greenBg:css.bg,
                    transition:"all .15s" }}>
                  <p style={{ fontSize:"11px", fontWeight:600, fontFamily:"system-ui",
                    marginBottom:"2px",
                    color:isSel?"#fff":hasData?css.green:css.textMute }}>
                    {date.toLocaleString("es",{month:"short"}).toUpperCase()}
                  </p>
                  {hasData&&mData ? (
                    <p style={{ fontSize:"11px", fontFamily:"system-ui",
                      color:isSel?"rgba(255,255,255,0.7)":css.green }}>
                      {fmt(mData.total_streams)}
                    </p>
                  ) : (
                    <p style={{ fontSize:"11px", color:css.textMute,
                      fontFamily:"system-ui" }}>—</p>
                  )}
                </div>
                {hasData && (
                  <button onClick={(e)=>{e.stopPropagation();deleteMonth(monthKey);}}
                    style={{ position:"absolute", top:"-6px", right:"-6px",
                      width:"16px", height:"16px", borderRadius:"50%",
                      background:css.red, border:"none", color:"#fff",
                      fontSize:"9px", cursor:"pointer", fontWeight:700,
                      display:"flex", alignItems:"center",
                      justifyContent:"center", lineHeight:1 }}>
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginBottom:"16px" }}>
          <p style={{ fontSize:"12px", fontWeight:500, color:css.textSub,
            marginBottom:"8px", fontFamily:"system-ui" }}>
            ¿A qué mes pertenece el CSV?
          </p>
          <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
            {Array.from({length:12},(_,i) => {
              const date     = new Date(currentYear,i,1);
              const monthKey = `${currentYear}-${String(i+1).padStart(2,"0")}-01`;
              const isSel    = uploadMonth===monthKey;
              return (
                <button key={monthKey} onClick={()=>setUploadMonth(isSel?"":monthKey)}
                  style={{ padding:"5px 10px", borderRadius:"5px", fontSize:"12px",
                    fontWeight:500, cursor:"pointer", fontFamily:"system-ui",
                    background:isSel?css.text:css.white,
                    border:`1px solid ${isSel?css.text:css.border}`,
                    color:isSel?"#fff":css.textSub, transition:"all .15s" }}>
                  {date.toLocaleString("es",{month:"short"})}
                </button>
              );
            })}
          </div>
          {uploadMonth && (
            <p style={{ fontSize:"12px", color:css.green, marginTop:"8px",
              fontFamily:"system-ui", fontWeight:500 }}>
              ✓ Se asignará a {fmtMonthFull(uploadMonth.slice(0,7))}
            </p>
          )}
        </div>

        <label style={{ display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", padding:"32px",
          border:`2px dashed ${uploadMonth?css.text:css.border}`,
          borderRadius:"8px", cursor:uploadMonth?"pointer":"not-allowed",
          background:css.bg, transition:"all .2s" }}
          onMouseEnter={(e)=>{ if(uploadMonth)(e.currentTarget as HTMLElement).style.background=css.accentBg; }}
          onMouseLeave={(e)=>{ (e.currentTarget as HTMLElement).style.background=css.bg; }}>
          <span style={{ fontSize:"28px", marginBottom:"8px" }}>📊</span>
          <p style={{ fontSize:"14px", fontWeight:600, color:css.text,
            marginBottom:"4px", fontFamily:"system-ui" }}>
            {loading?"Procesando...":uploadMonth?"Subir CSV de Label Engine":"Selecciona un mes primero"}
          </p>
          <p style={{ fontSize:"12px", color:css.textMute, fontFamily:"system-ui" }}>
            Arrastra o haz clic · Formato Label Engine
          </p>
          <input type="file" accept=".csv" style={{display:"none"}}
            disabled={loading||!uploadMonth}
            onChange={(e)=>{ const f=e.target.files?.[0]; if(f) processCSV(f); }} />
        </label>

        {csvStatus && (
          <div style={{ marginTop:"12px", padding:"10px 14px", borderRadius:"6px",
            background:csvStatus.startsWith("✓")?css.greenBg:css.redBg,
            border:`1px solid ${csvStatus.startsWith("✓")?css.greenBorder:css.redBorder}` }}>
            <p style={{ fontSize:"13px", fontWeight:500, fontFamily:"system-ui",
              color:csvStatus.startsWith("✓")?css.green:css.red }}>
              {csvStatus}
            </p>
          </div>
        )}
      </Section>

      {/* Dashboard */}
      {aggregated && savedMonths.length>0 && (
        <>
          <Section title="Evolución">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
              <div>
                <p style={{ fontSize:"12px", fontWeight:500, color:css.textSub,
                  marginBottom:"12px", fontFamily:"system-ui" }}>
                  Reproducciones por mes
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={aggregated.byMonth}>
                    <defs>
                      <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={css.text} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={css.text} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{fontSize:10,fill:css.textMute,fontFamily:"system-ui"}} tickFormatter={fmtMonth} />
                    <YAxis tick={{fontSize:10,fill:css.textMute,fontFamily:"system-ui"}} tickFormatter={fmt} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="streams" stroke={css.text} strokeWidth={2} fill="url(#grad1)" name="Streams" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p style={{ fontSize:"12px", fontWeight:500, color:css.textSub,
                  marginBottom:"12px", fontFamily:"system-ui" }}>
                  Ingresos por mes (USD)
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={aggregated.byMonth}>
                    <defs>
                      <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={css.green} stopOpacity={0.15}/>
                        <stop offset="95%" stopColor={css.green} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{fontSize:10,fill:css.textMute,fontFamily:"system-ui"}} tickFormatter={fmtMonth} />
                    <YAxis tick={{fontSize:10,fill:css.textMute,fontFamily:"system-ui"}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke={css.green} strokeWidth={2} fill="url(#grad2)" name="Ingresos $" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Section>

          <Section title="Artistas — acumulado"
            action={
              <div style={{ display:"flex", gap:"4px" }}>
                {(["streams","revenue"] as const).map(m => (
                  <button key={m} onClick={()=>setViewMode(m)}
                    style={{ padding:"4px 10px", borderRadius:"5px", fontSize:"12px",
                      fontWeight:500, cursor:"pointer", fontFamily:"system-ui",
                      background:viewMode===m?css.text:css.white,
                      border:`1px solid ${viewMode===m?css.text:css.border}`,
                      color:viewMode===m?"#fff":css.textSub }}>
                    {m==="streams"?"Streams":"Ingresos"}
                  </button>
                ))}
              </div>
            }>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={aggregated.byArtist.slice(0,10).map(a=>({
                  name:a.name.length>12?a.name.slice(0,12)+"…":a.name,
                  streams:a.streams, revenue:a.revenue,
                }))} layout="vertical">
                  <XAxis type="number" tick={{fontSize:10,fill:css.textMute,fontFamily:"system-ui"}}
                    tickFormatter={viewMode==="streams"?fmt:(v)=>`$${v.toFixed(2)}`} />
                  <YAxis type="category" dataKey="name" width={90}
                    tick={{fontSize:10,fill:css.textSub,fontFamily:"system-ui"}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={viewMode} fill={css.text} radius={[0,3,3,0]}
                    name={viewMode==="streams"?"Streams":"Ingresos $"} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ overflowY:"auto", maxHeight:"300px" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ borderBottom:`1px solid ${css.border}` }}>
                      {["#","Artista","Streams","Ingresos"].map((h,i) => (
                        <th key={i} style={{ padding:"8px 10px", textAlign:"left",
                          fontSize:"11px", fontWeight:500, color:css.textMute,
                          fontFamily:"system-ui" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {aggregated.byArtist.map((a,i) => (
                      <tr key={a.name} style={{ borderBottom:`1px solid ${css.border}` }}>
                        <td style={{ padding:"8px 10px", fontSize:"12px", color:css.textMute, fontFamily:"system-ui" }}>{i+1}</td>
                        <td style={{ padding:"8px 10px", fontSize:"13px", fontWeight:500, color:css.text, fontFamily:"system-ui" }}>{a.name}</td>
                        <td style={{ padding:"8px 10px", fontSize:"13px", color:css.text, fontFamily:"system-ui" }}>{fmt(a.streams)}</td>
                        <td style={{ padding:"8px 10px", fontSize:"13px", color:css.green, fontFamily:"system-ui" }}>{fmtUSD4(a.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>

          <Section title="Plataformas — acumulado">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
              <div>
                <p style={{ fontSize:"12px", fontWeight:500, color:css.textSub,
                  marginBottom:"12px", fontFamily:"system-ui" }}>
                  Streams por plataforma
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={aggregated.byStore.slice(0,8)} layout="vertical">
                    <XAxis type="number" tick={{fontSize:10,fill:css.textMute,fontFamily:"system-ui"}} tickFormatter={fmt} />
                    <YAxis type="category" dataKey="name" width={110} tick={{fontSize:10,fill:css.textSub,fontFamily:"system-ui"}} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="streams" name="Streams" radius={[0,3,3,0]}>
                      {aggregated.byStore.slice(0,8).map((_,i) => (
                        <Cell key={i} fill={COLORS[i%COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p style={{ fontSize:"12px", fontWeight:500, color:css.textSub,
                  marginBottom:"12px", fontFamily:"system-ui" }}>
                  Ingresos por plataforma
                </p>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead>
                    <tr style={{ borderBottom:`1px solid ${css.border}` }}>
                      {["Plataforma","Streams","Ingresos"].map((h,i) => (
                        <th key={i} style={{ padding:"8px 10px", textAlign:"left",
                          fontSize:"11px", fontWeight:500, color:css.textMute,
                          fontFamily:"system-ui" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...aggregated.byStore].sort((a,b)=>b.revenue-a.revenue).map((s,i) => (
                      <tr key={s.name} style={{ borderBottom:`1px solid ${css.border}` }}>
                        <td style={{ padding:"8px 10px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                            <div style={{ width:"8px", height:"8px", borderRadius:"50%",
                              background:COLORS[i%COLORS.length], flexShrink:0 }} />
                            <span style={{ fontSize:"13px", color:css.text, fontFamily:"system-ui" }}>{s.name}</span>
                          </div>
                        </td>
                        <td style={{ padding:"8px 10px", fontSize:"13px", color:css.textSub, fontFamily:"system-ui" }}>{fmt(s.streams)}</td>
                        <td style={{ padding:"8px 10px", fontSize:"13px", color:css.green, fontFamily:"system-ui" }}>{fmtUSD4(s.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Section>

          <Section title="Top países">
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${css.border}` }}>
                  {["#","País","Streams","Ingresos",""].map((h,i) => (
                    <th key={i} style={{ padding:"8px 16px", textAlign:"left",
                      fontSize:"11px", fontWeight:500, color:css.textMute,
                      fontFamily:"system-ui" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aggregated.byCountry.slice(0,15).map((c,i) => (
                  <tr key={c.name} style={{ borderBottom:`1px solid ${css.border}` }}>
                    <td style={{ padding:"10px 16px", fontSize:"12px", color:css.textMute, fontFamily:"system-ui", width:"32px" }}>{i+1}</td>
                    <td style={{ padding:"10px 16px", fontSize:"13px", fontWeight:500, color:css.text, fontFamily:"system-ui" }}>{c.name}</td>
                    <td style={{ padding:"10px 16px", fontSize:"13px", color:css.text, fontFamily:"system-ui" }}>{fmt(c.streams)}</td>
                    <td style={{ padding:"10px 16px", fontSize:"13px", color:css.green, fontFamily:"system-ui" }}>{fmtUSD4(c.revenue)}</td>
                    <td style={{ padding:"10px 16px", width:"120px" }}>
                      <div style={{ height:"4px", background:css.border, borderRadius:"2px" }}>
                        <div style={{ height:"100%", borderRadius:"2px", background:css.text,
                          width:`${(c.streams/(aggregated.byCountry[0]?.streams||1))*100}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </>
      )}

      {selectedData && (
        <Section title={`Detalle — ${fmtMonthFull(selectedData.month.slice(0,7))}`}
          action={<button onClick={()=>setSelectedMonth(null)} style={hs.btnSmall}>Cerrar ✕</button>}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px", marginBottom:"20px" }}>
            <KPI label="Streams"  value={fmt(selectedData.total_streams)} />
            <KPI label="Ingresos" value={fmtUSD2(selectedData.total_revenue)} />
            <KPI label="Países"   value={String(selectedData.total_countries)} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
            <div>
              <p style={{ fontSize:"12px", fontWeight:500, color:css.textSub, marginBottom:"12px", fontFamily:"system-ui" }}>Artistas</p>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <tbody>
                  {(selectedData.by_artist as any[]).slice(0,10).map((a,i) => (
                    <tr key={a.name} style={{ borderBottom:`1px solid ${css.border}` }}>
                      <td style={{ padding:"8px 0", fontSize:"12px", color:css.textMute, width:"24px", fontFamily:"system-ui" }}>{i+1}</td>
                      <td style={{ padding:"8px 10px", fontSize:"13px", color:css.text, fontFamily:"system-ui" }}>{a.name}</td>
                      <td style={{ padding:"8px 0", fontSize:"13px", color:css.text, textAlign:"right", fontFamily:"system-ui" }}>{fmt(a.streams)}</td>
                      <td style={{ padding:"8px 0 8px 12px", fontSize:"13px", color:css.green, textAlign:"right", fontFamily:"system-ui" }}>{fmtUSD4(a.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <p style={{ fontSize:"12px", fontWeight:500, color:css.textSub, marginBottom:"12px", fontFamily:"system-ui" }}>Plataformas</p>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <tbody>
                  {(selectedData.by_store as any[]).map((s,i) => (
                    <tr key={s.name} style={{ borderBottom:`1px solid ${css.border}` }}>
                      <td style={{ padding:"8px 0" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                          <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:COLORS[i%COLORS.length] }} />
                          <span style={{ fontSize:"13px", color:css.text, fontFamily:"system-ui" }}>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ padding:"8px 0", fontSize:"13px", color:css.textSub, textAlign:"right", fontFamily:"system-ui" }}>{fmt(s.streams)}</td>
                      <td style={{ padding:"8px 0 8px 12px", fontSize:"13px", color:css.green, textAlign:"right", fontFamily:"system-ui" }}>{fmtUSD4(s.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>
      )}

      {savedMonths.length===0 && (
        <div style={{ padding:"48px", textAlign:"center",
          background:css.white, border:`1px solid ${css.border}`, borderRadius:"8px" }}>
          <p style={{ fontSize:"14px", color:css.textMute, fontFamily:"system-ui" }}>
            Selecciona un mes y sube tu primer CSV para ver los datos
          </p>
        </div>
      )}
    </div>
  );
}