"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import Navbar from "./Navbar";
import Footer from "./Footer";

type Streamer = {
  id: string; name: string; slug: string; bio: string;
  image_url: string; platform: string; channel_url: string;
  spotify_playlist_url: string; followers: string;
};

const PLATFORM_COLORS: Record<string,string> = {
  Twitch:  "#9147ff",
  YouTube: "#ff0000",
  Kick:    "#53fc18",
  TikTok:  "#ff0050",
  Otro:    "#a8e63d",
};

export default function StreamerDetail({ slug }: { slug: string }) {
  const [streamer, setStreamer] = useState<Streamer | null>(null);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    supabase.from("streamers").select("*").eq("slug", slug).single()
      .then(({ data }) => { if (data) setStreamer(data); setLoading(false); });
  }, [slug]);

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#080808",
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:"40px", height:"40px", borderRadius:"50%",
        border:"2px solid #1a1a1a", borderTopColor:"#a8e63d",
        animation:"spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );

  if (!streamer) return (
    <div style={{ minHeight:"100vh", background:"#080808",
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ fontFamily:"var(--font-mono)", color:"rgba(240,240,240,0.3)",
        letterSpacing:"3px", fontSize:"11px" }}>
        STREAMER NO ENCONTRADO
      </p>
    </div>
  );

  const platformColor = PLATFORM_COLORS[streamer.platform] || "#a8e63d";

  return (
    <div style={{ background:"#080808", minHeight:"100vh" }}>
      <Navbar />

      {/* Hero */}
      <section style={{ position:"relative", height:"70vh",
        overflow:"hidden", marginTop:"0" }}>

        {/* Foto de fondo */}
        {streamer.image_url ? (
          <motion.div
            initial={{ scale:1.1 }}
            animate={{ scale:1 }}
            transition={{ duration:1.2, ease:[0.22,1,0.36,1] }}
            style={{ position:"absolute", inset:0,
              backgroundImage:`url(${streamer.image_url})`,
              backgroundSize:"cover", backgroundPosition:"center top" }} />
        ) : (
          <div style={{ position:"absolute", inset:0,
            background:`linear-gradient(135deg, #0d0d0d, #111)` }} />
        )}

        {/* Overlays */}
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to right, rgba(8,8,8,0.95) 35%, rgba(8,8,8,0.5) 65%, rgba(8,8,8,0.2) 100%)" }} />
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to top, rgba(8,8,8,1) 0%, transparent 50%)" }} />

        {/* Accent line plataforma */}
        <div style={{ position:"absolute", left:"56px", top:"20%", bottom:"20%",
          width:"2px", background:`linear-gradient(to bottom, transparent, ${platformColor}, transparent)` }} />

        {/* Contenido */}
        <div style={{ position:"absolute", inset:0, display:"flex",
          flexDirection:"column", justifyContent:"flex-end",
          padding:"0 80px 64px" }}>

          {/* Platform badge */}
          <motion.div
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5, delay:0.2 }}
            style={{ display:"flex", alignItems:"center",
              gap:"12px", marginBottom:"20px" }}>
            <div style={{ width:"32px", height:"1px", background:platformColor }} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
              letterSpacing:"4px", textTransform:"uppercase",
              color: platformColor }}>
              {streamer.platform}
              {streamer.followers && ` · ${streamer.followers} seguidores`}
            </span>
          </motion.div>

          {/* Nombre */}
          <div style={{ overflow:"hidden", marginBottom:"24px" }}>
            <motion.h1
              initial={{ y:"100%" }}
              animate={{ y:0 }}
              transition={{ duration:0.9, ease:[0.22,1,0.36,1] }}
              style={{ fontFamily:"var(--font-display)",
                fontSize:"clamp(56px,9vw,120px)", lineHeight:0.88,
                letterSpacing:"-1px", color:"#f0f0f0" }}>
              {streamer.name}
            </motion.h1>
          </div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity:0, y:16 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.6, delay:0.5 }}
            style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
            {streamer.channel_url && (
              <a href={streamer.channel_url} target="_blank" rel="noreferrer"
                style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                  letterSpacing:"3px", textTransform:"uppercase",
                  padding:"14px 32px", background: platformColor,
                  color:"#080808", fontWeight:700, transition:"all .3s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                Ver canal ↗
              </a>
            )}
            {streamer.spotify_playlist_url && (
              <a href={streamer.spotify_playlist_url} target="_blank" rel="noreferrer"
                style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                  letterSpacing:"3px", textTransform:"uppercase",
                  padding:"14px 32px", background:"transparent",
                  border:"1px solid rgba(240,240,240,0.2)",
                  color:"rgba(240,240,240,0.7)", transition:"all .3s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#1DB954"; (e.currentTarget as HTMLElement).style.color = "#1DB954"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,240,240,0.2)"; (e.currentTarget as HTMLElement).style.color = "rgba(240,240,240,0.7)"; }}>
                🎵 Su playlist
              </a>
            )}
          </motion.div>
        </div>
      </section>

      {/* Bio + Playlist */}
      <section style={{ padding:"100px 80px",
        display:"grid", gridTemplateColumns:"1fr 1fr",
        gap:"80px", alignItems:"start" }}>

        {/* Bio */}
        <motion.div
          initial={{ opacity:0, x:-30 }}
          whileInView={{ opacity:1, x:0 }}
          viewport={{ once:true }}
          transition={{ duration:0.8 }}>
          <div style={{ display:"flex", alignItems:"center",
            gap:"16px", marginBottom:"32px" }}>
            <div style={{ width:"40px", height:"2px", background:"#a8e63d" }} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
              letterSpacing:"4px", textTransform:"uppercase", color:"#a8e63d" }}>
              Sobre {streamer.name}
            </span>
          </div>

          {streamer.bio ? (
            <p style={{ fontFamily:"var(--font-mono)", fontSize:"14px",
              lineHeight:2, color:"rgba(240,240,240,0.5)", marginBottom:"48px" }}>
              {streamer.bio}
            </p>
          ) : (
            <p style={{ fontFamily:"var(--font-mono)", fontSize:"14px",
              lineHeight:2, color:"rgba(240,240,240,0.2)", marginBottom:"48px" }}>
              Streamer colaborador de LoyalFox Records.
            </p>
          )}

          {/* Info cards */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px" }}>
            {[
              { label:"Plataforma", value: streamer.platform || "—" },
              { label:"Seguidores", value: streamer.followers || "—" },
              { label:"Sello",     value: "LoyalFox Records"        },
              { label:"Desde",     value: "2025"                    },
            ].map((item,i) => (
              <div key={i} style={{ padding:"20px 20px", background:"#0d0d0d",
                borderLeft: i%2===0 ? "2px solid #a8e63d" : "none" }}>
                <p style={{ fontFamily:"var(--font-mono)", fontSize:"8px",
                  letterSpacing:"2px", textTransform:"uppercase",
                  color:"rgba(240,240,240,0.3)", marginBottom:"6px" }}>
                  {item.label}
                </p>
                <p style={{ fontFamily:"var(--font-display)", fontSize:"18px",
                  lineHeight:1, color:"#a8e63d" }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Spotify playlist embed */}
        <motion.div
          initial={{ opacity:0, x:30 }}
          whileInView={{ opacity:1, x:0 }}
          viewport={{ once:true }}
          transition={{ duration:0.8, delay:0.1 }}>
          <div style={{ display:"flex", alignItems:"center",
            gap:"16px", marginBottom:"32px" }}>
            <div style={{ width:"40px", height:"2px", background:"#1DB954" }} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
              letterSpacing:"4px", textTransform:"uppercase", color:"#1DB954" }}>
              Su playlist de LoyalFox
            </span>
          </div>

          {streamer.spotify_playlist_url ? (
            <div>
              {/* Spotify embed */}
              {(() => {
                const url = streamer.spotify_playlist_url;
                const match = url.match(/playlist\/([a-zA-Z0-9]+)/);
                const playlistId = match?.[1];
                if (!playlistId) return (
                  <a href={url} target="_blank" rel="noreferrer"
                    style={{ display:"block", padding:"24px",
                      background:"rgba(29,185,84,0.08)",
                      border:"1px solid rgba(29,185,84,0.2)",
                      fontFamily:"var(--font-mono)", fontSize:"12px",
                      color:"#1DB954", textDecoration:"none" }}>
                    Abrir playlist en Spotify ↗
                  </a>
                );
                return (
                  <iframe
                    src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
                    width="100%" height="460"
                    style={{ border:"none", borderRadius:"0" }}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy" />
                );
              })()}

              <a href={streamer.spotify_playlist_url} target="_blank" rel="noreferrer"
                style={{ display:"inline-flex", alignItems:"center", gap:"8px",
                  marginTop:"16px", fontFamily:"var(--font-mono)", fontSize:"10px",
                  letterSpacing:"2px", textTransform:"uppercase",
                  padding:"12px 24px", background:"#1DB954",
                  color:"#000", fontWeight:700, transition:"all .2s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#1ed760"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#1DB954"; (e.currentTarget as HTMLElement).style.transform = "none"; }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                Abrir en Spotify
              </a>
            </div>
          ) : (
            <div style={{ padding:"48px", textAlign:"center",
              background:"#0d0d0d", border:"1px dashed #1a1a1a" }}>
              <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
                color:"rgba(240,240,240,0.2)", letterSpacing:"2px" }}>
                Playlist próximamente
              </p>
            </div>
          )}
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}