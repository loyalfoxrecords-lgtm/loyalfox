"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Track = {
  id: string; name: string; artist: string; artist_slug: string;
  genre: string; bpm: number; duration: string; image_url: string;
  slug: string; description: string; url_spotify: string;
  url_apple: string; url_beatport: string;
};
type Artist = { id: string; name: string; slug: string; image_url: string; bio: string };

export default function TrackDetail({ slug }: { slug: string }) {
  const [track,   setTrack]   = useState<Track | null>(null);
  const [artist,  setArtist]  = useState<Artist | null>(null);
  const [related, setRelated] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: tr } = await supabase.from("tracks").select("*").eq("slug", slug).single();
      if (tr) {
        setTrack(tr);
        if (tr.artist_slug) {
          const { data: ar } = await supabase.from("artists").select("*").eq("slug", tr.artist_slug).single();
          if (ar) setArtist(ar);
          const { data: rel } = await supabase.from("tracks").select("*")
            .eq("artist_slug", tr.artist_slug).neq("slug", slug).limit(4);
          if (rel) setRelated(rel);
        }
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", background:"var(--black)" }}>
      <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
        color:"var(--muted)", letterSpacing:"4px" }}>CARGANDO...</p>
    </div>
  );

  if (!track) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center",
      justifyContent:"center", background:"var(--black)" }}>
      <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
        color:"var(--muted)", letterSpacing:"4px" }}>TRACK NO ENCONTRADO</p>
    </div>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "MusicRecording",
        "name": track.name,
        "byArtist": { "@type": "MusicGroup", "name": track.artist },
        "duration": track.duration,
        "genre": track.genre,
        "recordLabel": { "@type": "Organization", "name": "LoyalFox Records" },
        "image": track.image_url || "",
        "url": `https://loyalfoxrecords.com/catalog/${track.slug}`,
        "description": track.description || "",
      })}} />

      <section style={{ minHeight:"100vh", background:"var(--black)" }}>

        {/* Hero */}
        <div style={{ position:"relative", background:"var(--black2)",
          borderBottom:"1px solid rgba(57,255,20,0.08)" }}>
          <div style={{ position:"absolute", inset:0, pointerEvents:"none",
            backgroundImage:"linear-gradient(rgba(57,255,20,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.02) 1px, transparent 1px)",
            backgroundSize:"60px 60px" }} />

          <div style={{ position:"relative", zIndex:2, padding:"140px 56px 80px",
            display:"flex", gap:"60px", alignItems:"flex-end", flexWrap:"wrap" }}>

            {/* Cover */}
            <motion.div
              initial={{ opacity:0, scale:0.9 }}
              animate={{ opacity:1, scale:1 }}
              transition={{ duration:0.7, ease:[0.22,1,0.36,1] }}
              style={{ width:"260px", height:"260px", flexShrink:0,
                boxShadow:"0 0 60px rgba(57,255,20,0.15)" }}>
              {track.image_url ? (
                <img src={track.image_url} alt={track.name}
                  style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              ) : (
                <div style={{ width:"100%", height:"100%", background:"var(--black3)",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontFamily:"var(--font-display)", fontSize:"80px",
                    color:"rgba(57,255,20,0.06)" }}>♪</span>
                </div>
              )}
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity:0, y:24 }}
              animate={{ opacity:1, y:0 }}
              transition={{ duration:0.7, delay:0.15, ease:[0.22,1,0.36,1] }}
              style={{ flex:1, minWidth:"280px" }}>

              {/* Breadcrumb */}
              <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"20px" }}>
                <a href="/#catalog"
                  style={{ fontFamily:"var(--font-mono)", fontSize:"10px", letterSpacing:"2px",
                    textTransform:"uppercase", color:"var(--muted)", textDecoration:"none",
                    transition:"color .2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--green)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>
                  ← Catálogo
                </a>
                <span style={{ color:"var(--muted2)" }}>/</span>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px", letterSpacing:"2px",
                  textTransform:"uppercase", color:"var(--green)" }}>{track.genre}</span>
              </div>

              {/* Title */}
              <h1 style={{ fontFamily:"var(--font-display)", fontSize:"clamp(48px, 7vw, 96px)",
                lineHeight:0.9, letterSpacing:"1px", marginBottom:"16px" }}>
                {track.name}
              </h1>

              {/* Artist */}
              {artist ? (
                <Link href={`/artists/${artist.slug}`}
                  style={{ display:"inline-flex", alignItems:"center", gap:"12px",
                    textDecoration:"none", marginBottom:"32px" }}>
                  {artist.image_url && (
                    <img src={artist.image_url} alt={artist.name}
                      style={{ width:"32px", height:"32px", borderRadius:"50%", objectFit:"cover" }} />
                  )}
                  <span style={{ fontFamily:"var(--font-display)", fontSize:"24px",
                    color:"var(--muted)", transition:"color .2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--green)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}>
                    {track.artist}
                  </span>
                </Link>
              ) : (
                <p style={{ fontFamily:"var(--font-display)", fontSize:"24px",
                  color:"var(--muted)", marginBottom:"32px" }}>{track.artist}</p>
              )}

              {/* Metadata pills */}
              <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"32px" }}>
                {[
                  { label:"Género",   value: track.genre    },
                  { label:"BPM",      value: String(track.bpm) },
                  { label:"Duración", value: track.duration },
                  { label:"Sello",    value: "LoyalFox Records" },
                ].map((item) => (
                  <div key={item.label} style={{ padding:"10px 18px", background:"var(--black3)",
                    border:"1px solid rgba(57,255,20,0.1)" }}>
                    <p style={{ fontFamily:"var(--font-mono)", fontSize:"8px", letterSpacing:"2px",
                      textTransform:"uppercase", color:"var(--green)", marginBottom:"4px" }}>
                      {item.label}
                    </p>
                    <p style={{ fontFamily:"var(--font-mono)", fontSize:"13px",
                      color:"var(--white)" }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Descripción */}
              {track.description && (
                <p style={{ fontSize:"15px", color:"var(--muted)", lineHeight:1.8,
                  maxWidth:"560px", marginBottom:"32px",
                  borderLeft:"2px solid rgba(57,255,20,0.2)", paddingLeft:"20px" }}>
                  {track.description}
                </p>
              )}

              {/* Store links */}
              {(track.url_spotify || track.url_apple || track.url_beatport) && (
                <div style={{ display:"flex", gap:"8px", flexWrap:"wrap", marginBottom:"32px" }}>
                  {track.url_spotify && (
                    <a href={track.url_spotify} target="_blank" rel="noreferrer"
                      style={{ display:"inline-flex", alignItems:"center", gap:"8px",
                        padding:"12px 20px", background:"#1DB954", color:"#000",
                        textDecoration:"none", fontFamily:"var(--font-mono)", fontSize:"10px",
                        letterSpacing:"2px", textTransform:"uppercase", fontWeight:700,
                        transition:"opacity .2s" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                      </svg>
                      Spotify
                    </a>
                  )}
                  {track.url_apple && (
                    <a href={track.url_apple} target="_blank" rel="noreferrer"
                      style={{ display:"inline-flex", alignItems:"center", gap:"8px",
                        padding:"12px 20px", background:"#fc3c44", color:"#fff",
                        textDecoration:"none", fontFamily:"var(--font-mono)", fontSize:"10px",
                        letterSpacing:"2px", textTransform:"uppercase", fontWeight:700,
                        transition:"opacity .2s" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      Apple Music
                    </a>
                  )}
                  {track.url_beatport && (
                    <a href={track.url_beatport} target="_blank" rel="noreferrer"
                      style={{ display:"inline-flex", alignItems:"center", gap:"8px",
                        padding:"12px 20px", background:"#01ff95", color:"#000",
                        textDecoration:"none", fontFamily:"var(--font-mono)", fontSize:"10px",
                        letterSpacing:"2px", textTransform:"uppercase", fontWeight:700,
                        transition:"opacity .2s" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}>
                      Beatport ↗
                    </a>
                  )}
                </div>
              )}

              <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px", letterSpacing:"2px",
                textTransform:"uppercase", color:"var(--muted)" }}>
                LoyalFox Records © 2025
              </span>
            </motion.div>
          </div>
        </div>

        {/* Tracks relacionados */}
        {related.length > 0 && (
          <div style={{ padding:"80px 56px" }}>
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:"32px", letterSpacing:"1px",
              marginBottom:"32px" }}>
              Más de <span style={{ color:"var(--green)" }}>{track.artist}</span>
            </h2>
            <div style={{ display:"grid",
              gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:"2px" }}>
              {related.map((tr, i) => (
                <motion.a
                  key={tr.id}
                  href={`/catalog/${tr.slug}`}
                  initial={{ opacity:0, y:16 }}
                  animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.4, delay:i*0.06 }}
                  whileHover="hovered"
                  style={{ position:"relative", background:"var(--black3)",
                    overflow:"hidden", textDecoration:"none", cursor:"pointer" }}>

                  <div style={{ position:"relative", aspectRatio:"1", overflow:"hidden" }}>
                    {tr.image_url ? (
                      <motion.div
                        style={{ position:"absolute", inset:0,
                          backgroundImage:`url(${tr.image_url})`,
                          backgroundSize:"cover", backgroundPosition:"center" }}
                        variants={{ rest:{scale:1}, hovered:{scale:1.06} }}
                        transition={{ duration:0.5 }} />
                    ) : (
                      <div style={{ position:"absolute", inset:0, background:"var(--black4)",
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ fontFamily:"var(--font-display)", fontSize:"40px",
                          color:"rgba(57,255,20,0.06)" }}>♪</span>
                      </div>
                    )}
                  </div>

                  <div style={{ padding:"14px" }}>
                    <motion.p
                      style={{ fontFamily:"var(--font-display)", fontSize:"15px",
                        lineHeight:1.1, marginBottom:"4px" }}
                      variants={{ rest:{color:"var(--white)"}, hovered:{color:"var(--green)"} }}
                      transition={{ duration:0.2 }}>
                      {tr.name}
                    </motion.p>
                    <p style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                      color:"var(--muted)" }}>
                      {tr.duration}
                    </p>
                  </div>

                  <motion.span
                    style={{ position:"absolute", bottom:0, left:0, right:0, height:"2px",
                      background:"var(--green)", transformOrigin:"left", scaleX:0 }}
                    variants={{ rest:{scaleX:0}, hovered:{scaleX:1} }}
                    transition={{ duration:0.35 }} />
                </motion.a>
              ))}
            </div>
          </div>
        )}
      </section>
    </>
  );
}