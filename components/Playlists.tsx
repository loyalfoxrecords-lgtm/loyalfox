"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useIsMobile } from "@/lib/useIsMobile";

type Playlist = { id:string; name:string; image_url:string; description:string; };

export default function Playlists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [hovered, setHovered]     = useState<string|null>(null);
  const isMobile = useIsMobile();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target:ref, offset:["start end","center center"] });
  const titleY = useTransform(scrollYProgress, [0,1], [50,0]);
  const titleO = useTransform(scrollYProgress, [0,0.4], [0,1]);

  useEffect(() => {
    supabase.from("playlists").select("*").order("created_at",{ascending:false})
      .then(({data}) => { if(data) setPlaylists(data); });
  }, []);

  /* ── MÓVIL ── */
  if (isMobile) return (
    <section id="playlists" style={{ padding:"80px 0 60px",
      background:"var(--black2)", position:"relative" }}>
      <div style={{ padding:"0 20px 32px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px" }}>
          <div style={{ width:"28px", height:"2px", background:"#a8e63d" }} />
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
            letterSpacing:"3px", textTransform:"uppercase", color:"#a8e63d" }}>
            Playlists
          </span>
        </div>
        <h2 style={{ fontFamily:"var(--font-display)",
          fontSize:"clamp(40px,12vw,64px)", lineHeight:0.9,
          letterSpacing:"-0.5px", color:"var(--white)" }}>
          CURATED<br />
          <span style={{ color:"transparent",
            WebkitTextStroke:"1.5px rgba(240,240,240,0.12)" }}>PLAYLISTS</span>
        </h2>
      </div>
      {playlists.length===0 ? (
        <div style={{ padding:"40px", textAlign:"center" }}>
          <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
            color:"rgba(240,240,240,0.2)", letterSpacing:"3px" }}>CARGANDO...</p>
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px" }}>
          {playlists.map((pl,i) => (
            <a key={pl.id} href="/playlists"
              style={{ position:"relative", display:"block", aspectRatio:"1",
                overflow:"hidden", background:"#111", textDecoration:"none" }}>
              {pl.image_url ? (
                <div style={{ position:"absolute", inset:0,
                  backgroundImage:`url(${pl.image_url})`,
                  backgroundSize:"cover", backgroundPosition:"center" }} />
              ) : (
                <div style={{ position:"absolute", inset:0,
                  background:`hsl(${i*55},8%,14%)`,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontFamily:"var(--font-display)",
                    fontSize:"48px", color:"rgba(240,240,240,0.04)" }}>♫</span>
                </div>
              )}
              <div style={{ position:"absolute", inset:0,
                background:"linear-gradient(to top, rgba(8,8,8,0.95) 0%, transparent 60%)" }} />
              <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"12px 10px" }}>
                <p style={{ fontFamily:"var(--font-display)", fontSize:"14px",
                  lineHeight:1, color:"#f0f0f0", marginBottom:"4px" }}>{pl.name}</p>
                <p style={{ fontFamily:"var(--font-mono)", fontSize:"8px",
                  color:"#a8e63d", letterSpacing:"1px", textTransform:"uppercase" }}>
                  Escuchar ▶
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  );

  /* ── DESKTOP ── (original) */
  return (
    <section ref={ref} id="playlists" style={{ padding:"140px 0",
      background:"var(--black2)", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", right:"-20px", bottom:"10%",
        fontFamily:"var(--font-display)", fontSize:"clamp(150px,22vw,320px)",
        color:"rgba(240,240,240,0.018)", lineHeight:1,
        userSelect:"none", pointerEvents:"none" }}>04</div>
      <motion.div style={{ padding:"0 56px", marginBottom:"80px",
        display:"flex", justifyContent:"space-between",
        alignItems:"flex-end", flexWrap:"wrap", gap:"24px",
        y:titleY, opacity:titleO }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"20px" }}>
            <div style={{ width:"40px", height:"2px", background:"#a8e63d" }} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
              letterSpacing:"4px", textTransform:"uppercase", color:"#a8e63d" }}>
              04 — Playlists
            </span>
          </div>
          <h2 style={{ fontFamily:"var(--font-display)",
            fontSize:"clamp(56px,8vw,110px)", lineHeight:0.88,
            letterSpacing:"-1px", color:"var(--white)" }}>
            CURATED<br />
            <span style={{ color:"transparent",
              WebkitTextStroke:"2px rgba(240,240,240,0.12)" }}>PLAYLISTS</span>
          </h2>
        </div>
        <a href="/playlists" style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
          letterSpacing:"3px", textTransform:"uppercase",
          color:"rgba(240,240,240,0.4)", textDecoration:"none", transition:"color .2s" }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color="#a8e63d"}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color="rgba(240,240,240,0.4)"}>
          Ver todas →
        </a>
      </motion.div>
      {playlists.length===0 ? (
        <div style={{ padding:"80px 56px", textAlign:"center" }}>
          <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
            color:"rgba(240,240,240,0.2)", letterSpacing:"3px" }}>CARGANDO...</p>
        </div>
      ) : (
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))", gap:"2px" }}>
          {playlists.map((pl,i) => (
            <motion.a key={pl.id} href="/playlists"
              initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true, margin:"-40px" }}
              transition={{ duration:0.6, delay:i*0.07, ease:[0.22,1,0.36,1] }}
              onMouseEnter={() => setHovered(pl.id)} onMouseLeave={() => setHovered(null)}
              style={{ position:"relative", display:"block", aspectRatio:"1",
                overflow:"hidden", background:"#111", textDecoration:"none" }}>
              {pl.image_url ? (
                <motion.div style={{ position:"absolute", inset:0,
                  backgroundImage:`url(${pl.image_url})`,
                  backgroundSize:"cover", backgroundPosition:"center" }}
                  animate={{ scale:hovered===pl.id?1.08:1 }}
                  transition={{ duration:0.7, ease:[0.22,1,0.36,1] }} />
              ) : (
                <div style={{ position:"absolute", inset:0,
                  background:`hsl(${i*55},8%,14%)`,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontFamily:"var(--font-display)",
                    fontSize:"72px", color:"rgba(240,240,240,0.04)" }}>♫</span>
                </div>
              )}
              <div style={{ position:"absolute", inset:0,
                background:"linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.2) 55%, transparent 100%)" }} />
              <motion.div style={{ position:"absolute", inset:0, background:"rgba(168,230,61,0.06)" }}
                animate={{ opacity:hovered===pl.id?1:0 }} transition={{ duration:0.3 }} />
              <div style={{ position:"absolute", top:"14px", left:"14px", zIndex:3 }}>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                  letterSpacing:"1px", color:"rgba(240,240,240,0.2)" }}>
                  {String(i+1).padStart(2,"0")}
                </span>
              </div>
              <motion.div style={{ position:"absolute", inset:0, zIndex:3,
                display:"flex", alignItems:"center", justifyContent:"center" }}
                animate={{ opacity:hovered===pl.id?1:0 }} transition={{ duration:0.2 }}>
                <div style={{ width:"56px", height:"56px", borderRadius:"50%",
                  border:"1.5px solid rgba(168,230,61,0.8)",
                  background:"rgba(8,8,8,0.7)", backdropFilter:"blur(8px)",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ color:"#a8e63d", fontSize:"18px", marginLeft:"4px" }}>▶</span>
                </div>
              </motion.div>
              <div style={{ position:"absolute", bottom:0, left:0, right:0,
                padding:"20px 18px 16px", zIndex:3 }}>
                <motion.p style={{ fontFamily:"var(--font-display)", fontSize:"20px",
                  lineHeight:1.1, marginBottom:"6px", letterSpacing:"0.5px" }}
                  animate={{ color:hovered===pl.id?"#a8e63d":"#f0f0f0", y:hovered===pl.id?-4:0 }}
                  transition={{ duration:0.25 }}>{pl.name}</motion.p>
                {pl.description && (
                  <p style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                    lineHeight:1.6, color:"rgba(240,240,240,0.35)",
                    overflow:"hidden", textOverflow:"ellipsis",
                    display:"-webkit-box", WebkitLineClamp:2,
                    WebkitBoxOrient:"vertical" as any }}>
                    {pl.description}
                  </p>
                )}
              </div>
              <motion.div style={{ position:"absolute", bottom:0, left:0, right:0,
                height:"2px", background:"#a8e63d", transformOrigin:"left", zIndex:4 }}
                animate={{ scaleX:hovered===pl.id?1:0 }}
                transition={{ duration:0.4, ease:[0.22,1,0.36,1] }} />
            </motion.a>
          ))}
        </div>
      )}
    </section>
  );
}