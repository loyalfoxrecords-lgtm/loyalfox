"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useIsMobile } from "@/lib/useIsMobile";

type Post = { id:string; title:string; excerpt:string; image_url:string; created_at:string; slug:string; category:string; };

export default function Blog() {
  const [posts, setPosts]     = useState<Post[]>([]);
  const [hovered, setHovered] = useState<string|null>(null);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target:ref, offset:["start end","center center"] });
  const titleY = useTransform(scrollYProgress, [0,1], [60,0]);
  const titleO = useTransform(scrollYProgress, [0,0.4], [0,1]);

  useEffect(() => {
    setMounted(true);
    supabase.from("posts").select("*").order("created_at",{ascending:false}).limit(3)
      .then(({data}) => { if(data) setPosts(data); });
  }, []);

  if (!mounted) return <section ref={ref} />;
  if (posts.length===0) return <section ref={ref} />;

  const fmtDate = (d:string) => {
    try { return new Date(d).toLocaleDateString("es",{day:"numeric",month:"long",year:"numeric"}); }
    catch { return d; }
  };
  const [featured,...rest] = posts;

  /* ── MÓVIL ── */
  if (isMobile) return (
    <section id="blog" style={{ padding:"80px 0 60px",
      background:"var(--black2)", position:"relative" }}>
      <div style={{ padding:"0 20px 32px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px" }}>
          <div style={{ width:"28px", height:"2px", background:"#a8e63d" }} />
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
            letterSpacing:"3px", textTransform:"uppercase", color:"#a8e63d" }}>
            Noticias
          </span>
        </div>
        <h2 style={{ fontFamily:"var(--font-display)",
          fontSize:"clamp(40px,12vw,64px)", lineHeight:0.9,
          letterSpacing:"-0.5px", color:"var(--white)" }}>
          ÚLTIMAS<br />
          <span style={{ color:"transparent",
            WebkitTextStroke:"1.5px rgba(240,240,240,0.12)" }}>NOTICIAS</span>
        </h2>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"2px", padding:"0 20px" }}>
        {posts.map((post,i) => (
          <a key={post.id} href={`/blog/${post.slug}`}
            style={{ position:"relative", display:"block", overflow:"hidden",
              background:"#111", textDecoration:"none",
              minHeight: i===0?"220px":"140px" }}>
            {post.image_url && (
              <div style={{ position:"absolute", inset:0,
                backgroundImage:`url(${post.image_url})`,
                backgroundSize:"cover", backgroundPosition:"center" }} />
            )}
            <div style={{ position:"absolute", inset:0,
              background:"linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.4) 60%, transparent 100%)" }} />
            {post.category && i===0 && (
              <div style={{ position:"absolute", top:"16px", left:"16px", zIndex:3 }}>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:"8px",
                  letterSpacing:"1px", textTransform:"uppercase",
                  padding:"4px 10px", background:"#a8e63d",
                  color:"#080808", fontWeight:700 }}>{post.category}</span>
              </div>
            )}
            <div style={{ position:"absolute", bottom:0, left:0, right:0,
              padding:"16px" }}>
              <p style={{ fontFamily:"var(--font-mono)", fontSize:"8px",
                letterSpacing:"2px", textTransform:"uppercase",
                color:"rgba(240,240,240,0.3)", marginBottom:"6px" }}>
                {fmtDate(post.created_at)}
              </p>
              <p style={{ fontFamily:"var(--font-display)",
                fontSize: i===0?"22px":"16px",
                lineHeight:1.1, color:"#f0f0f0" }}>{post.title}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );

  /* ── DESKTOP ── (original) */
  return (
    <section ref={ref} id="blog" style={{ padding:"140px 0",
      background:"var(--black2)", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", right:"-20px", top:"10%",
        fontFamily:"var(--font-display)", fontSize:"clamp(150px,22vw,320px)",
        color:"rgba(240,240,240,0.018)", lineHeight:1,
        userSelect:"none", pointerEvents:"none" }}>06</div>
      <motion.div style={{ padding:"0 56px", marginBottom:"80px",
        display:"flex", justifyContent:"space-between",
        alignItems:"flex-end", flexWrap:"wrap", gap:"24px",
        y:titleY, opacity:titleO }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"20px" }}>
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
              WebkitTextStroke:"2px rgba(240,240,240,0.12)" }}>NOTICIAS</span>
          </h2>
        </div>
      </motion.div>
      <div style={{ padding:"0 56px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:"2px", marginBottom:"2px" }}>
          <motion.a href={`/blog/${featured.slug}`}
            initial={{ opacity:0, x:-30 }} whileInView={{ opacity:1, x:0 }}
            viewport={{ once:true }} transition={{ duration:0.8, ease:[0.22,1,0.36,1] }}
            onMouseEnter={() => setHovered(featured.id)} onMouseLeave={() => setHovered(null)}
            style={{ position:"relative", display:"block", aspectRatio:"4/3",
              overflow:"hidden", background:"#111", textDecoration:"none" }}>
            {featured.image_url && (
              <motion.div style={{ position:"absolute", inset:0,
                backgroundImage:`url(${featured.image_url})`,
                backgroundSize:"cover", backgroundPosition:"center" }}
                animate={{ scale:hovered===featured.id?1.05:1 }}
                transition={{ duration:0.8, ease:[0.22,1,0.36,1] }} />
            )}
            <div style={{ position:"absolute", inset:0,
              background:"linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.3) 50%, transparent 100%)" }} />
            <motion.div style={{ position:"absolute", inset:0, background:"rgba(168,230,61,0.05)" }}
              animate={{ opacity:hovered===featured.id?1:0 }} transition={{ duration:0.3 }} />
            {featured.category && (
              <div style={{ position:"absolute", top:"20px", left:"20px", zIndex:3 }}>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                  letterSpacing:"2px", textTransform:"uppercase",
                  padding:"5px 12px", background:"#a8e63d",
                  color:"#080808", fontWeight:700 }}>{featured.category}</span>
              </div>
            )}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"32px 28px", zIndex:3 }}>
              <p style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                letterSpacing:"2px", textTransform:"uppercase",
                color:"rgba(240,240,240,0.3)", marginBottom:"12px" }}>
                {fmtDate(featured.created_at)}
              </p>
              <motion.h3 style={{ fontFamily:"var(--font-display)",
                fontSize:"clamp(28px,3vw,44px)", lineHeight:1,
                letterSpacing:"0.5px", marginBottom:"12px" }}
                animate={{ color:hovered===featured.id?"#a8e63d":"#f0f0f0" }}
                transition={{ duration:0.2 }}>{featured.title}</motion.h3>
            </div>
            <motion.div style={{ position:"absolute", bottom:0, left:0, right:0,
              height:"2px", background:"#a8e63d", transformOrigin:"left", zIndex:4 }}
              animate={{ scaleX:hovered===featured.id?1:0 }} transition={{ duration:0.4 }} />
          </motion.a>
          <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
            {rest.slice(0,2).map((post,i) => (
              <motion.a key={post.id} href={`/blog/${post.slug}`}
                initial={{ opacity:0, x:30 }} whileInView={{ opacity:1, x:0 }}
                viewport={{ once:true }}
                transition={{ duration:0.7, delay:i*0.1, ease:[0.22,1,0.36,1] }}
                onMouseEnter={() => setHovered(post.id)} onMouseLeave={() => setHovered(null)}
                style={{ position:"relative", display:"block", flex:1,
                  overflow:"hidden", background:"#111", textDecoration:"none", minHeight:"200px" }}>
                {post.image_url && (
                  <motion.div style={{ position:"absolute", inset:0,
                    backgroundImage:`url(${post.image_url})`,
                    backgroundSize:"cover", backgroundPosition:"center" }}
                    animate={{ scale:hovered===post.id?1.06:1 }}
                    transition={{ duration:0.7, ease:[0.22,1,0.36,1] }} />
                )}
                <div style={{ position:"absolute", inset:0,
                  background:"linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.4) 60%, transparent 100%)" }} />
                <motion.div style={{ position:"absolute", inset:0, background:"rgba(168,230,61,0.05)" }}
                  animate={{ opacity:hovered===post.id?1:0 }} transition={{ duration:0.3 }} />
                <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"20px", zIndex:3 }}>
                  <p style={{ fontFamily:"var(--font-mono)", fontSize:"8px",
                    letterSpacing:"2px", textTransform:"uppercase",
                    color:"rgba(240,240,240,0.25)", marginBottom:"8px" }}>
                    {fmtDate(post.created_at)}
                  </p>
                  <motion.h3 style={{ fontFamily:"var(--font-display)",
                    fontSize:"20px", lineHeight:1.1, letterSpacing:"0.5px" }}
                    animate={{ color:hovered===post.id?"#a8e63d":"#f0f0f0" }}
                    transition={{ duration:0.2 }}>{post.title}</motion.h3>
                </div>
                <motion.div style={{ position:"absolute", bottom:0, left:0, right:0,
                  height:"2px", background:"#a8e63d", transformOrigin:"left", zIndex:4 }}
                  animate={{ scaleX:hovered===post.id?1:0 }} transition={{ duration:0.4 }} />
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}