"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/lib/LocaleContext";

type Playlist = { id: string; name: string; genre: string; tracks: number; url: string; image_url: string };

export default function PlaylistsPage() {
  const { t } = useLocale();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    supabase.from("playlists").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setPlaylists(data); });
  }, []);

  return (
    <section style={{ minHeight:"100vh", padding:"140px 56px 112px", background:"var(--black)" }}>

      {/* Header */}
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.7, ease:[0.22,1,0.36,1] }} style={{ marginBottom:"80px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"12px" }}>
          <a href="/"
            style={{ fontFamily:"var(--font-mono)", fontSize:"10px", letterSpacing:"2px",
              textTransform:"uppercase", color:"var(--muted)", textDecoration:"none", transition:"color .2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--green)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>
            ← Home
          </a>
          <span style={{ color:"var(--muted2)" }}>/</span>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px", letterSpacing:"2px",
            textTransform:"uppercase", color:"var(--green)" }}>{t.playlists.eyebrow}</span>
        </div>
        <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(60px, 8vw, 110px)",
          lineHeight:0.9, letterSpacing:"1px", marginBottom:"24px" }}>
          {t.playlists.title.split("\n")[0]}<br/>
          <span style={{ color:"var(--green)", textShadow:"0 0 40px rgba(57,255,20,0.35)" }}>
            {t.playlists.title.split("\n")[1]}
          </span>
        </h1>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px", letterSpacing:"2px",
          color:"var(--muted)", textTransform:"uppercase" }}>
          {playlists.length} playlists · Spotify
        </p>
      </motion.div>

      {/* Grid */}
      {playlists.length === 0 ? (
        <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--muted)",
          padding:"40px 0", letterSpacing:"2px" }}>CARGANDO...</p>
      ) : (
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))",
          gap:"24px" }}>
          {playlists.map((pl, i) => (
            <motion.a
              key={pl.id}
              href={pl.url}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity:0, y:20 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:0.4, delay: i * 0.05, ease:[0.22,1,0.36,1] }}
              style={{ textDecoration:"none", color:"var(--white)",
                display:"flex", flexDirection:"column", gap:"12px" }}
              whileHover="hovered">

              {/* Square cover */}
              <div style={{ position:"relative", width:"100%", aspectRatio:"1",
                borderRadius:"10px", overflow:"hidden",
                boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
                {pl.image_url ? (
                  <>
                    <motion.div
                      style={{ position:"absolute", inset:0,
                        backgroundImage:`url(${pl.image_url})`,
                        backgroundSize:"cover", backgroundPosition:"center" }}
                      variants={{ rest:{scale:1}, hovered:{scale:1.06} }}
                      transition={{ duration:0.5, ease:[0.22,1,0.36,1] }} />
                    <motion.div
                      style={{ position:"absolute", inset:0, borderRadius:"10px",
                        background:"rgba(57,255,20,0.1)",
                        display:"flex", alignItems:"center", justifyContent:"center" }}
                      variants={{ rest:{opacity:0}, hovered:{opacity:1} }}
                      transition={{ duration:0.3 }}>
                      <div style={{ width:"52px", height:"52px", borderRadius:"50%",
                        background:"rgba(0,0,0,0.6)", border:"2px solid var(--green)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        backdropFilter:"blur(4px)" }}>
                        <span style={{ color:"var(--green)", fontSize:"20px", marginLeft:"3px" }}>▶</span>
                      </div>
                    </motion.div>
                  </>
                ) : (
                  <div style={{ position:"absolute", inset:0, background:"var(--black3)",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <div style={{ display:"flex", alignItems:"flex-end", gap:"3px", height:"32px" }}>
                      {[8,20,32,14,24].map((h,j) => (
                        <span key={j} style={{ display:"block", width:"4px", borderRadius:"2px",
                          height:`${h}px`, background:"var(--green)", opacity:0.4,
                          animation:`wave 1.2s ease-in-out ${j*0.12}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Genre badge */}
                <div style={{ position:"absolute", bottom:"10px", left:"10px", zIndex:2 }}>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"8px", letterSpacing:"1px",
                    textTransform:"uppercase", padding:"4px 10px",
                    background:"rgba(6,6,6,0.85)", color:"var(--green)",
                    border:"1px solid rgba(57,255,20,0.25)", borderRadius:"4px" }}>
                    {pl.genre}
                  </span>
                </div>

                {/* Green border on hover */}
                <motion.div
                  style={{ position:"absolute", inset:0, borderRadius:"10px",
                    border:"2px solid transparent", pointerEvents:"none" }}
                  variants={{ rest:{borderColor:"transparent"}, hovered:{borderColor:"var(--green)"} }}
                  transition={{ duration:0.3 }} />
              </div>

              {/* Info */}
              <div>
                <motion.p
                  style={{ fontFamily:"var(--font-display)", fontSize:"17px",
                    lineHeight:1.1, marginBottom:"4px" }}
                  variants={{ rest:{color:"var(--white)"}, hovered:{color:"var(--green)"} }}
                  transition={{ duration:0.2 }}>
                  {pl.name}
                </motion.p>
                <p style={{ fontFamily:"var(--font-mono)", fontSize:"10px", color:"var(--muted)" }}>
                  {pl.tracks} tracks
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      )}
    </section>
  );
}