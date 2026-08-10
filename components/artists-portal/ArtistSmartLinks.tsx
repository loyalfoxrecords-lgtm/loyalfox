"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Track = {
  id: string; name: string; artist: string; slug: string;
  image_url: string; genre: string;
  url_spotify: string; url_apple: string; url_beatport: string;
};

const c = {
  bg:"#f9fafb", white:"#ffffff", border:"#e5e7eb", borderLight:"#f3f4f6",
  text:"#111827", textSub:"#6b7280", textMute:"#9ca3af",
  green:"#16a34a", greenBg:"#f0fdf4", greenBorder:"#bbf7d0",
  blue:"#2563eb", blueBg:"#eff6ff", blueBorder:"#bfdbfe",
};

export default function ArtistSmartLinks({ artistName, lang }: { artistName: string; lang: "es"|"en" }) {
  const [tracks, setTracks]     = useState<Track[]>([]);
  const [copied, setCopied]     = useState<string|null>(null);
  const [stats, setStats]       = useState<Record<string,{views:number; byPlatform:Record<string,number>}>>({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    supabase.from("tracks").select("*")
      .eq("artist", artistName)
      .then(({ data }) => {
        if (data) {
          setTracks(data);
          // Cargar stats de cada track
          data.forEach(t => {
            fetch(`/api/track-link/stats?slug=${t.slug}`)
              .then(r => r.json())
              .then(d => setStats(s => ({...s, [t.slug]: d})));
          });
        }
        setLoading(false);
      });
  }, [artistName]);

  const copyLink = (slug: string) => {
    const url = `https://www.loyalfoxrecords.com/l/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(slug);
    setTimeout(() => setCopied(null), 2000);
  };

  const base: React.CSSProperties = { fontFamily:"system-ui, -apple-system, sans-serif" };
  const card: React.CSSProperties = { background:c.white, border:`1px solid ${c.border}`, borderRadius:"8px", overflow:"hidden" };

  if (loading) return (
    <div style={{ padding:"40px", textAlign:"center" }}>
      <p style={{ ...base, fontSize:"13px", color:c.textMute }}>Cargando...</p>
    </div>
  );

  if (tracks.length === 0) return (
    <div style={{ ...card, padding:"40px", textAlign:"center" }}>
      <p style={{ ...base, fontSize:"13px", color:c.textMute }}>
        {lang==="en" ? "No tracks found for your account." : "No se encontraron tracks para tu cuenta."}
      </p>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
      <p style={{ ...base, fontSize:"13px", color:c.textMute, marginBottom:"4px" }}>
        {lang==="en"
          ? "Share these links on Instagram, TikTok or WhatsApp so your fans can listen on their preferred platform."
          : "Comparte estos links en Instagram, TikTok o WhatsApp para que tus fans escuchen en su plataforma favorita."}
      </p>

      {tracks.map(track => {
        const url = `https://www.loyalfoxrecords.com/l/${track.slug}`;
        const trackStats = stats[track.slug];
        const hasPlatforms = track.url_spotify || track.url_apple || track.url_beatport;

        return (
          <div key={track.id} style={{ ...card }}>
            <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", gap:"16px" }}>
              {/* Portada */}
              <div style={{ width:"56px", height:"56px", borderRadius:"8px",
                overflow:"hidden", flexShrink:0, background:c.borderLight }}>
                {track.image_url ? (
                  <img src={track.image_url} alt={track.name}
                    style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                ) : (
                  <div style={{ width:"100%", height:"100%", display:"flex",
                    alignItems:"center", justifyContent:"center",
                    fontSize:"20px", color:c.textMute }}>♪</div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ ...base, fontSize:"14px", fontWeight:600, color:c.text,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {track.name}
                </p>
                <p style={{ ...base, fontSize:"12px", color:c.textMute, marginTop:"2px" }}>
                  {track.artist}
                  {track.genre && <span style={{ marginLeft:"8px",
                    padding:"1px 6px", borderRadius:"4px",
                    background:c.borderLight, fontSize:"10px" }}>{track.genre}</span>}
                </p>

                {/* Stats */}
                {trackStats && trackStats.views > 0 && (
                  <div style={{ display:"flex", gap:"12px", marginTop:"6px" }}>
                    <span style={{ ...base, fontSize:"11px", color:c.blue }}>
                      👁 {trackStats.views.toLocaleString()} {lang==="en"?"views":"visitas"}
                    </span>
                    {Object.entries(trackStats.byPlatform || {}).map(([p,n]) => (
                      <span key={p} style={{ ...base, fontSize:"11px", color:c.textMute }}>
                        {p==="url_spotify"?"Spotify":p==="url_apple"?"Apple":p==="url_beatport"?"Beatport":p}: {n}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Acciones */}
              <div style={{ display:"flex", gap:"8px", flexShrink:0, alignItems:"center" }}>
                {!hasPlatforms && (
                  <span style={{ ...base, fontSize:"11px", color:c.textMute }}>
                    {lang==="en"?"No platform links yet":"Sin links de plataformas aún"}
                  </span>
                )}
                <a href={url} target="_blank" rel="noreferrer"
                  style={{ ...base, padding:"7px 12px", borderRadius:"6px",
                    border:`1px solid ${c.border}`, background:c.white,
                    fontSize:"12px", color:c.textSub, textDecoration:"none",
                    fontWeight:500 }}>
                  {lang==="en"?"Preview":"Ver link"}
                </a>
                <button onClick={() => copyLink(track.slug)}
                  style={{ ...base, padding:"7px 14px", borderRadius:"6px",
                    border:"none", fontSize:"12px", fontWeight:600, cursor:"pointer",
                    background: copied===track.slug ? c.greenBg : c.blue,
                    color: copied===track.slug ? c.green : "#fff",
                    transition:"all .2s" }}>
                  {copied===track.slug
                    ? (lang==="en"?"✓ Copied!":"✓ ¡Copiado!")
                    : (lang==="en"?"Copy link":"Copiar link")}
                </button>
              </div>
            </div>

            {/* URL visible */}
            <div style={{ padding:"8px 20px 12px",
              borderTop:`1px solid ${c.borderLight}`,
              background:c.bg }}>
              <p style={{ ...base, fontSize:"11px", color:c.textMute,
                fontFamily:"monospace", letterSpacing:"0.3px" }}>
                loyalfoxrecords.com/l/{track.slug}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
