"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { supabase } from "@/lib/supabase";

type Post = {
  id: string; title: string; excerpt: string;
  image_url: string; created_at: string; slug: string; category: string;
};

export default function Blog() {
  const [posts, setPosts]     = useState<Post[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target:ref, offset:["start end","center center"] });
  const titleY = useTransform(scrollYProgress, [0,1], [60, 0]);
  const titleO = useTransform(scrollYProgress, [0,0.4], [0, 1]);

  useEffect(() => {
    setMounted(true);
    supabase.from("posts").select("*")
      .order("created_at", { ascending:false }).limit(3)
      .then(({ data }) => { if (data) setPosts(data); });
  }, []);

  if (!mounted) return <section ref={ref} />;
  if (posts.length === 0) return <section ref={ref} />;

  const fmtDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("es", { day:"numeric", month:"long", year:"numeric" }); }
    catch { return d; }
  };

  const [featured, ...rest] = posts;

  return (
    <section ref={ref} id="blog" style={{ padding:"140px 0",
      background:"var(--black2)", position:"relative", overflow:"hidden" }}>

      {/* Número decorativo */}
      <div style={{ position:"absolute", right:"-20px", top:"10%",
        fontFamily:"var(--font-display)",
        fontSize:"clamp(150px,22vw,320px)",
        color:"rgba(240,240,240,0.018)", lineHeight:1,
        userSelect:"none", pointerEvents:"none" }}>
        06
      </div>

      {/* Header */}
      <motion.div style={{ padding:"0 56px", marginBottom:"80px",
        display:"flex", justifyContent:"space-between",
        alignItems:"flex-end", flexWrap:"wrap", gap:"24px",
        y: titleY, opacity: titleO }}>
        <div>
          <div style={{ display:"flex", alignItems:"center",
            gap:"16px", marginBottom:"20px" }}>
            <div style={{ width:"40px", height:"2px", background:"#a8e63d" }} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
              letterSpacing:"4px", textTransform:"uppercase", color:"#a8e63d" }}>
              06 — Noticias
            </span>
          </div>
          <h2 style={{ fontFamily:"var(--font-display)",
            fontSize:"clamp(56px,8vw,110px)", lineHeight:0.88,
            letterSpacing:"-1px", color:"var(--white)" }}>
            ÚLTIMAS<br />
            <span style={{ color:"transparent",
              WebkitTextStroke:"2px rgba(240,240,240,0.12)" }}>
              NOTICIAS
            </span>
          </h2>
        </div>
      </motion.div>

      {/* Layout — featured grande + dos pequeños */}
      <div style={{ padding:"0 56px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr",
          gap:"2px", marginBottom:"2px" }}>

          {/* Featured */}
          <motion.a
            href={`/blog/${featured.slug}`}
            initial={{ opacity:0, x:-30 }}
            whileInView={{ opacity:1, x:0 }}
            viewport={{ once:true }}
            transition={{ duration:0.8, ease:[0.22,1,0.36,1] }}
            onMouseEnter={() => setHovered(featured.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ position:"relative", display:"block",
              aspectRatio:"4/3", overflow:"hidden",
              background:"#111", textDecoration:"none" }}>

            {featured.image_url ? (
              <motion.div
                style={{ position:"absolute", inset:0,
                  backgroundImage:`url(${featured.image_url})`,
                  backgroundSize:"cover", backgroundPosition:"center" }}
                animate={{ scale: hovered === featured.id ? 1.05 : 1 }}
                transition={{ duration:0.8, ease:[0.22,1,0.36,1] }} />
            ) : (
              <div style={{ position:"absolute", inset:0, background:"#151515" }} />
            )}

            <div style={{ position:"absolute", inset:0,
              background:"linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.3) 50%, transparent 100%)" }} />
            <motion.div
              style={{ position:"absolute", inset:0, background:"rgba(168,230,61,0.05)" }}
              animate={{ opacity: hovered === featured.id ? 1 : 0 }}
              transition={{ duration:0.3 }} />

            {featured.category && (
              <div style={{ position:"absolute", top:"20px", left:"20px", zIndex:3 }}>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                  letterSpacing:"2px", textTransform:"uppercase",
                  padding:"5px 12px", background:"#a8e63d",
                  color:"#080808", fontWeight:700 }}>
                  {featured.category}
                </span>
              </div>
            )}

            <div style={{ position:"absolute", bottom:0, left:0, right:0,
              padding:"32px 28px", zIndex:3 }}>
              <p style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                letterSpacing:"2px", textTransform:"uppercase",
                color:"rgba(240,240,240,0.3)", marginBottom:"12px" }}>
                {fmtDate(featured.created_at)}
              </p>
              <motion.h3
                style={{ fontFamily:"var(--font-display)",
                  fontSize:"clamp(28px,3vw,44px)",
                  lineHeight:1, letterSpacing:"0.5px", marginBottom:"12px" }}
                animate={{ color: hovered === featured.id ? "#a8e63d" : "#f0f0f0" }}
                transition={{ duration:0.2 }}>
                {featured.title}
              </motion.h3>
              {featured.excerpt && (
                <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
                  lineHeight:1.8, color:"rgba(240,240,240,0.4)",
                  overflow:"hidden", textOverflow:"ellipsis",
                  display:"-webkit-box", WebkitLineClamp:2,
                  WebkitBoxOrient:"vertical" as any }}>
                  {featured.excerpt}
                </p>
              )}
              <motion.div
                style={{ display:"flex", alignItems:"center",
                  gap:"8px", marginTop:"16px" }}
                animate={{ opacity: hovered === featured.id ? 1 : 0,
                  x: hovered === featured.id ? 0 : -8 }}
                transition={{ duration:0.25 }}>
                <div style={{ width:"24px", height:"1px", background:"#a8e63d" }} />
                <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                  letterSpacing:"2px", textTransform:"uppercase", color:"#a8e63d" }}>
                  Leer más
                </span>
              </motion.div>
            </div>

            <motion.div
              style={{ position:"absolute", bottom:0, left:0, right:0,
                height:"2px", background:"#a8e63d",
                transformOrigin:"left", zIndex:4 }}
              animate={{ scaleX: hovered === featured.id ? 1 : 0 }}
              transition={{ duration:0.4 }} />
          </motion.a>

          {/* Columna derecha */}
          <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
            {rest.slice(0,2).map((post, i) => (
              <motion.a
                key={post.id}
                href={`/blog/${post.slug}`}
                initial={{ opacity:0, x:30 }}
                whileInView={{ opacity:1, x:0 }}
                viewport={{ once:true }}
                transition={{ duration:0.7, delay:i*0.1, ease:[0.22,1,0.36,1] }}
                onMouseEnter={() => setHovered(post.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ position:"relative", display:"block",
                  flex:1, overflow:"hidden",
                  background:"#111", textDecoration:"none",
                  minHeight:"200px" }}>

                {post.image_url ? (
                  <motion.div
                    style={{ position:"absolute", inset:0,
                      backgroundImage:`url(${post.image_url})`,
                      backgroundSize:"cover", backgroundPosition:"center" }}
                    animate={{ scale: hovered === post.id ? 1.06 : 1 }}
                    transition={{ duration:0.7, ease:[0.22,1,0.36,1] }} />
                ) : (
                  <div style={{ position:"absolute", inset:0,
                    background:`hsl(${i*60+120}, 8%, 12%)` }} />
                )}

                <div style={{ position:"absolute", inset:0,
                  background:"linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.4) 60%, transparent 100%)" }} />
                <motion.div
                  style={{ position:"absolute", inset:0, background:"rgba(168,230,61,0.05)" }}
                  animate={{ opacity: hovered === post.id ? 1 : 0 }}
                  transition={{ duration:0.3 }} />

                {post.category && (
                  <div style={{ position:"absolute", top:"14px", left:"14px", zIndex:3 }}>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:"8px",
                      letterSpacing:"1px", textTransform:"uppercase",
                      padding:"3px 8px", background:"rgba(8,8,8,0.8)",
                      backdropFilter:"blur(4px)", color:"#a8e63d",
                      border:"1px solid rgba(168,230,61,0.2)" }}>
                      {post.category}
                    </span>
                  </div>
                )}

                <div style={{ position:"absolute", bottom:0, left:0, right:0,
                  padding:"20px 20px 16px", zIndex:3 }}>
                  <p style={{ fontFamily:"var(--font-mono)", fontSize:"8px",
                    letterSpacing:"2px", textTransform:"uppercase",
                    color:"rgba(240,240,240,0.25)", marginBottom:"8px" }}>
                    {fmtDate(post.created_at)}
                  </p>
                  <motion.h3
                    style={{ fontFamily:"var(--font-display)", fontSize:"20px",
                      lineHeight:1.1, letterSpacing:"0.5px" }}
                    animate={{ color: hovered === post.id ? "#a8e63d" : "#f0f0f0" }}
                    transition={{ duration:0.2 }}>
                    {post.title}
                  </motion.h3>
                </div>

                <motion.div
                  style={{ position:"absolute", bottom:0, left:0, right:0,
                    height:"2px", background:"#a8e63d",
                    transformOrigin:"left", zIndex:4 }}
                  animate={{ scaleX: hovered === post.id ? 1 : 0 }}
                  transition={{ duration:0.4 }} />
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}