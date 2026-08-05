"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { supabase } from "@/lib/supabase";
import Navbar from "./Navbar";
import Footer from "./Footer";

type Artist = {
  id: string; name: string; slug: string; genre: string;
  bio: string; image_url: string;
  url_spotify: string; url_apple: string; url_instagram: string;
  url_tiktok: string; url_twitter: string; url_soundcloud: string;
};
type Track = {
  id: string; name: string; artist: string; genre: string;
  bpm: number; duration: string; image_url: string; slug: string;
  url_spotify: string; url_apple: string; url_beatport: string;
};
type Press = {
  id: string; title: string; url: string;
  source: string; image_url: string; published_at: string;
};

const SpotifyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const SoundCloudIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.56 8.87V17h8.76c1.45-.02 2.68-1.23 2.68-2.68 0-1.45-1.23-2.68-2.68-2.68-.1 0-.2.01-.3.02C19.7 9.38 18.14 8 16.24 8c-.68 0-1.32.19-1.88.52-.48-2.59-2.77-4.52-5.52-4.52C5.96 4 3.5 6.46 3.5 9.44c0 .24.02.48.05.72C1.55 10.67 0 12.37 0 14.44 0 16.67 1.85 18.5 4.12 18.5H11.56V8.87z"/>
  </svg>
);

const SOCIAL_LINKS = [
  { key:"url_spotify",   label:"Spotify",    color:"#1DB954", bg:"rgba(29,185,84,0.1)",  Icon:SpotifyIcon   },
  { key:"url_apple",     label:"Apple Music",color:"#fc3c44", bg:"rgba(252,60,68,0.1)",  Icon:AppleIcon     },
  { key:"url_instagram", label:"Instagram",  color:"#e1306c", bg:"rgba(225,48,108,0.1)", Icon:InstagramIcon },
  { key:"url_tiktok",    label:"TikTok",     color:"#f0f0f0", bg:"rgba(240,240,240,0.08)",Icon:TikTokIcon   },
  { key:"url_twitter",   label:"Twitter / X",color:"#f0f0f0", bg:"rgba(240,240,240,0.08)",Icon:TwitterIcon  },
  { key:"url_soundcloud",label:"SoundCloud", color:"#ff5500", bg:"rgba(255,85,0,0.1)",   Icon:SoundCloudIcon},
];

export default function ArtistDetail({ slug }: { slug: string }) {
  const [artist, setArtist]   = useState<Artist|null>(null);
  const [tracks, setTracks]   = useState<Track[]>([]);
  const [press, setPress]     = useState<Press[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<string|null>(null);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target:ref, offset:["start start","end start"] });
  const imgY    = useTransform(scrollYProgress, [0,1], ["0%","20%"]);
  const opacity = useTransform(scrollYProgress, [0,0.6], [1,0]);

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      const [
        { data: artistData },
        { data: tracksData },
        { data: pressData },
      ] = await Promise.all([
        supabase.from("artists").select("*").eq("slug", slug).single(),
        supabase.from("tracks").select("*").eq("artist_slug", slug)
          .order("created_at", { ascending:false }),
        supabase.from("artist_press").select("*").eq("artist_slug", slug)
          .order("published_at", { ascending:false }),
      ]);
      if (artistData) setArtist(artistData);
      if (tracksData) setTracks(tracksData);
      if (pressData)  setPress(pressData);
      setLoading(false);
    };
    load();
  }, [slug]);

  if (!mounted) return <div ref={ref as any} />;

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#080808",
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:"40px", height:"40px", borderRadius:"50%",
        border:"2px solid #1a1a1a", borderTopColor:"#a8e63d",
        animation:"spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );

  if (!artist) return (
    <div style={{ minHeight:"100vh", background:"#080808",
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ fontFamily:"var(--font-mono)", color:"rgba(240,240,240,0.3)",
        letterSpacing:"3px", fontSize:"11px" }}>
        ARTISTA NO ENCONTRADO
      </p>
    </div>
  );

  const socialLinks = SOCIAL_LINKS.filter(s => (artist as any)[s.key]);

  return (
    <div style={{ background:"#080808", minHeight:"100vh" }}>
      <Navbar />

      {/* ─── HERO ─── */}
      <section ref={ref} style={{ position:"relative", height:"100vh", overflow:"hidden" }}>

        {artist.image_url ? (
          <motion.div style={{
            position:"absolute", inset:"-10%",
            backgroundImage:`url(${artist.image_url})`,
            backgroundSize:"contain",
            backgroundPosition:"center top",
            backgroundRepeat:"no-repeat",
            y: imgY,
          }} />
        ) : (
          <div style={{ position:"absolute", inset:0,
            background:"linear-gradient(135deg, #0d0d0d, #111)" }} />
        )}

        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to right, rgba(8,8,8,0.95) 35%, rgba(8,8,8,0.6) 60%, rgba(8,8,8,0.2) 100%)" }} />
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to top, rgba(8,8,8,1) 0%, transparent 50%)" }} />

        <motion.div
          initial={{ scaleY:0 }}
          animate={{ scaleY:1 }}
          transition={{ duration:1.2, delay:0.3, ease:[0.22,1,0.36,1] }}
          style={{ position:"absolute", left:"56px", top:"15%", bottom:"15%",
            width:"2px",
            background:"linear-gradient(to bottom, transparent, #a8e63d, transparent)",
            transformOrigin:"top", zIndex:5 }} />

        <motion.div style={{ position:"absolute", inset:0, zIndex:10,
          display:"flex", flexDirection:"column", justifyContent:"flex-end",
          padding:"0 80px 80px", opacity }}>

          <motion.div
            initial={{ opacity:0, x:-20 }}
            animate={{ opacity:1, x:0 }}
            transition={{ duration:0.6, delay:0.2 }}
            style={{ display:"flex", alignItems:"center",
              gap:"12px", marginBottom:"24px" }}>
            <a href="/artists"
              style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                letterSpacing:"3px", textTransform:"uppercase",
                color:"rgba(240,240,240,0.4)", textDecoration:"none",
                transition:"color .2s" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#a8e63d"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(240,240,240,0.4)"}>
              ← Artistas
            </a>
            {artist.genre && (
              <>
                <span style={{ color:"rgba(240,240,240,0.2)" }}>/</span>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                  letterSpacing:"3px", textTransform:"uppercase", color:"#a8e63d" }}>
                  {artist.genre}
                </span>
              </>
            )}
          </motion.div>

          <div style={{ overflow:"hidden", marginBottom:"24px" }}>
            <motion.h1
              initial={{ y:"100%" }}
              animate={{ y:0 }}
              transition={{ duration:0.9, delay:0.3, ease:[0.22,1,0.36,1] }}
              style={{ fontFamily:"var(--font-display)",
                fontSize:"clamp(64px,10vw,140px)", lineHeight:0.88,
                letterSpacing:"-1px", color:"#f0f0f0" }}>
              {artist.name}
            </motion.h1>
          </div>

          {artist.bio && (
            <motion.p
              initial={{ opacity:0, y:16 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:0.7, delay:0.6 }}
              style={{ fontFamily:"var(--font-mono)", fontSize:"13px",
                lineHeight:1.9, maxWidth:"480px", marginBottom:"32px",
                color:"rgba(240,240,240,0.5)" }}>
              {artist.bio}
            </motion.p>
          )}

          {socialLinks.length > 0 && (
            <motion.div
              initial={{ opacity:0, y:16 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:0.7, delay:0.8 }}
              style={{ display:"flex", gap:"10px", flexWrap:"wrap" }}>
              {socialLinks.map(({ key, label, color, bg, Icon }) => (
                <a key={key}
                  href={(artist as any)[key]}
                  target="_blank" rel="noreferrer"
                  style={{ display:"inline-flex", alignItems:"center", gap:"8px",
                    padding:"10px 20px", background:bg,
                    border:`1px solid ${color}44`, color,
                    fontFamily:"var(--font-mono)", fontSize:"10px",
                    letterSpacing:"2px", textTransform:"uppercase",
                    textDecoration:"none", transition:"all .2s" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = color;
                    (e.currentTarget as HTMLElement).style.color = "#080808";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = bg;
                    (e.currentTarget as HTMLElement).style.color = color;
                  }}>
                  <Icon />
                  {label}
                </a>
              ))}
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ delay:1.2 }}
          style={{ position:"absolute", bottom:"32px", right:"48px",
            zIndex:10, display:"flex", flexDirection:"column",
            alignItems:"center", gap:"8px" }}>
          <motion.div
            animate={{ y:[0,8,0] }}
            transition={{ duration:1.5, repeat:Infinity }}
            style={{ width:"1px", height:"40px",
              background:"linear-gradient(to bottom, rgba(168,230,61,0.5), transparent)" }} />
        </motion.div>
      </section>

      {/* ─── DISCOGRAFÍA ─── */}
      <section style={{ padding:"120px 56px",
        borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display:"flex", alignItems:"center",
          gap:"16px", marginBottom:"60px" }}>
          <div style={{ width:"40px", height:"2px", background:"#a8e63d" }} />
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
            letterSpacing:"4px", textTransform:"uppercase", color:"#a8e63d" }}>
            Discografía — {tracks.length} release{tracks.length!==1?"s":""}
          </span>
        </div>

        {tracks.length === 0 ? (
          <div style={{ padding:"60px", textAlign:"center",
            border:"1px dashed rgba(255,255,255,0.08)" }}>
            <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
              color:"rgba(240,240,240,0.2)", letterSpacing:"3px" }}>
              Sin releases publicados aún
            </p>
          </div>
        ) : (
          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fill, minmax(220px,1fr))",
            gap:"2px" }}>
            {tracks.map((track,i) => (
              <motion.div
                key={track.id}
                initial={{ opacity:0, y:20 }}
                whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }}
                transition={{ duration:0.5, delay:i*0.05 }}
                onMouseEnter={() => setHovered(track.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ position:"relative", aspectRatio:"1",
                  overflow:"hidden", background:"#111" }}>

                {track.image_url ? (
                  <motion.div
                    style={{ position:"absolute", inset:0,
                      backgroundImage:`url(${track.image_url})`,
                      backgroundSize:"cover", backgroundPosition:"center" }}
                    animate={{ scale: hovered===track.id ? 1.06 : 1 }}
                    transition={{ duration:0.7, ease:[0.22,1,0.36,1] }} />
                ) : (
                  <div style={{ position:"absolute", inset:0,
                    background:`hsl(${i*37},10%,12%)`,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontSize:"48px",
                      color:"rgba(240,240,240,0.04)" }}>♪</span>
                  </div>
                )}

                <div style={{ position:"absolute", inset:0,
                  background:"linear-gradient(to top, rgba(8,8,8,0.97) 0%, rgba(8,8,8,0.1) 60%, transparent 100%)" }} />
                <motion.div
                  style={{ position:"absolute", inset:0,
                    background:"rgba(168,230,61,0.05)" }}
                  animate={{ opacity: hovered===track.id ? 1 : 0 }}
                  transition={{ duration:0.3 }} />

                <div style={{ position:"absolute", bottom:0, left:0, right:0,
                  padding:"16px", zIndex:3 }}>
                  <motion.p
                    style={{ fontFamily:"var(--font-display)", fontSize:"17px",
                      lineHeight:1, marginBottom:"4px", letterSpacing:"0.5px",
                      transition:"color .2s" }}
                    animate={{ color: hovered===track.id?"#a8e63d":"#f0f0f0" }}>
                    {track.name}
                  </motion.p>
                  {track.genre && (
                    <p style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                      letterSpacing:"1px", textTransform:"uppercase",
                      color:"rgba(240,240,240,0.4)" }}>{track.genre}</p>
                  )}
                  {track.bpm>0 && (
                    <p style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                      color:"rgba(240,240,240,0.25)", marginTop:"2px" }}>
                      {track.bpm} BPM{track.duration?` · ${track.duration}`:""}
                    </p>
                  )}

                  <motion.div
                    style={{ display:"flex", gap:"6px", marginTop:"10px", flexWrap:"wrap" }}
                    animate={{ opacity: hovered===track.id ? 1 : 0,
                      y: hovered===track.id ? 0 : 6 }}
                    transition={{ duration:0.2 }}>
                    {track.url_spotify && (
                      <a href={track.url_spotify} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ display:"inline-flex", alignItems:"center", gap:"4px",
                          fontFamily:"var(--font-mono)", fontSize:"8px",
                          letterSpacing:"1px", textTransform:"uppercase",
                          padding:"3px 8px", background:"rgba(29,185,84,0.15)",
                          color:"#1DB954", border:"1px solid rgba(29,185,84,0.3)",
                          textDecoration:"none" }}>
                        <SpotifyIcon /> Spotify
                      </a>
                    )}
                    {track.url_apple && (
                      <a href={track.url_apple} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ display:"inline-flex", alignItems:"center", gap:"4px",
                          fontFamily:"var(--font-mono)", fontSize:"8px",
                          letterSpacing:"1px", textTransform:"uppercase",
                          padding:"3px 8px", background:"rgba(252,60,68,0.1)",
                          color:"#fc3c44", border:"1px solid rgba(252,60,68,0.3)",
                          textDecoration:"none" }}>
                        <AppleIcon /> Apple
                      </a>
                    )}
                    {track.url_beatport && (
                      <a href={track.url_beatport} target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ display:"inline-flex", alignItems:"center", gap:"4px",
                          fontFamily:"var(--font-mono)", fontSize:"8px",
                          letterSpacing:"1px", textTransform:"uppercase",
                          padding:"3px 8px", background:"rgba(37,99,235,0.1)",
                          color:"#2563eb", border:"1px solid rgba(37,99,235,0.3)",
                          textDecoration:"none" }}>
                        Beatport
                      </a>
                    )}
                  </motion.div>
                </div>

                <motion.div
                  style={{ position:"absolute", bottom:0, left:0, right:0,
                    height:"2px", background:"#a8e63d",
                    transformOrigin:"left", zIndex:4 }}
                  animate={{ scaleX: hovered===track.id ? 1 : 0 }}
                  transition={{ duration:0.4, ease:[0.22,1,0.36,1] }} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* ─── PRENSA ─── */}
      {press.length > 0 && (
        <section style={{ padding:"80px 56px 120px",
          borderTop:"1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display:"flex", alignItems:"center",
            gap:"16px", marginBottom:"60px" }}>
            <div style={{ width:"40px", height:"2px", background:"#a8e63d" }} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
              letterSpacing:"4px", textTransform:"uppercase", color:"#a8e63d" }}>
              Prensa — {press.length} artículo{press.length!==1?"s":""}
            </span>
          </div>

          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fill, minmax(300px,1fr))",
            gap:"2px" }}>
            {press.map((article,i) => (
              <motion.a
                key={article.id}
                href={article.url}
                target="_blank" rel="noreferrer"
                initial={{ opacity:0, y:16 }}
                whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true }}
                transition={{ duration:0.5, delay:i*0.06 }}
                onMouseEnter={() => {
                  setHovered(`press-${article.id}`);
                }}
                onMouseLeave={() => {
                  setHovered(null);
                }}
                style={{ display:"flex", flexDirection:"column",
                  textDecoration:"none", color:"#f0f0f0",
                  background:"#0d0d0d",
                  border:`1px solid ${hovered===`press-${article.id}`?"rgba(168,230,61,0.2)":"rgba(255,255,255,0.05)"}`,
                  overflow:"hidden", transition:"border-color .2s" }}>

                {article.image_url && (
                  <div style={{ position:"relative", aspectRatio:"16/9",
                    overflow:"hidden", flexShrink:0 }}>
                    <motion.div
                      style={{ position:"absolute", inset:0,
                        backgroundImage:`url(${article.image_url})`,
                        backgroundSize:"cover", backgroundPosition:"center" }}
                      animate={{ scale: hovered===`press-${article.id}` ? 1.05 : 1 }}
                      transition={{ duration:0.6 }} />
                  </div>
                )}

                <div style={{ padding:"20px 20px 16px", flex:1,
                  display:"flex", flexDirection:"column", gap:"8px" }}>
                  {(article.source || article.published_at) && (
                    <div style={{ display:"flex", gap:"12px", alignItems:"center" }}>
                      {article.source && (
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                          letterSpacing:"2px", textTransform:"uppercase",
                          color:"#a8e63d" }}>
                          {article.source}
                        </span>
                      )}
                      {article.published_at && (
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                          color:"rgba(240,240,240,0.3)" }}>
                          {new Date(article.published_at).toLocaleDateString("es",{
                            day:"numeric", month:"long", year:"numeric"
                          })}
                        </span>
                      )}
                    </div>
                  )}
                  <motion.h3
                    style={{ fontFamily:"var(--font-display)", fontSize:"18px",
                      lineHeight:1.2, letterSpacing:"0.5px", flex:1,
                      transition:"color .2s" }}
                    animate={{ color: hovered===`press-${article.id}`?"#a8e63d":"#f0f0f0" }}>
                    {article.title}
                  </motion.h3>
                  <motion.div
                    style={{ display:"flex", alignItems:"center", gap:"8px", marginTop:"4px" }}
                    animate={{ opacity: hovered===`press-${article.id}` ? 1 : 0.4 }}
                    transition={{ duration:0.2 }}>
                    <div style={{ width:"16px", height:"1px", background:"#a8e63d" }} />
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                      letterSpacing:"2px", textTransform:"uppercase", color:"#a8e63d" }}>
                      Leer artículo ↗
                    </span>
                  </motion.div>
                </div>
              </motion.a>
            ))}
          </div>
        </section>
      )}

      <Footer />
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
    </div>
  );
}