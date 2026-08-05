"use client";
import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useIsMobile } from "@/lib/useIsMobile";
import { useLocale } from "@/lib/LocaleContext";

export default function About() {
  const isMobile = useIsMobile();
  const { t } = useLocale();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target:ref, offset:["start end","end start"] });
  const imgScale = useTransform(scrollYProgress, [0,1], [1.15,1]);
  const imgY     = useTransform(scrollYProgress, [0,1], ["5%","-5%"]);
  const textY    = useTransform(scrollYProgress, [0.1,0.7], [40,0]);
  const textO    = useTransform(scrollYProgress, [0.1,0.4], [0,1]);

  const [stats, setStats] = useState({ tracks:0, streams:0, artists:0 });
  useEffect(() => {
    const load = async () => {
      const [{ data:tracks },{ data:artists },{ data:analytics }] = await Promise.all([
        supabase.from("tracks").select("id"),
        supabase.from("artists").select("id"),
        supabase.from("analytics_monthly").select("total_streams"),
      ]);
      setStats({
        tracks: tracks?.length||0, artists: artists?.length||0,
        streams: analytics?.reduce((a,m)=>a+(m.total_streams||0),0)||0,
      });
    };
    load();
  }, []);

  const fmtN = (n:number) => n>=1000000?`${(n/1000000).toFixed(1)}M`:n>=1000?`${(n/1000).toFixed(1)}K`:String(n);

  const statsData = [
    { n:String(stats.tracks),  l:t.about?.catalogSub  || "Tracks publicados" },
    { n:fmtN(stats.streams),   l:t.about?.distroSub   || "Reproducciones"    },
    { n:String(stats.artists), l:t.about?.genresSub    || "Artistas activos"  },
    { n:"2025",                l:t.about?.founded      || "Año de fundación"  },
  ];

  const values = [
    { n:"01", title:t.about?.catalog    || "Comunidad",    desc:t.about?.p1 || "Un sello construido sobre relaciones reales entre artistas, oyentes y creadores de contenido." },
    { n:"02", title:t.about?.genres     || "Calidad",      desc:t.about?.p2 || "Cada release pasa por un proceso de selección riguroso. Solo publicamos lo que nos mueve de verdad." },
    { n:"03", title:t.about?.distro     || "Distribución", desc:t.about?.p3 || "Presencia en todas las plataformas principales. Tu música donde está tu audiencia." },
    { n:"04", title:t.about?.eyebrow    || "Transparencia",desc:t.about?.quote || "Regalías claras, pagos puntuales y acceso total a tus datos desde tu panel de artista." },
  ];

  /* ── MÓVIL ── */
  if (isMobile) return (
    <section id="about" style={{ background:"var(--black)" }}>
      <div style={{ position:"relative", height:"50vw", minHeight:"200px",
        maxHeight:"300px", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:"-10%",
          backgroundImage:"url('/hero-bg.jpg')",
          backgroundSize:"cover", backgroundPosition:"center" }} />
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom, rgba(8,8,8,0.3), rgba(8,8,8,0.9))" }} />
        <div style={{ position:"absolute", bottom:"20px", left:"20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"8px" }}>
            <div style={{ width:"24px", height:"2px", background:"#a8e63d" }} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
              letterSpacing:"3px", textTransform:"uppercase", color:"#a8e63d" }}>
              {t.about?.eyebrow || "El sello"}
            </span>
          </div>
          <h2 style={{ fontFamily:"var(--font-display)",
            fontSize:"clamp(36px,10vw,56px)", lineHeight:0.9,
            letterSpacing:"-0.5px", color:"var(--white)" }}>
            {t.about?.title?.split("\n")[0] || "MÚSICA SIN"}<br />
            <span style={{ color:"transparent",
              WebkitTextStroke:"1.5px rgba(240,240,240,0.15)" }}>
              {t.about?.title?.split("\n")[1] || "FRONTERAS"}
            </span>
          </h2>
        </div>
      </div>

      <div style={{ padding:"40px 20px" }}>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:"12px",
          lineHeight:2, color:"rgba(240,240,240,0.5)", marginBottom:"20px" }}>
          {t.about?.p1 || "LoyalFox Records nació en 2025 en España con una visión clara: construir el sello independiente con mayor número de oyentes de música electrónica en Europa."}
        </p>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:"12px",
          lineHeight:2, color:"rgba(240,240,240,0.35)", marginBottom:"32px" }}>
          {t.about?.p2 || "No somos solo un sello de distribución. Somos una comunidad de artistas, streamers y creadores que comparten una misma filosofía."}
        </p>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px", marginBottom:"32px" }}>
          {statsData.map((s,i) => (
            <div key={i} style={{ padding:"20px 16px", background:"#0d0d0d",
              borderLeft: i%2===0?"2px solid #a8e63d":"none" }}>
              <p style={{ fontFamily:"var(--font-display)", fontSize:"32px",
                lineHeight:1, color:"#a8e63d", marginBottom:"4px" }}>{s.n}</p>
              <p style={{ fontFamily:"var(--font-mono)", fontSize:"8px",
                letterSpacing:"2px", textTransform:"uppercase",
                color:"rgba(240,240,240,0.3)" }}>{s.l}</p>
            </div>
          ))}
        </div>

        {values.map((v,i) => (
          <div key={v.n} style={{ padding:"20px 0",
            borderBottom:"1px solid rgba(255,255,255,0.05)",
            display:"grid", gridTemplateColumns:"40px 1fr", gap:"16px" }}>
            <span style={{ fontFamily:"var(--font-display)", fontSize:"24px",
              color:"rgba(168,230,61,0.2)", lineHeight:1 }}>{v.n}</span>
            <div>
              <p style={{ fontFamily:"var(--font-display)", fontSize:"18px",
                letterSpacing:"1px", color:"var(--white)", marginBottom:"6px" }}>
                {v.title}
              </p>
              <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
                lineHeight:1.8, color:"rgba(240,240,240,0.35)" }}>{v.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  /* ── DESKTOP ── */
  return (
    <section ref={ref} id="about" style={{ background:"var(--black)", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"relative", height:"70vh", overflow:"hidden" }}>
        <motion.div style={{ position:"absolute", inset:"-10%",
          backgroundImage:"url('/hero-bg.jpg')",
          backgroundSize:"cover", backgroundPosition:"center",
          scale:imgScale, y:imgY }} />
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to bottom, rgba(8,8,8,0.3) 0%, rgba(8,8,8,0.85) 100%)" }} />
        <motion.div style={{ position:"absolute", inset:0, display:"flex",
          alignItems:"flex-end", padding:"56px 56px 64px", y:textY, opacity:textO }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"20px" }}>
              <div style={{ width:"40px", height:"2px", background:"#a8e63d" }} />
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                letterSpacing:"4px", textTransform:"uppercase", color:"#a8e63d" }}>
                03 — {t.about?.eyebrow || "El sello"}
              </span>
            </div>
            <h2 style={{ fontFamily:"var(--font-display)",
              fontSize:"clamp(56px,8vw,110px)", lineHeight:0.88,
              letterSpacing:"-1px", color:"var(--white)" }}>
              {t.about?.title?.split("\n")[0] || "MÚSICA SIN"}<br />
              <span style={{ color:"transparent",
                WebkitTextStroke:"2px rgba(240,240,240,0.15)" }}>
                {t.about?.title?.split("\n")[1] || "FRONTERAS"}
              </span>
            </h2>
          </div>
        </motion.div>
      </div>

      <div style={{ padding:"100px 56px", display:"grid",
        gridTemplateColumns:"1fr 1fr", gap:"100px", alignItems:"start" }}>
        <motion.div initial={{ opacity:0, x:-30 }} whileInView={{ opacity:1, x:0 }}
          viewport={{ once:true }} transition={{ duration:0.8, ease:[0.22,1,0.36,1] }}>
          <p style={{ fontFamily:"var(--font-mono)", fontSize:"13px",
            lineHeight:2, color:"rgba(240,240,240,0.5)", marginBottom:"32px" }}>
            {t.about?.p1 || "LoyalFox Records nació en 2025 en España con una visión clara: construir el sello independiente con mayor número de oyentes de música electrónica en Europa."}
          </p>
          <p style={{ fontFamily:"var(--font-mono)", fontSize:"13px",
            lineHeight:2, color:"rgba(240,240,240,0.35)" }}>
            {t.about?.p2 || "No somos solo un sello de distribución. Somos una comunidad de artistas, streamers y creadores que comparten una misma filosofía."}
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px", marginTop:"56px" }}>
            {statsData.map((s,i) => (
              <div key={i} style={{ padding:"28px 24px", background:"#0d0d0d",
                borderLeft:i%2===0?"2px solid #a8e63d":"none" }}>
                <p style={{ fontFamily:"var(--font-display)", fontSize:"44px",
                  lineHeight:1, color:"#a8e63d", marginBottom:"6px" }}>{s.n}</p>
                <p style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                  letterSpacing:"2px", textTransform:"uppercase",
                  color:"rgba(240,240,240,0.3)" }}>{s.l}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <div>
          {values.map((v,i) => (
            <motion.div key={v.n} initial={{ opacity:0, x:30 }} whileInView={{ opacity:1, x:0 }}
              viewport={{ once:true }}
              transition={{ duration:0.6, delay:i*0.1, ease:[0.22,1,0.36,1] }}
              style={{ padding:"32px 0", borderBottom:"1px solid rgba(255,255,255,0.05)",
                display:"grid", gridTemplateColumns:"56px 1fr", gap:"24px" }}>
              <span style={{ fontFamily:"var(--font-display)", fontSize:"32px",
                color:"rgba(168,230,61,0.2)", lineHeight:1 }}>{v.n}</span>
              <div>
                <p style={{ fontFamily:"var(--font-display)", fontSize:"22px",
                  letterSpacing:"1px", color:"var(--white)", marginBottom:"10px" }}>
                  {v.title}
                </p>
                <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
                  lineHeight:1.8, color:"rgba(240,240,240,0.35)" }}>{v.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}