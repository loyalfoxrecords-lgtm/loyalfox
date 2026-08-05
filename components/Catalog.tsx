"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/lib/LocaleContext";
import { useIsMobile } from "@/lib/useIsMobile";

type Track = {
  id: string; name: string; artist: string; genre: string;
  bpm: number; image_url: string; slug: string;
};
const GENRES = ["all","house","deep","techno","ambient"];
const LIMIT  = 12; // 2 filas de 6

export default function Catalog() {
  const { t } = useLocale();
  const isMobile = useIsMobile();
  const [active, setActive]   = useState("all");
  const [tracks, setTracks]   = useState<Track[]>([]);
  const [hovered, setHovered] = useState<string|null>(null);
  const [showAll, setShowAll] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target:ref, offset:["start end","end start"] });
  const headerX = useTransform(scrollYProgress, [0,0.3], [-40,0]);
  const headerO = useTransform(scrollYProgress, [0,0.2], [0,1]);

  useEffect(() => {
    supabase.from("tracks").select("*").order("created_at",{ascending:false})
      .then(({data}) => { if(data) setTracks(data); });
  }, []);

  // Reset showAll cuando cambia el filtro
  useEffect(() => { setShowAll(false); }, [active]);

  const filtered = active==="all" ? tracks : tracks.filter(tr=>tr.genre?.toLowerCase()===active);
  const visible  = showAll ? filtered : filtered.slice(0, LIMIT);
  const hasMore  = filtered.length > LIMIT && !showAll;

  /* ── MÓVIL ── */
  if (isMobile) return (
    <section id="catalog" style={{ padding:"80px 0 60px",
      background:"var(--black)", position:"relative" }}>
      <div style={{ padding:"0 20px 32px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px" }}>
          <div style={{ width:"28px", height:"2px", background:"#a8e63d" }} />
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
            letterSpacing:"3px", textTransform:"uppercase", color:"#a8e63d" }}>
            Catálogo
          </span>
        </div>
        <h2 style={{ fontFamily:"var(--font-display)",
          fontSize:"clamp(40px,12vw,64px)", lineHeight:0.9,
          letterSpacing:"-0.5px", color:"var(--white)", marginBottom:"24px" }}>
          MÚSICA<br />
          <span style={{ color:"transparent",
            WebkitTextStroke:"1.5px rgba(240,240,240,0.12)" }}>
            DEL SELLO
          </span>
        </h2>
        <div style={{ display:"flex", gap:"6px", overflowX:"auto",
          paddingBottom:"4px", scrollbarWidth:"none" as any }}>
          {GENRES.map(g => (
            <button key={g} onClick={() => setActive(g)}
              style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                letterSpacing:"2px", textTransform:"uppercase",
                padding:"8px 14px", flexShrink:0,
                background: active===g?"#a8e63d":"transparent",
                border: active===g?"1px solid #a8e63d":"1px solid rgba(255,255,255,0.15)",
                color: active===g?"#080808":"rgba(240,240,240,0.5)",
                cursor:"pointer", fontWeight:active===g?700:400 }}>
              {g==="all"?"Todo":g}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px" }}>
        {filtered.slice(0,8).map((track,i) => (
          <a key={track.id}
            href={track.slug?`/catalog/${track.slug}`:"#"}
            style={{ position:"relative", display:"block",
              aspectRatio:"1", overflow:"hidden",
              background:"#111", textDecoration:"none" }}>
            {track.image_url ? (
              <div style={{ position:"absolute", inset:0,
                backgroundImage:`url(${track.image_url})`,
                backgroundSize:"cover", backgroundPosition:"center" }} />
            ) : (
              <div style={{ position:"absolute", inset:0,
                background:`hsl(${i*37},10%,12%)`,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontFamily:"var(--font-display)",
                  fontSize:"40px", color:"rgba(240,240,240,0.04)" }}>♪</span>
              </div>
            )}
            <div style={{ position:"absolute", inset:0,
              background:"linear-gradient(to top, rgba(8,8,8,0.95) 0%, transparent 60%)" }} />
            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"12px 10px" }}>
              <p style={{ fontFamily:"var(--font-display)", fontSize:"14px",
                lineHeight:1, marginBottom:"2px", color:"#f0f0f0" }}>
                {track.name}
              </p>
              <p style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                color:"rgba(240,240,240,0.45)" }}>{track.artist}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Ver catálogo completo móvil */}
      <div style={{ padding:"16px 20px 0" }}>
        <a href="/catalog"
          style={{ display:"block", padding:"14px", textAlign:"center",
            background:"#a8e63d", color:"#080808",
            fontFamily:"var(--font-mono)", fontSize:"10px",
            letterSpacing:"3px", textTransform:"uppercase",
            fontWeight:700, textDecoration:"none" }}>
          Ver catálogo completo →
        </a>
      </div>

      {/* Spotify banner móvil */}
      <div style={{ margin:"24px 20px 0", padding:"24px 20px",
        background:"#0d0d0d", border:"1px solid rgba(168,230,61,0.1)",
        display:"flex", flexDirection:"column", gap:"16px" }}>
        <p style={{ fontFamily:"var(--font-display)", fontSize:"22px",
          letterSpacing:"1px", color:"var(--white)" }}>
          ESCÚCHANOS EN SPOTIFY
        </p>
        <a href="https://open.spotify.com" target="_blank" rel="noreferrer"
          style={{ display:"flex", alignItems:"center", justifyContent:"center",
            gap:"8px", padding:"14px",
            background:"#1DB954", color:"#000",
            fontFamily:"var(--font-mono)", fontSize:"10px",
            letterSpacing:"2px", textTransform:"uppercase",
            fontWeight:700, textDecoration:"none" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Abrir playlist
        </a>
      </div>
    </section>
  );

  /* ── DESKTOP ── */
  return (
    <section ref={ref} id="catalog" style={{ padding:"140px 0",
      background:"var(--black)", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", right:"48px", top:"50%",
        transform:"translateY(-50%)", zIndex:0,
        fontFamily:"var(--font-display)", fontSize:"clamp(120px,18vw,280px)",
        color:"rgba(240,240,240,0.02)", lineHeight:1,
        userSelect:"none", pointerEvents:"none" }}>01</div>

      <motion.div style={{ padding:"0 56px", marginBottom:"80px",
        display:"flex", justifyContent:"space-between",
        alignItems:"flex-end", flexWrap:"wrap", gap:"32px",
        x:headerX, opacity:headerO }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"20px" }}>
            <div style={{ width:"40px", height:"2px", background:"#a8e63d" }} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
              letterSpacing:"4px", textTransform:"uppercase", color:"#a8e63d" }}>
              01 — {t.catalog?.eyebrow||"Catálogo"}
            </span>
          </div>
          <h2 style={{ fontFamily:"var(--font-display)",
            fontSize:"clamp(56px,8vw,110px)", lineHeight:0.88,
            letterSpacing:"-1px", color:"var(--white)" }}>
            MÚSICA<br />
            <span style={{ color:"transparent",
              WebkitTextStroke:"2px rgba(240,240,240,0.12)" }}>DEL SELLO</span>
          </h2>
        </div>
        <div style={{ display:"flex", gap:"2px", flexWrap:"wrap" }}>
          {GENRES.map(g => (
            <button key={g} onClick={() => setActive(g)}
              style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                letterSpacing:"2px", textTransform:"uppercase", padding:"10px 20px",
                background:active===g?"#a8e63d":"transparent",
                border:active===g?"1px solid #a8e63d":"1px solid rgba(255,255,255,0.1)",
                color:active===g?"#080808":"rgba(240,240,240,0.4)",
                cursor:"pointer", transition:"all .25s", fontWeight:active===g?700:400 }}
              onMouseEnter={(e) => { if(active!==g){ (e.currentTarget as HTMLElement).style.borderColor="#a8e63d"; (e.currentTarget as HTMLElement).style.color="#a8e63d"; }}}
              onMouseLeave={(e) => { if(active!==g){ (e.currentTarget as HTMLElement).style.borderColor="rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color="rgba(240,240,240,0.4)"; }}}>
              {g==="all"?"Todo":g}
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {filtered.length===0 ? (
          <div style={{ padding:"80px 56px", textAlign:"center" }}>
            <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
              color:"rgba(240,240,240,0.2)", letterSpacing:"3px" }}>CARGANDO...</p>
          </div>
        ) : (
          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(6, 1fr)", gap:"2px" }}>
            {visible.map((track,i) => (
              <motion.a key={track.id} href={track.slug?`/catalog/${track.slug}`:"#"}
                layout initial={{ opacity:0, scale:0.95 }}
                animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.95 }}
                transition={{ duration:0.4, delay:Math.min(i*0.04,0.4) }}
                onMouseEnter={() => setHovered(track.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ position:"relative", display:"block", aspectRatio:"1",
                  overflow:"hidden", background:"#111", textDecoration:"none" }}>
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
                <motion.div style={{ position:"absolute", inset:0, background:"rgba(168,230,61,0.06)" }}
                  animate={{ opacity:hovered===track.id?1:0 }} transition={{ duration:0.3 }} />
                <motion.div style={{ position:"absolute", inset:0, zIndex:3,
                  display:"flex", alignItems:"center", justifyContent:"center" }}
                  animate={{ opacity:hovered===track.id?1:0 }} transition={{ duration:0.2 }}>
                  <div style={{ width:"56px", height:"56px", borderRadius:"50%",
                    border:"1.5px solid rgba(168,230,61,0.8)",
                    background:"rgba(8,8,8,0.7)", backdropFilter:"blur(8px)",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ color:"#a8e63d", fontSize:"18px", marginLeft:"4px" }}>▶</span>
                  </div>
                </motion.div>
                {track.genre && (
                  <div style={{ position:"absolute", top:"12px", left:"12px", zIndex:3 }}>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:"8px",
                      letterSpacing:"1px", textTransform:"uppercase",
                      padding:"3px 8px", background:"rgba(8,8,8,0.8)",
                      backdropFilter:"blur(4px)", color:"#a8e63d",
                      border:"1px solid rgba(168,230,61,0.2)" }}>
                      {track.genre}
                    </span>
                  </div>
                )}
                <div style={{ position:"absolute", bottom:0, left:0, right:0,
                  padding:"20px 16px 16px", zIndex:3 }}>
                  <motion.p style={{ fontFamily:"var(--font-display)", fontSize:"18px",
                    lineHeight:1, marginBottom:"4px", letterSpacing:"0.5px" }}
                    animate={{ color:hovered===track.id?"#a8e63d":"#f0f0f0" }}
                    transition={{ duration:0.2 }}>{track.name}</motion.p>
                  <p style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                    color:"rgba(240,240,240,0.45)", letterSpacing:"1px" }}>
                    {track.artist}
                  </p>
                </div>
                <motion.div style={{ position:"absolute", bottom:0, left:0, right:0,
                  height:"2px", background:"#a8e63d", transformOrigin:"left", zIndex:4 }}
                  animate={{ scaleX:hovered===track.id?1:0 }}
                  transition={{ duration:0.4, ease:[0.22,1,0.36,1] }} />
              </motion.a>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Botones ver más / catálogo completo */}
      {filtered.length > 0 && (
        <div style={{ display:"flex", justifyContent:"center",
          gap:"12px", marginTop:"2px", flexWrap:"wrap" }}>
          {hasMore && (
            <button onClick={() => setShowAll(true)}
              style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                letterSpacing:"3px", textTransform:"uppercase",
                padding:"16px 40px", background:"transparent",
                border:"1px solid rgba(168,230,61,0.3)",
                color:"#a8e63d", cursor:"pointer", transition:"all .3s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background="#a8e63d"; (e.currentTarget as HTMLElement).style.color="#080808"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background="transparent"; (e.currentTarget as HTMLElement).style.color="#a8e63d"; }}>
              Ver más ({filtered.length - LIMIT} canciones más)
            </button>
          )}
          <a href="/catalog"
            style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
              letterSpacing:"3px", textTransform:"uppercase",
              padding:"16px 40px", background:"#a8e63d",
              color:"#080808", fontWeight:700,
              textDecoration:"none", transition:"all .3s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background="#c5f560"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background="#a8e63d"; }}>
            Catálogo completo →
          </a>
        </div>
      )}

      {/* Spotify banner */}
      <div style={{ margin:"80px 56px 0", background:"linear-gradient(135deg,#0d0d0d,#111)",
        border:"1px solid rgba(168,230,61,0.1)", padding:"48px 56px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        gap:"32px", flexWrap:"wrap", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", right:"-20px", top:"-20px",
          width:"200px", height:"200px", borderRadius:"50%",
          background:"radial-gradient(circle, rgba(168,230,61,0.06), transparent 70%)",
          pointerEvents:"none" }} />
        <div style={{ display:"flex", alignItems:"center", gap:"24px" }}>
          <div style={{ display:"flex", alignItems:"flex-end", gap:"3px", height:"28px", flexShrink:0 }}>
            {[6,16,28,11,22,8,18,24].map((h,i) => (
              <span key={i} style={{ display:"block", width:"3px", borderRadius:"2px",
                height:`${h}px`, background:"#a8e63d",
                animation:`wave 1.3s ease-in-out ${i*0.12}s infinite` }} />
            ))}
          </div>
          <div>
            <p style={{ fontFamily:"var(--font-display)", fontSize:"28px",
              letterSpacing:"1px", color:"var(--white)", marginBottom:"4px" }}>
              ESCÚCHANOS EN SPOTIFY
            </p>
            <p style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
              color:"rgba(240,240,240,0.3)", letterSpacing:"1px" }}>
              Actualizado continuamente
            </p>
          </div>
        </div>
        <a href="https://open.spotify.com" target="_blank" rel="noreferrer"
          style={{ display:"inline-flex", alignItems:"center", gap:"10px",
            fontFamily:"var(--font-mono)", fontSize:"10px",
            letterSpacing:"2px", textTransform:"uppercase",
            padding:"16px 32px", background:"#1DB954", color:"#000",
            fontWeight:700, textDecoration:"none", transition:"all .3s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background="#1ed760"; (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background="#1DB954"; (e.currentTarget as HTMLElement).style.transform="none"; }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Abrir playlist
        </a>
      </div>
    </section>
  );
}