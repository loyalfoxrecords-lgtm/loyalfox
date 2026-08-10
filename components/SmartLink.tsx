"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

const LOGO = "https://i.ibb.co/KjqCYGmY/descarga-1.png";

type Track = {
  id: string; name: string; artist: string; slug: string;
  image_url: string; genre: string; bpm: number;
  url_spotify: string; url_apple: string; url_beatport: string;
};

const PLATFORMS = [
  { key:"url_spotify",  label:"Spotify",     color:"#1DB954", bg:"#0f2016", icon:(
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  )},
  { key:"url_apple",    label:"Apple Music", color:"#fc3c44", bg:"#1a0608", icon:(
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208a4.98 4.98 0 00-.32 1.235c-.063.447-.084.9-.106 1.35-.007.145-.01.293-.013.44v13.534c.012.292.027.585.063.876.2 1.63 1.02 2.88 2.406 3.664.703.395 1.47.575 2.27.6.14.007.285.01.426.01h12.444c.305-.006.612-.021.913-.074 1.455-.26 2.567-1.007 3.24-2.314.378-.728.496-1.518.535-2.322.013-.29.013-.582.013-.873V7.24c-.013-.372-.028-.748-.073-1.116zm-6.947 6.15l-5.232 3.024c-.017.01-.033.018-.048.024a.517.517 0 01-.23.054.52.52 0 01-.52-.52V9.144c0-.286.233-.52.52-.52.08 0 .157.018.23.054l.048.024 5.232 3.023a.52.52 0 010 .903z"/>
    </svg>
  )},
  { key:"url_beatport", label:"Beatport",    color:"#02e765", bg:"#001208", icon:(
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.25 16.518v-4.268l-3.5 4.268H5.75V7.482h1.5v4.268l3.5-4.268h1.5v9.036h-1.5zm7.5 0h-1.5v-7.536h-2v-1.5h5.5v1.5h-2v7.536z"/>
    </svg>
  )},
];

export default function SmartLink({ track }: { track: Track }) {
  const [clicked, setClicked] = useState<string|null>(null);
  const [views, setViews]     = useState(0);

  useEffect(() => {
    // Registrar visita
    fetch("/api/track-link/view", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ slug: track.slug, platform: null }),
    });
    // Obtener total de visitas
    fetch(`/api/track-link/stats?slug=${track.slug}`)
      .then(r => r.json())
      .then(d => setViews(d.views || 0));
  }, [track.slug]);

  const handleClick = (platform: string, url: string) => {
    setClicked(platform);
    fetch("/api/track-link/view", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ slug: track.slug, platform }),
    });
    setTimeout(() => window.open(url, "_blank"), 150);
  };

  const availablePlatforms = PLATFORMS.filter(p => track[p.key as keyof Track]);

  return (
    <div style={{ minHeight:"100vh", background:"#080808",
      display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", padding:"40px 20px", fontFamily:"system-ui" }}>

      {/* Logo sello */}
      <a href="/" style={{ display:"flex", alignItems:"center", gap:"8px",
        textDecoration:"none", marginBottom:"40px" }}>
        <img src={LOGO} alt="LoyalFox" style={{ width:"24px", height:"24px",
          filter:"brightness(0) saturate(100%) invert(79%) sepia(40%) saturate(500%) hue-rotate(42deg) brightness(95%)" }} />
        <span style={{ fontSize:"13px", letterSpacing:"3px", color:"rgba(255,255,255,0.4)",
          textTransform:"uppercase" }}>LoyalFox Records</span>
      </a>

      {/* Card principal */}
      <div style={{ width:"100%", maxWidth:"420px",
        background:"#111", borderRadius:"20px",
        overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.6)" }}>

        {/* Portada */}
        <div style={{ position:"relative", aspectRatio:"1", background:"#1a1a1a" }}>
          {track.image_url ? (
            <img src={track.image_url} alt={track.name}
              style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
          ) : (
            <div style={{ width:"100%", height:"100%", display:"flex",
              alignItems:"center", justifyContent:"center",
              fontSize:"80px", color:"rgba(255,255,255,0.05)" }}>♪</div>
          )}
          {/* Overlay degradado */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"60%",
            background:"linear-gradient(to top, #111 0%, transparent 100%)" }} />
          {/* Info sobre la imagen */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"24px" }}>
            <p style={{ fontSize:"22px", fontWeight:700, color:"#fff",
              lineHeight:1.1, marginBottom:"6px" }}>{track.name}</p>
            <p style={{ fontSize:"14px", color:"rgba(255,255,255,0.6)" }}>{track.artist}</p>
            {track.genre && (
              <span style={{ display:"inline-block", marginTop:"8px",
                padding:"3px 10px", borderRadius:"9999px",
                fontSize:"10px", letterSpacing:"1px", textTransform:"uppercase",
                background:"rgba(168,230,61,0.15)", color:"#a8e63d",
                border:"1px solid rgba(168,230,61,0.3)" }}>
                {track.genre}
              </span>
            )}
          </div>
        </div>

        {/* Plataformas */}
        <div style={{ padding:"24px", display:"flex", flexDirection:"column", gap:"10px" }}>
          {availablePlatforms.length === 0 ? (
            <p style={{ textAlign:"center", color:"rgba(255,255,255,0.3)",
              fontSize:"13px", padding:"20px" }}>
              Sin links disponibles aún
            </p>
          ) : availablePlatforms.map(p => {
            const url = track[p.key as keyof Track] as string;
            const isClicked = clicked === p.key;
            return (
              <button key={p.key}
                onClick={() => handleClick(p.key, url)}
                style={{ display:"flex", alignItems:"center", gap:"14px",
                  padding:"14px 18px", borderRadius:"12px", border:"none",
                  cursor:"pointer", width:"100%", textAlign:"left",
                  background: isClicked ? p.bg : "rgba(255,255,255,0.05)",
                  transition:"all .2s", transform: isClicked?"scale(0.98)":"scale(1)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = p.bg; }}
                onMouseLeave={e => { if(!isClicked)(e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}>
                <span style={{ color: p.color, flexShrink:0 }}>{p.icon}</span>
                <span style={{ fontSize:"15px", fontWeight:600,
                  color:"#fff", flex:1 }}>
                  {isClicked ? `Abriendo ${p.label}...` : `Escuchar en ${p.label}`}
                </span>
                <span style={{ color:"rgba(255,255,255,0.3)", fontSize:"16px" }}>→</span>
              </button>
            );
          })}
        </div>

        {/* Footer de la card */}
        <div style={{ padding:"0 24px 24px", display:"flex",
          justifyContent:"space-between", alignItems:"center" }}>
          <p style={{ fontSize:"11px", color:"rgba(255,255,255,0.2)",
            letterSpacing:"0.5px" }}>
            {views > 0 ? `${views.toLocaleString()} visitas` : ""}
          </p>
          <a href={`https://www.loyalfoxrecords.com/catalog/${track.slug}`}
            style={{ fontSize:"11px", color:"rgba(168,230,61,0.6)",
              textDecoration:"none", letterSpacing:"0.5px" }}>
            Ver en catálogo →
          </a>
        </div>
      </div>

      {/* Compartir */}
      <div style={{ marginTop:"24px", display:"flex", gap:"12px", alignItems:"center" }}>
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("¡Link copiado!");
          }}
          style={{ padding:"10px 20px", borderRadius:"8px",
            border:"1px solid rgba(255,255,255,0.1)", background:"transparent",
            color:"rgba(255,255,255,0.5)", fontSize:"12px",
            cursor:"pointer", letterSpacing:"0.5px", fontFamily:"system-ui" }}>
          Copiar link
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(`Escucha "${track.name}" de ${track.artist} 🎵 ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
          target="_blank" rel="noreferrer"
          style={{ padding:"10px 20px", borderRadius:"8px",
            border:"1px solid rgba(37,211,102,0.3)", background:"rgba(37,211,102,0.08)",
            color:"#25d366", fontSize:"12px", textDecoration:"none",
            letterSpacing:"0.5px" }}>
          WhatsApp
        </a>
        <a href={`https://instagram.com`} target="_blank" rel="noreferrer"
          style={{ padding:"10px 20px", borderRadius:"8px",
            border:"1px solid rgba(168,230,61,0.3)", background:"rgba(168,230,61,0.08)",
            color:"#a8e63d", fontSize:"12px", textDecoration:"none",
            letterSpacing:"0.5px" }}>
          Instagram
        </a>
      </div>

      <p style={{ marginTop:"32px", fontSize:"11px", color:"rgba(255,255,255,0.15)",
        letterSpacing:"1px", textTransform:"uppercase" }}>
        © LoyalFox Records 2025
      </p>
    </div>
  );
}
