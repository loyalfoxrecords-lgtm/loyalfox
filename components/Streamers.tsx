"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useIsMobile } from "@/lib/useIsMobile";
import { useLocale } from "@/lib/LocaleContext";

type Streamer = { id:string; name:string; slug:string; image_url:string; bio:string; platform:string; };

export default function Streamers() {
  const { t } = useLocale();
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [hovered, setHovered]     = useState<string|null>(null);
  const [mounted, setMounted]     = useState(false);
  const isMobile = useIsMobile();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target:ref, offset:["start end","center center"] });
  const titleX = useTransform(scrollYProgress, [0,1], [-60,0]);
  const titleO = useTransform(scrollYProgress, [0,0.4], [0,1]);

  useEffect(() => {
    setMounted(true);
    supabase.from("streamers").select("*").order("created_at",{ascending:false}).limit(6)
      .then(({data}) => { if(data) setStreamers(data); });
  }, []);

  if (!mounted) return <section ref={ref} />;
  if (streamers.length===0) return <section ref={ref} />;

  const titleLines = (t.streamers?.title || "NUESTRA\nCOMUNIDAD").split("\n");

  /* ── MÓVIL ── */
  if (isMobile) return (
    <section id="streamers" style={{ padding:"80px 0 60px",
      background:"var(--black)", position:"relative" }}>
      <div style={{ padding:"0 20px 32px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px" }}>
          <div style={{ width:"28px", height:"2px", background:"#a8e63d" }} />
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
            letterSpacing:"3px", textTransform:"uppercase", color:"#a8e63d" }}>
            {t.streamers?.eyebrow || "Streamers"}
          </span>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
          <h2 style={{ fontFamily:"var(--font-display)",
            fontSize:"clamp(40px,12vw,64px)", lineHeight:0.9,
            letterSpacing:"-0.5px", color:"var(--white)" }}>
            {titleLines[0]}<br />
            <span style={{ color:"transparent",
              WebkitTextStroke:"1.5px rgba(240,240,240,0.12)" }}>
              {titleLines[1]}
            </span>
          </h2>
          <a href="/streamers" style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
            letterSpacing:"2px", textTransform:"uppercase",
            color:"rgba(240,240,240,0.4)", textDecoration:"none" }}>
            {t.streamers?.viewMore || "Ver todos →"}
          </a>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px" }}>
        {streamers.map((s,i) => (
          <a key={s.id} href={`/streamers/${s.slug}`}
            style={{ position:"relative", display:"block", aspectRatio:"4/3",
              overflow:"hidden", background:"#111", textDecoration:"none" }}>
            {s.image_url ? (
              <div style={{ position:"absolute", inset:0,
                backgroundImage:`url(${s.image_url})`,
                backgroundSize:"cover", backgroundPosition:"center" }} />
            ) : (
              <div style={{ position:"absolute", inset:0,
                background:`hsl(${i*60},8%,13%)`,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontFamily:"var(--font-display)",
                  fontSize:"48px", color:"rgba(240,240,240,0.04)" }}>{s.name[0]}</span>
              </div>
            )}
            <div style={{ position:"absolute", inset:0,
              background:"linear-gradient(to top, rgba(8,8,8,0.95) 0%, transparent 60%)" }} />
            {s.platform && (
              <div style={{ position:"absolute", top:"8px", right:"8px", zIndex:3 }}>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:"7px",
                  letterSpacing:"1px", textTransform:"uppercase",
                  padding:"3px 7px", background:"rgba(8,8,8,0.8)",
                  color:"#a8e63d", border:"1px solid rgba(168,230,61,0.2)" }}>
                  {s.platform}
                </span>
              </div>
            )}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"10px" }}>
              <p style={{ fontFamily:"var(--font-display)", fontSize:"16px",
                lineHeight:1, color:"#f0f0f0" }}>{s.name}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );

  /* ── DESKTOP ── */
  return (
    <section ref={ref} id="streamers" style={{ padding:"140px 0",
      background:"var(--black)", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", left:"-20px", top:"20%",
        fontFamily:"var(--font-display)", fontSize:"clamp(150px,22vw,320px)",
        color:"rgba(240,240,240,0.018)", lineHeight:1,
        userSelect:"none", pointerEvents:"none" }}>05</div>

      <motion.div style={{ padding:"0 56px", marginBottom:"80px",
        display:"flex", justifyContent:"space-between",
        alignItems:"flex-end", flexWrap:"wrap", gap:"24px",
        x:titleX, opacity:titleO }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"20px" }}>
            <div style={{ width:"40px", height:"2px", background:"#a8e63d" }} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
              letterSpacing:"4px", textTransform:"uppercase", color:"#a8e63d" }}>
              05 — {t.streamers?.eyebrow || "Streamers"}
            </span>
          </div>
          <h2 style={{ fontFamily:"var(--font-display)",
            fontSize:"clamp(56px,8vw,110px)", lineHeight:0.88,
            letterSpacing:"-1px", color:"var(--white)" }}>
            {titleLines[0]}<br />
            <span style={{ color:"transparent",
              WebkitTextStroke:"2px rgba(240,240,240,0.12)" }}>
              {titleLines[1]}
            </span>
          </h2>
        </div>
        <a href="/streamers" style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
          letterSpacing:"3px", textTransform:"uppercase",
          color:"rgba(240,240,240,0.4)", textDecoration:"none", transition:"color .2s" }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color="#a8e63d"}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color="rgba(240,240,240,0.4)"}>
          {t.streamers?.viewMore || "Ver todos →"}
        </a>
      </motion.div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"2px" }}>
        {streamers.map((s,i) => (
          <motion.a key={s.id} href={`/streamers/${s.slug}`}
            initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true, margin:"-40px" }}
            transition={{ duration:0.7, delay:i*0.09, ease:[0.22,1,0.36,1] }}
            onMouseEnter={() => setHovered(s.id)} onMouseLeave={() => setHovered(null)}
            style={{ position:"relative", display:"block", aspectRatio:"4/3",
              overflow:"hidden", background:"#111", textDecoration:"none" }}>
            {s.image_url ? (
              <motion.div style={{ position:"absolute", inset:0,
                backgroundImage:`url(${s.image_url})`,
                backgroundSize:"cover", backgroundPosition:"center" }}
                animate={{ scale:hovered===s.id?1.06:1 }}
                transition={{ duration:0.8, ease:[0.22,1,0.36,1] }} />
            ) : (
              <div style={{ position:"absolute", inset:0,
                background:`hsl(${i*60},8%,13%)`,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontFamily:"var(--font-display)",
                  fontSize:"80px", color:"rgba(240,240,240,0.04)" }}>{s.name[0]}</span>
              </div>
            )}
            <div style={{ position:"absolute", inset:0,
              background:"linear-gradient(to top, rgba(8,8,8,0.95) 0%, rgba(8,8,8,0.2) 55%, transparent 100%)" }} />
            <motion.div style={{ position:"absolute", inset:0, background:"rgba(168,230,61,0.05)" }}
              animate={{ opacity:hovered===s.id?1:0 }} transition={{ duration:0.3 }} />
            {s.platform && (
              <div style={{ position:"absolute", top:"14px", right:"14px", zIndex:3 }}>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:"8px",
                  letterSpacing:"1px", textTransform:"uppercase",
                  padding:"4px 10px", background:"rgba(8,8,8,0.8)",
                  backdropFilter:"blur(4px)", color:"#a8e63d",
                  border:"1px solid rgba(168,230,61,0.2)" }}>{s.platform}</span>
              </div>
            )}
            <div style={{ position:"absolute", bottom:0, left:0, right:0,
              padding:"28px 20px 20px", zIndex:3 }}>
              <motion.p style={{ fontFamily:"var(--font-display)", fontSize:"26px",
                lineHeight:1, marginBottom:"6px", letterSpacing:"0.5px" }}
                animate={{ color:hovered===s.id?"#a8e63d":"#f0f0f0", y:hovered===s.id?-4:0 }}
                transition={{ duration:0.25 }}>{s.name}</motion.p>
              {s.bio && (
                <p style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                  lineHeight:1.6, color:"rgba(240,240,240,0.35)",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {s.bio}
                </p>
              )}
            </div>
            <motion.div style={{ position:"absolute", bottom:0, left:0, right:0,
              height:"2px", background:"#a8e63d", transformOrigin:"left", zIndex:4 }}
              animate={{ scaleX:hovered===s.id?1:0 }}
              transition={{ duration:0.4, ease:[0.22,1,0.36,1] }} />
          </motion.a>
        ))}
      </div>
    </section>
  );
}