"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

type Artist = {
  id: string; name: string; genre: string;
  bio: string; slug: string; image_url: string;
};

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [hovered, setHovered] = useState<string|null>(null);
  const [search, setSearch]   = useState("");

  useEffect(() => {
    supabase.from("artists").select("*")
      .order("created_at", { ascending:false })
      .then(({ data }) => { if (data) setArtists(data); });
  }, []);

  const filtered = artists.filter(a =>
    !search ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.genre?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <section style={{ minHeight:"100vh", padding:"140px 56px 112px",
      background:"var(--black)" }}>

      {/* Header */}
      <motion.div
        initial={{ opacity:0, y:24 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.7, ease:[0.22,1,0.36,1] }}
        style={{ marginBottom:"80px" }}>

        <div style={{ display:"flex", alignItems:"center",
          gap:"12px", marginBottom:"24px" }}>
          <a href="/"
            style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
              letterSpacing:"2px", textTransform:"uppercase",
              color:"rgba(240,240,240,0.35)", textDecoration:"none",
              transition:"color .2s" }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#a8e63d"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(240,240,240,0.35)"}>
            ← Home
          </a>
          <span style={{ color:"rgba(240,240,240,0.2)" }}>/</span>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
            letterSpacing:"2px", textTransform:"uppercase", color:"#a8e63d" }}>
            Artistas
          </span>
        </div>

        <div style={{ display:"flex", alignItems:"flex-end",
          justifyContent:"space-between", flexWrap:"wrap", gap:"24px" }}>
          <div>
            <div style={{ display:"flex", alignItems:"center",
              gap:"16px", marginBottom:"20px" }}>
              <div style={{ width:"40px", height:"2px", background:"#a8e63d" }} />
              <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                letterSpacing:"4px", textTransform:"uppercase", color:"#a8e63d" }}>
                {filtered.length} artistas
              </span>
            </div>
            <h1 style={{ fontFamily:"var(--font-display)",
              fontSize:"clamp(56px,8vw,110px)", lineHeight:0.88,
              letterSpacing:"-1px", color:"var(--white)" }}>
              NUESTROS<br />
              <span style={{ color:"transparent",
                WebkitTextStroke:"2px rgba(240,240,240,0.12)" }}>
                ARTISTAS
              </span>
            </h1>
          </div>

          <input
            placeholder="Buscar artista..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding:"12px 16px",
              background:"rgba(255,255,255,0.05)",
              border:"1px solid rgba(255,255,255,0.1)",
              color:"#f0f0f0", fontSize:"13px",
              fontFamily:"var(--font-mono)", outline:"none",
              letterSpacing:"0.5px", width:"240px",
              transition:"border-color .2s" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#a8e63d")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")} />
        </div>
      </motion.div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
          color:"rgba(240,240,240,0.2)", padding:"80px 0",
          textAlign:"center", letterSpacing:"3px" }}>
          {artists.length === 0 ? "CARGANDO..." : "Sin resultados"}
        </p>
      ) : (
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(4,1fr)", gap:"2px" }}>
          {filtered.map((artist, i) => (
            <motion.a
              key={artist.id}
              href={`/artists/${artist.slug}`}
              initial={{ opacity:0, y:24 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:0.5, delay:Math.min(i*0.06,0.4),
                ease:[0.22,1,0.36,1] }}
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
                    color:"rgba(240,240,240,0.04)" }}>
                    {artist.name[0]}
                  </span>
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
                  {artist.bio && (
                    <motion.p
                      style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                        lineHeight:1.7, color:"rgba(240,240,240,0.35)",
                        marginTop:"8px", overflow:"hidden",
                        textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                      animate={{ opacity: hovered === artist.id ? 1 : 0 }}
                      transition={{ duration:0.25 }}>
                      {artist.bio}
                    </motion.p>
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
    </section>
  );
}