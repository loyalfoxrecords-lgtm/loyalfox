"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useIsMobile } from "@/lib/useIsMobile";
import { useLocale } from "@/lib/LocaleContext";
import Navbar from "./Navbar";
import Footer from "./Footer";

type Track = {
  id: string; name: string; artist: string; genre: string;
  bpm: number; image_url: string; slug: string;
};

export default function CatalogPage() {
  const [tracks, setTracks]   = useState<Track[]>([]);
  const [active, setActive]   = useState("all");
  const [hovered, setHovered] = useState<string|null>(null);
  const [search, setSearch]   = useState("");
  const isMobile = useIsMobile();
  const { t } = useLocale();

  useEffect(() => {
    supabase.from("tracks").select("*").order("created_at",{ascending:false})
      .then(({data}) => { if(data) setTracks(data); });
  }, []);

  const filtered = tracks.filter(tr => {
    const matchGenre  = active==="all" || tr.genre?.toLowerCase()===active;
    const matchSearch = !search ||
      tr.name.toLowerCase().includes(search.toLowerCase()) ||
      tr.artist.toLowerCase().includes(search.toLowerCase());
    return matchGenre && matchSearch;
  });

  const availableGenres = ["all", ...Array.from(new Set(tracks.map(tr=>tr.genre?.toLowerCase()).filter(Boolean)))];
  const allLabel = t.catalog?.eyebrow === "Catalog" ? "All" : t.catalog?.eyebrow === "Katalog" ? "Alle" : "Todo";
  const titleLines = (t.catalog?.title || "MÚSICA\nDEL SELLO").split("\n");
  const searchPh = t.artists?.searchPh?.replace("artista","track o artista") || "Buscar track o artista...";

  return (
    <div style={{ background:"#080808", minHeight:"100vh" }}>
      <Navbar />

      <div style={{ padding: isMobile?"80px 20px 40px":"140px 56px 60px",
        position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:"48px", top:"50%",
          transform:"translateY(-50%)",
          fontFamily:"var(--font-display)", fontSize:"clamp(120px,18vw,280px)",
          color:"rgba(240,240,240,0.02)", lineHeight:1,
          userSelect:"none", pointerEvents:"none" }}>01</div>

        {/* Breadcrumb */}
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"24px" }}>
          <a href="/" style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
            letterSpacing:"2px", textTransform:"uppercase",
            color:"rgba(240,240,240,0.35)", textDecoration:"none", transition:"color .2s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color="#a8e63d"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color="rgba(240,240,240,0.35)"}>
            ← Home
          </a>
          <span style={{ color:"rgba(240,240,240,0.2)" }}>/</span>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
            letterSpacing:"2px", textTransform:"uppercase", color:"#a8e63d" }}>
            {t.catalog?.eyebrow || "Catálogo"}
          </span>
        </div>

        <div style={{ display:"flex", alignItems:"flex-end",
          justifyContent:"space-between", flexWrap:"wrap", gap:"24px", marginBottom:"40px" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"16px" }}>
              <div style={{ width:"40px", height:"2px", background:"#a8e63d" }} />
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                letterSpacing:"4px", textTransform:"uppercase", color:"#a8e63d" }}>
                {filtered.length} track{filtered.length!==1?"s":""}
              </span>
            </div>
            <h1 style={{ fontFamily:"var(--font-display)",
              fontSize: isMobile?"clamp(40px,12vw,64px)":"clamp(56px,8vw,110px)",
              lineHeight:0.88, letterSpacing:"-1px", color:"#f0f0f0" }}>
              {titleLines[0]}<br />
              <span style={{ color:"transparent",
                WebkitTextStroke: isMobile?"1.5px rgba(240,240,240,0.12)":"2px rgba(240,240,240,0.12)" }}>
                {titleLines[1]}
              </span>
            </h1>
          </div>

          <input placeholder={searchPh}
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ padding:"12px 16px",
              background:"rgba(255,255,255,0.05)",
              border:"1px solid rgba(255,255,255,0.1)",
              color:"#f0f0f0", fontSize:"13px",
              fontFamily:"var(--font-mono)", outline:"none",
              letterSpacing:"0.5px",
              width: isMobile?"100%":"280px",
              boxSizing:"border-box" as any,
              transition:"border-color .2s" }}
            onFocus={e => e.currentTarget.style.borderColor="#a8e63d"}
            onBlur={e => e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"} />
        </div>

        {/* Filtros */}
        <div style={{ display:"flex", gap:"4px",
          flexWrap: isMobile?"nowrap":"wrap",
          overflowX: isMobile?"auto":"visible",
          paddingBottom: isMobile?"4px":"0",
          scrollbarWidth:"none" as any }}>
          {availableGenres.map(g => (
            <button key={g} onClick={() => setActive(g)}
              style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                letterSpacing:"2px", textTransform:"uppercase",
                padding: isMobile?"8px 14px":"8px 18px",
                flexShrink: isMobile?0:undefined,
                background: active===g?"#a8e63d":"transparent",
                border: active===g?"1px solid #a8e63d":"1px solid rgba(255,255,255,0.1)",
                color: active===g?"#080808":"rgba(240,240,240,0.4)",
                cursor:"pointer", transition:"all .25s", fontWeight:active===g?700:400 }}
              onMouseEnter={e => { if(active!==g){ (e.currentTarget as HTMLElement).style.borderColor="#a8e63d"; (e.currentTarget as HTMLElement).style.color="#a8e63d"; }}}
              onMouseLeave={e => { if(active!==g){ (e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color="rgba(240,240,240,0.4)"; }}}>
              {g==="all" ? allLabel : g}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <AnimatePresence mode="popLayout">
        {filtered.length===0 ? (
          <div style={{ padding:"80px 56px", textAlign:"center" }}>
            <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
              color:"rgba(240,240,240,0.2)", letterSpacing:"3px" }}>
              {tracks.length===0?"CARGANDO...":"SIN RESULTADOS"}
            </p>
          </div>
        ) : (
          <div style={{ display:"grid",
            gridTemplateColumns: isMobile?"repeat(2,1fr)":"repeat(auto-fill, minmax(220px,1fr))",
            gap:"2px" }}>
            {filtered.map((track,i) => (
              <motion.a key={track.id}
                href={track.slug?`/catalog/${track.slug}`:"#"}
                layout
                initial={{ opacity:0, scale:0.95 }}
                animate={{ opacity:1, scale:1 }}
                exit={{ opacity:0, scale:0.95 }}
                transition={{ duration:0.4, delay:Math.min(i*0.03,0.4) }}
                onMouseEnter={() => !isMobile && setHovered(track.id)}
                onMouseLeave={() => !isMobile && setHovered(null)}
                style={{ position:"relative", display:"block",
                  aspectRatio:"1", overflow:"hidden",
                  background:"#111", textDecoration:"none" }}>

                {track.image_url ? (
                  <motion.div style={{ position:"absolute", inset:0,
                    backgroundImage:`url(${track.image_url})`,
                    backgroundSize:"cover", backgroundPosition:"center" }}
                    animate={{ scale:hovered===track.id?1.08:1 }}
                    transition={{ duration:0.7, ease:[0.22,1,0.36,1] }} />
                ) : (
                  <div style={{ position:"absolute", inset:0,
                    background:`hsl(${i*37},10%,12%)`,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontFamily:"var(--font-display)",
                      fontSize:"80px", color:"rgba(240,240,240,0.04)" }}>♪</span>
                  </div>
                )}

                <div style={{ position:"absolute", inset:0,
                  background:"linear-gradient(to top, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.2) 50%, transparent 100%)" }} />

                {!isMobile && (
                  <motion.div style={{ position:"absolute", inset:0, background:"rgba(168,230,61,0.06)" }}
                    animate={{ opacity:hovered===track.id?1:0 }} transition={{ duration:0.3 }} />
                )}
                {!isMobile && (
                  <motion.div style={{ position:"absolute", inset:0, zIndex:3,
                    display:"flex", alignItems:"center", justifyContent:"center" }}
                    animate={{ opacity:hovered===track.id?1:0 }} transition={{ duration:0.2 }}>
                    <div style={{ width:"52px", height:"52px", borderRadius:"50%",
                      border:"1.5px solid rgba(168,230,61,0.8)",
                      background:"rgba(8,8,8,0.7)", backdropFilter:"blur(8px)",
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ color:"#a8e63d", fontSize:"16px", marginLeft:"3px" }}>▶</span>
                    </div>
                  </motion.div>
                )}

                {track.genre && (
                  <div style={{ position:"absolute", top:"10px", left:"10px", zIndex:3 }}>
                    <span style={{ fontFamily:"var(--font-mono)",
                      fontSize: isMobile?"7px":"8px",
                      letterSpacing:"1px", textTransform:"uppercase",
                      padding:"3px 7px", background:"rgba(8,8,8,0.8)",
                      backdropFilter:"blur(4px)", color:"#a8e63d",
                      border:"1px solid rgba(168,230,61,0.2)" }}>
                      {track.genre}
                    </span>
                  </div>
                )}

                <div style={{ position:"absolute", bottom:0, left:0, right:0,
                  padding: isMobile?"10px":"16px 14px 14px", zIndex:3 }}>
                  <motion.p style={{ fontFamily:"var(--font-display)",
                    fontSize: isMobile?"14px":"17px",
                    lineHeight:1, marginBottom:"3px", letterSpacing:"0.5px" }}
                    animate={{ color:hovered===track.id?"#a8e63d":"#f0f0f0" }}
                    transition={{ duration:0.2 }}>{track.name}</motion.p>
                  <p style={{ fontFamily:"var(--font-mono)",
                    fontSize: isMobile?"9px":"10px",
                    color:"rgba(240,240,240,0.45)", letterSpacing:"1px" }}>
                    {track.artist}
                  </p>
                  {!isMobile && track.bpm>0 && (
                    <p style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                      color:"rgba(240,240,240,0.25)", marginTop:"2px" }}>
                      {track.bpm} BPM
                    </p>
                  )}
                </div>

                {!isMobile && (
                  <motion.div style={{ position:"absolute", bottom:0, left:0, right:0,
                    height:"2px", background:"#a8e63d", transformOrigin:"left", zIndex:4 }}
                    animate={{ scaleX:hovered===track.id?1:0 }}
                    transition={{ duration:0.4, ease:[0.22,1,0.36,1] }} />
                )}
              </motion.a>
            ))}
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}