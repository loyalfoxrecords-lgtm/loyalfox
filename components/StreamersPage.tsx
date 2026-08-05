"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/lib/LocaleContext";

type Streamer = { id: string; name: string; platform: string; url: string; image_url: string; playlist_url: string; followers: number; bio: string; slug: string };

const platformColor: Record<string, string> = {
  Twitch: "#9147ff", YouTube: "#ff0000",
  Kick: "#53fc18", TikTok: "#ff0050", Otro: "#555",
};

const platformIcon: Record<string, string> = {
  Twitch: "T", YouTube: "YT", Kick: "K", TikTok: "TK", Otro: "•",
};

const fmt = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

export default function StreamersPage() {
  const { t } = useLocale();
  const [streamers, setStreamers] = useState<Streamer[]>([]);

  useEffect(() => {
    supabase.from("streamers").select("*").order("followers", { ascending: false })
      .then(({ data }) => { if (data) setStreamers(data); });
  }, []);

  return (
    <section style={{ minHeight:"100vh", padding:"140px 56px 112px", background:"var(--black)" }}>

      {/* Header */}
      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.7, ease:[0.22,1,0.36,1] }}
        style={{ marginBottom:"80px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"16px" }}>
          <a href="/"
            style={{ fontFamily:"var(--font-mono)", fontSize:"10px", letterSpacing:"2px",
              textTransform:"uppercase", color:"var(--muted)", textDecoration:"none", transition:"color .2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--green)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>
            ← Home
          </a>
          <span style={{ color:"var(--muted2)" }}>/</span>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px", letterSpacing:"2px",
            textTransform:"uppercase", color:"var(--green)" }}>Streamers</span>
        </div>

        <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(60px, 8vw, 110px)",
          lineHeight:0.9, letterSpacing:"1px", marginBottom:"24px" }}>
          STREAMERS<br/>
          <span style={{ color:"var(--white)", WebkitTextStroke:"1px rgba(57,255,20,0.4)" }}>
            COLABORADORES
          </span>
        </h1>

        <div style={{ display:"flex", alignItems:"center", gap:"24px" }}>
          <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px", letterSpacing:"2px",
            color:"var(--muted)", textTransform:"uppercase" }}>
            {streamers.length} streamers · LoyalFox Records
          </p>
          <span style={{ width:"1px", height:"16px", background:"var(--muted2)" }} />
          <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px", letterSpacing:"2px",
            color:"var(--muted)", textTransform:"uppercase" }}>
            Música del sello en directo
          </p>
        </div>
      </motion.div>

      {/* Grid */}
      {streamers.length === 0 ? (
        <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px", color:"var(--muted)",
          padding:"40px 0", letterSpacing:"2px" }}>CARGANDO...</p>
      ) : (
        <div style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))",
          gap:"2px" }}>
          {streamers.map((s, i) => (
            <motion.a
              key={s.id}
              href={s.slug ? `/streamers/${s.slug}` : s.url}
              target={s.slug ? undefined : "_blank"}
              rel="noreferrer"
              initial={{ opacity:0, y:20 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:0.5, delay: i * 0.07, ease:[0.22,1,0.36,1] }}
              style={{ position:"relative", textDecoration:"none", color:"var(--white)",
                display:"block", overflow:"hidden", background:"var(--black3)",
                minHeight:"360px" }}
              whileHover="hovered">

              {/* Background image — full card */}
              {s.image_url ? (
                <>
                  <motion.div
                    style={{ position:"absolute", inset:0,
                      backgroundImage:`url(${s.image_url})`,
                      backgroundSize:"cover", backgroundPosition:"center top" }}
                    variants={{ rest:{scale:1}, hovered:{scale:1.04} }}
                    transition={{ duration:0.6, ease:[0.22,1,0.36,1] }} />
                  <div style={{ position:"absolute", inset:0,
                    background:"linear-gradient(to bottom, rgba(6,6,6,0.1) 0%, rgba(6,6,6,0.4) 50%, rgba(6,6,6,0.95) 100%)" }} />
                </>
              ) : (
                <div style={{ position:"absolute", inset:0, background:"var(--black3)" }}>
                  <div style={{ position:"absolute", inset:0, display:"flex",
                    alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontFamily:"var(--font-display)", fontSize:"120px",
                      color:"rgba(57,255,20,0.04)", lineHeight:1 }}>
                      {s.name.slice(0,1)}
                    </span>
                  </div>
                </div>
              )}

              {/* Green overlay on hover */}
              <motion.div
                style={{ position:"absolute", inset:0,
                  background:"linear-gradient(135deg, rgba(57,255,20,0.06) 0%, transparent 60%)" }}
                variants={{ rest:{opacity:0}, hovered:{opacity:1} }}
                transition={{ duration:0.4 }} />

              {/* Top: platform badge */}
              <div style={{ position:"absolute", top:"16px", left:"16px", right:"16px",
                display:"flex", justifyContent:"space-between", alignItems:"center", zIndex:5 }}>
                <span style={{
                  fontFamily:"var(--font-mono)", fontSize:"9px", letterSpacing:"2px",
                  textTransform:"uppercase", padding:"5px 12px",
                  background:"rgba(6,6,6,0.75)", backdropFilter:"blur(8px)",
                  color: platformColor[s.platform] || "var(--green)",
                  border:`1px solid ${platformColor[s.platform] || "#39ff14"}55`,
                }}>
                  {s.platform}
                </span>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
                  color:"rgba(232,232,232,0.7)", background:"rgba(6,6,6,0.75)",
                  backdropFilter:"blur(8px)", padding:"5px 10px" }}>
                  {fmt(s.followers)}
                </span>
              </div>

              {/* Bottom content */}
              <div style={{ position:"absolute", bottom:0, left:0, right:0,
                padding:"28px 24px", zIndex:5 }}>

                {/* Name */}
                <motion.h2
                  style={{ fontFamily:"var(--font-display)", fontSize:"36px",
                    lineHeight:0.95, marginBottom:"8px", letterSpacing:"1px" }}
                  variants={{ rest:{textShadow:"none"}, hovered:{textShadow:"0 0 30px rgba(57,255,20,0.3)"} }}>
                  {s.name}
                </motion.h2>

                {/* Bio preview */}
                {s.bio && (
                  <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
                    color:"rgba(232,232,232,0.55)", lineHeight:1.6,
                    marginBottom:"16px", letterSpacing:"0.5px",
                    overflow:"hidden", display:"-webkit-box",
                    WebkitLineClamp:2, WebkitBoxOrient:"vertical" as never }}>
                    {s.bio}
                  </p>
                )}

                {/* Action buttons */}
                <motion.div
                  style={{ display:"flex", gap:"8px" }}
                  variants={{ rest:{opacity:0, y:8}, hovered:{opacity:1, y:0} }}
                  transition={{ duration:0.3 }}>
                  <a href={s.url} target="_blank" rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ flex:1, padding:"10px 0", fontFamily:"var(--font-mono)",
                      fontSize:"9px", letterSpacing:"2px", textTransform:"uppercase",
                      textAlign:"center", textDecoration:"none",
                      background:"rgba(6,6,6,0.8)", backdropFilter:"blur(8px)",
                      border:`1px solid ${platformColor[s.platform] || "#39ff14"}66`,
                      color: platformColor[s.platform] || "var(--green)" }}>
                    {s.platform} ↗
                  </a>
                  {s.playlist_url && (
                    <a href={s.playlist_url} target="_blank" rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ flex:1, padding:"10px 0", fontFamily:"var(--font-mono)",
                        fontSize:"9px", letterSpacing:"2px", textTransform:"uppercase",
                        textAlign:"center", textDecoration:"none",
                        background:"#1DB954", color:"#000", fontWeight:700 }}>
                      ♪ Playlist
                    </a>
                  )}
                </motion.div>
              </div>

              {/* Top accent line */}
              <motion.span
                style={{ position:"absolute", top:0, left:0, right:0, height:"2px",
                  background: platformColor[s.platform] || "var(--green)",
                  transformOrigin:"left", scaleX:0, zIndex:6 }}
                variants={{ rest:{scaleX:0}, hovered:{scaleX:1} }}
                transition={{ duration:0.4 }} />

              {/* "Ver perfil" hint */}
              <motion.div
                style={{ position:"absolute", top:"50%", left:"50%",
                  transform:"translate(-50%, -50%)", zIndex:5,
                  display:"flex", flexDirection:"column", alignItems:"center", gap:"8px" }}
                variants={{ rest:{opacity:0}, hovered:{opacity:1} }}
                transition={{ duration:0.3 }}>
                <div style={{ width:"48px", height:"48px", borderRadius:"50%",
                  border:"1px solid rgba(57,255,20,0.5)",
                  background:"rgba(6,6,6,0.6)", backdropFilter:"blur(8px)",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ color:"var(--green)", fontSize:"18px" }}>→</span>
                </div>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                  letterSpacing:"2px", textTransform:"uppercase",
                  color:"var(--green)", background:"rgba(6,6,6,0.7)",
                  padding:"3px 10px" }}>
                  Ver perfil
                </span>
              </motion.div>
            </motion.a>
          ))}
        </div>
      )}
    </section>
  );
}