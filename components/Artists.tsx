"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { supabase } from "@/lib/supabase";

type Artist = {
  id: string; name: string; genre: string;
  image_url: string; slug: string; bio: string;
};

export default function Artists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target:ref, offset:["start end","center center"] });
  const titleX = useTransform(scrollYProgress, [0,1], [60, 0]);
  const titleO = useTransform(scrollYProgress, [0,0.4], [0, 1]);

  useEffect(() => {
    supabase.from("artists").select("*")
      .order("created_at", { ascending:false }).limit(8)
      .then(({ data }) => { if (data) setArtists(data); });
  }, []);

  return (
    <section ref={ref} id="artists" style={{ padding:"140px 0",
      background:"var(--black2)", position:"relative", overflow:"hidden" }}>

      {/* Número decorativo */}
      <div style={{ position:"absolute", left:"-20px", top:"50%",
        transform:"translateY(-50%)", zIndex:0,
        fontFamily:"var(--font-display)",
        fontSize:"clamp(150px,22vw,320px)",
        color:"rgba(240,240,240,0.018)", lineHeight:1,
        userSelect:"none", pointerEvents:"none" }}>
        02
      </div>

      {/* Header */}
      <motion.div style={{ padding:"0 56px", marginBottom:"80px",
        display:"flex", justifyContent:"space-between",
        alignItems:"flex-end", flexWrap:"wrap", gap:"24px",
        x: titleX, opacity: titleO }}>
        <div>
          <div style={{ display:"flex", alignItems:"center",
            gap:"16px", marginBottom:"20px" }}>
            <div style={{ width:"40px", height:"2px", background:"#a8e63d" }} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
              letterSpacing:"4px", textTransform:"uppercase", color:"#a8e63d" }}>
              02 — Artistas
            </span>
          </div>
          <h2 style={{ fontFamily:"var(--font-display)",
            fontSize:"clamp(56px,8vw,110px)", lineHeight:0.88,
            letterSpacing:"-1px", color:"var(--white)" }}>
            NUESTROS<br />
            <span style={{ color:"transparent",
              WebkitTextStroke:"2px rgba(240,240,240,0.12)" }}>
              ARTISTAS
            </span>
          </h2>
        </div>
        <a href="/artists"
          style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
            letterSpacing:"3px", textTransform:"uppercase",
            color:"rgba(240,240,240,0.4)", textDecoration:"none",
            transition:"color .2s" }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#a8e63d"}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(240,240,240,0.4)"}>
          Ver todos →
        </a>
      </motion.div>

      {/* Grid */}
      {artists.length === 0 ? (
        <div style={{ padding:"80px 56px", textAlign:"center" }}>
          <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
            color:"rgba(240,240,240,0.2)", letterSpacing:"3px" }}>CARGANDO...</p>
        </div>
      ) : (
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(4,1fr)", gap:"2px" }}>
          {artists.map((artist, i) => (
            <motion.a
              key={artist.id}
              href={`/artists/${artist.slug}`}
              initial={{ opacity:0, y:30 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true, margin:"-50px" }}
              transition={{ duration:0.7, delay:i*0.08, ease:[0.22,1,0.36,1] }}
              onMouseEnter={() => setHovered(artist.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ position:"relative", textDecoration:"none",
                color:"#f0f0f0", display:"block",
                aspectRatio:"1/1", overflow:"hidden",
                background:"#0d0d0d" }}>

              {/* Foto cuadrada */}
              {artist.image_url ? (
                <motion.img
                  src={artist.image_url}
                  alt={artist.name}
                  style={{
                    position:"absolute", inset:0,
                    width:"100%", height:"100%",
                    objectFit:"cover",
                    objectPosition:"center top",
                  }}
                  animate={{ scale: hovered === artist.id ? 1.06 : 1 }}
                  transition={{ duration:0.8, ease:[0.22,1,0.36,1] }} />
              ) : (
                <div style={{ position:"absolute", inset:0,
                  background:`hsl(${i*45}, 8%, 13%)`,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontFamily:"var(--font-display)", fontSize:"80px",
                    color:"rgba(240,240,240,0.04)" }}>{artist.name[0]}</span>
                </div>
              )}

              {/* Overlay */}
              <div style={{ position:"absolute", inset:0,
                background:"linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.3) 50%, transparent 100%)" }} />

              {/* Hover tint */}
              <motion.div
                style={{ position:"absolute", inset:0,
                  background:"rgba(168,230,61,0.05)" }}
                animate={{ opacity: hovered === artist.id ? 1 : 0 }}
                transition={{ duration:0.3 }} />

              {/* Número */}
              <div style={{ position:"absolute", top:"16px", right:"16px", zIndex:3 }}>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                  letterSpacing:"1px", color:"rgba(240,240,240,0.2)" }}>
                  {String(i+1).padStart(2,"0")}
                </span>
              </div>

              {/* Info */}
              <div style={{ position:"absolute", bottom:0, left:0, right:0,
                padding:"28px 20px 20px", zIndex:3 }}>
                <motion.div
                  animate={{ y: hovered === artist.id ? -6 : 0 }}
                  transition={{ duration:0.35 }}>
                  <p style={{ fontFamily:"var(--font-display)", fontSize:"22px",
                    lineHeight:1, marginBottom:"6px", letterSpacing:"0.5px",
                    color: hovered === artist.id ? "#a8e63d" : "#f0f0f0",
                    transition:"color .2s" }}>
                    {artist.name}
                  </p>
                  {artist.genre && (
                    <p style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                      letterSpacing:"2px", textTransform:"uppercase",
                      color:"rgba(240,240,240,0.35)" }}>
                      {artist.genre}
                    </p>
                  )}
                </motion.div>

                <motion.div
                  animate={{ opacity: hovered === artist.id ? 1 : 0,
                    height: hovered === artist.id ? "auto" : 0 }}
                  transition={{ duration:0.25 }}
                  style={{ overflow:"hidden" }}>
                  <div style={{ display:"flex", alignItems:"center",
                    gap:"8px", marginTop:"12px" }}>
                    <div style={{ width:"20px", height:"1px", background:"#a8e63d" }} />
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                      letterSpacing:"2px", textTransform:"uppercase",
                      color:"#a8e63d" }}>
                      Ver perfil
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Left accent bar */}
              <motion.div
                style={{ position:"absolute", left:0, top:0, bottom:0,
                  width:"2px", background:"#a8e63d",
                  transformOrigin:"bottom", zIndex:4 }}
                animate={{ scaleY: hovered === artist.id ? 1 : 0 }}
                transition={{ duration:0.4, ease:[0.22,1,0.36,1] }} />
            </motion.a>
          ))}
        </div>
      )}

      {/* CTA demo */}
      <motion.div
        initial={{ opacity:0, y:20 }}
        whileInView={{ opacity:1, y:0 }}
        viewport={{ once:true }}
        transition={{ duration:0.8 }}
        style={{ margin:"80px 56px 0", padding:"40px 56px",
          background:"#111", border:"1px solid rgba(168,230,61,0.08)",
          display:"flex", alignItems:"center",
          justifyContent:"space-between", flexWrap:"wrap", gap:"32px" }}>
        <p style={{ fontFamily:"var(--font-display)", fontSize:"28px",
          letterSpacing:"1px", color:"var(--white)", maxWidth:"480px",
          lineHeight:1.1 }}>
          ¿ERES ARTISTA?{" "}
          <span style={{ color:"#a8e63d" }}>ENVÍANOS TU DEMO</span>{" "}
          Y ÚNETE AL SELLO.
        </p>
        <a href="#contact"
          style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
            letterSpacing:"3px", textTransform:"uppercase",
            padding:"16px 36px", border:"1px solid rgba(168,230,61,0.4)",
            color:"#a8e63d", transition:"all .3s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#a8e63d"; (e.currentTarget as HTMLElement).style.color = "#080808"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#a8e63d"; }}>
          Enviar demo →
        </a>
      </motion.div>
    </section>
  );
}