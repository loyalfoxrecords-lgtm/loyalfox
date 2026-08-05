"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/lib/LocaleContext";

export default function Hero() {
  const { t } = useLocale();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset:["start start","end start"] });
  const imgY  = useTransform(scrollYProgress, [0,1], ["0%","25%"]);
  const textY = useTransform(scrollYProgress, [0,1], ["0%","15%"]);

  const [stats, setStats] = useState([
    { n:"—",    l:"Tracks"   },
    { n:"—",    l:"Streams"  },
    { n:"—",    l:"Artistas" },
    { n:"2025", l:"Fundado"  },
  ]);

  useEffect(() => {
    const load = async () => {
      const [
        { data: tracks },
        { data: artists },
        { data: analytics },
      ] = await Promise.all([
        supabase.from("tracks").select("id"),
        supabase.from("artists").select("id"),
        supabase.from("analytics_monthly").select("total_streams"),
      ]);

      const totalTracks  = tracks?.length || 0;
      const totalArtists = artists?.length || 0;
      const totalStreams  = analytics?.reduce((a,m) => a + (m.total_streams || 0), 0) || 0;

      const fmtN = (n: number) =>
        n >= 1000000 ? `${(n/1000000).toFixed(1)}M`
        : n >= 1000  ? `${(n/1000).toFixed(1)}K`
        : String(n);

      setStats([
        { n: String(totalTracks),  l:"Tracks"   },
        { n: fmtN(totalStreams),   l:"Streams"  },
        { n: String(totalArtists), l:"Artistas" },
        { n: "2025",               l:"Fundado"  },
      ]);
    };
    load();
  }, []);

  return (
    <section ref={ref} style={{ position:"relative", height:"100vh",
      minHeight:"600px", overflow:"hidden", background:"#080808" }}>

      {/* Imagen parallax */}
      <motion.div style={{
        position:"absolute", inset:"-15%",
        backgroundImage:"url('/hero-bg.jpg')",
        backgroundSize:"cover", backgroundPosition:"center",
        y: imgY,
      }} />

      {/* Overlays */}
      <div style={{ position:"absolute", inset:0,
        background:"linear-gradient(135deg, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.6) 50%, rgba(8,8,8,0.3) 100%)" }} />
      <div style={{ position:"absolute", inset:0,
        background:"linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.4) 30%, transparent 60%)" }} />

      {/* Accent line izquierda */}
      <motion.div
        initial={{ scaleY:0 }}
        animate={{ scaleY:1 }}
        transition={{ duration:1.2, delay:0.5, ease:[0.22,1,0.36,1] }}
        style={{ position:"absolute", left:"48px", top:"15%", bottom:"15%",
          width:"2px", background:"linear-gradient(to bottom, transparent, #a8e63d, transparent)",
          transformOrigin:"top", zIndex:5 }} />

      {/* Contenido */}
      <motion.div style={{ position:"relative", zIndex:10,
        height:"100%", display:"flex", flexDirection:"column",
        justifyContent:"center", padding:"0 80px 100px", y: textY }}>

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity:0, x:-20 }}
          animate={{ opacity:1, x:0 }}
          transition={{ duration:0.6, delay:0.3 }}
          style={{ display:"flex", alignItems:"center",
            gap:"16px", marginBottom:"40px" }}>
          <div style={{ width:"40px", height:"1px", background:"#a8e63d" }} />
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
            letterSpacing:"4px", textTransform:"uppercase",
            color:"rgba(168,230,61,0.8)" }}>
            Electronic Music Label · Est. 2025
          </span>
        </motion.div>

        {/* Título */}
        <div style={{ marginBottom:"48px" }}>
          {["LOYAL", "FOX", "RECORDS"].map((word, i) => (
            <div key={word} style={{ overflow:"hidden", lineHeight:0.85 }}>
              <motion.div
                initial={{ y:"100%" }}
                animate={{ y:"0%" }}
                transition={{ duration:1, delay:0.4+i*0.12, ease:[0.22,1,0.36,1] }}>
                <span style={{
                  fontFamily:"var(--font-display)",
                  display:"block",
                  fontSize:"clamp(88px,13vw,180px)",
                  letterSpacing:"-1px",
                  color: i === 1 ? "#a8e63d" : i === 2 ? "transparent" : "#f0f0f0",
                  WebkitTextStroke: i === 2 ? "2px rgba(240,240,240,0.15)" : undefined,
                }}>
                  {word}
                </span>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Subtítulo + CTAs */}
        <div style={{ display:"flex", alignItems:"flex-end",
          gap:"64px", flexWrap:"wrap" }}>
          <motion.p
            initial={{ opacity:0, y:16 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.7, delay:0.8 }}
            style={{ fontFamily:"var(--font-mono)", fontSize:"12px",
              lineHeight:1.9, maxWidth:"320px",
              color:"rgba(240,240,240,0.45)", letterSpacing:"0.3px" }}>
            {t.hero?.sub || "Música electrónica de vanguardia. House, deep, ambient. Producimos y distribuimos artistas que empujan los límites del sonido."}
          </motion.p>

          <motion.div
            initial={{ opacity:0, y:16 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.7, delay:1 }}
            style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
            <a href="#catalog"
              style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                letterSpacing:"3px", textTransform:"uppercase",
                padding:"16px 36px", background:"#a8e63d", color:"#080808",
                fontWeight:700, textDecoration:"none", transition:"all .3s" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#c5f560";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "#a8e63d";
                (e.currentTarget as HTMLElement).style.transform = "none";
              }}>
              Escuchar música
            </a>
            <a href="/send-demo"
              style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                letterSpacing:"3px", textTransform:"uppercase",
                padding:"16px 36px",
                border:"1px solid rgba(240,240,240,0.2)",
                color:"rgba(240,240,240,0.6)",
                textDecoration:"none", transition:"all .3s" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#a8e63d";
                (e.currentTarget as HTMLElement).style.color = "#a8e63d";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,240,240,0.2)";
                (e.currentTarget as HTMLElement).style.color = "rgba(240,240,240,0.6)";
              }}>
              Enviar demo
            </a>
          </motion.div>
        </div>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity:0, y:20 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.8, delay:1.2 }}
        style={{ position:"absolute", bottom:0, left:0, right:0, zIndex:10,
          display:"grid", gridTemplateColumns:"repeat(4,1fr)",
          borderTop:"1px solid rgba(168,230,61,0.1)",
          background:"rgba(8,8,8,0.7)", backdropFilter:"blur(20px)" }}>
        {stats.map((s,i) => (
          <div key={i} style={{ padding:"20px 40px",
            borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none",
            display:"flex", alignItems:"center", gap:"16px" }}>
            <span style={{ fontFamily:"var(--font-display)", fontSize:"36px",
              lineHeight:1, color:"#a8e63d" }}>
              {s.n}
            </span>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
              letterSpacing:"2px", textTransform:"uppercase",
              color:"rgba(240,240,240,0.3)", lineHeight:1.4 }}>
              {s.l}
            </span>
          </div>
        ))}
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity:0 }}
        animate={{ opacity:1 }}
        transition={{ delay:1.5 }}
        style={{ position:"absolute", bottom:"80px", right:"48px",
          zIndex:10, display:"flex", flexDirection:"column",
          alignItems:"center", gap:"8px" }}>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:"8px",
          letterSpacing:"3px", textTransform:"uppercase",
          color:"rgba(240,240,240,0.25)", writingMode:"vertical-rl" }}>
          scroll
        </span>
        <motion.div
          animate={{ y:[0,8,0] }}
          transition={{ duration:1.5, repeat:Infinity }}
          style={{ width:"1px", height:"40px",
            background:"linear-gradient(to bottom, rgba(168,230,61,0.5), transparent)" }} />
      </motion.div>
    </section>
  );
}