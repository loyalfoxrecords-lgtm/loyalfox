"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { supabase } from "@/lib/supabase";

type TopTrack = {
  track_name: string; artist: string;
  streams: number; revenue: number;
  image_url?: string; slug?: string;
};

const fmt = (n: number) =>
  n >= 1000000 ? `${(n/1000000).toFixed(1)}M`
  : n >= 1000  ? `${(n/1000).toFixed(1)}K`
  : String(n);

export default function TopTracks() {
  const [tracks, setTracks]   = useState<TopTrack[]>([]);
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const ref = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref, offset:["start end","center center"]
  });
  const titleY = useTransform(scrollYProgress, [0,0.5], [40, 0]);
  const titleO = useTransform(scrollYProgress, [0,0.3], [0, 1]);

  useEffect(() => {
    setMounted(true);
    const load = async () => {
      const [
        { data: analyticsData },
        { data: catalogData },
      ] = await Promise.all([
        supabase.from("analytics_tracks").select("track_name, artist, streams, revenue"),
        supabase.from("tracks").select("name, artist, image_url, slug"),
      ]);

      if (!analyticsData) return;

      // Agrupa por track sumando todos los meses
      const map: Record<string, TopTrack> = {};
      analyticsData.forEach((row) => {
        const key = `${row.track_name}|||${row.artist}`;
        if (!map[key]) map[key] = {
          track_name: row.track_name,
          artist: row.artist,
          streams: 0, revenue: 0,
        };
        map[key].streams += row.streams;
        map[key].revenue += row.revenue;
      });

      // Vincula con el catálogo para obtener imagen y slug
      const sorted = Object.values(map)
        .sort((a,b) => b.streams - a.streams)
        .slice(0, 10)
        .map((track) => {
          const catalogTrack = catalogData?.find(
            c => c.name.toLowerCase().trim() === track.track_name.toLowerCase().trim()
          );
          return {
            ...track,
            image_url: catalogTrack?.image_url || "",
            slug:      catalogTrack?.slug || "",
          };
        });

      setTracks(sorted);
    };
    load();
  }, []);

  if (!mounted || tracks.length === 0) return <section ref={ref} />;

  const maxStreams = tracks[0]?.streams || 1;

  return (
    <section ref={ref} style={{ padding:"140px 0",
      background:"var(--black2)", position:"relative", overflow:"hidden" }}>

      {/* Número decorativo */}
      <div style={{ position:"absolute", right:"-20px", top:"10%",
        fontFamily:"var(--font-display)",
        fontSize:"clamp(150px,22vw,320px)",
        color:"rgba(240,240,240,0.018)", lineHeight:1,
        userSelect:"none", pointerEvents:"none" }}>
        TOP
      </div>

      {/* Header */}
      <motion.div style={{ padding:"0 56px", marginBottom:"80px",
        y: titleY, opacity: titleO }}>
        <div style={{ display:"flex", alignItems:"center",
          gap:"16px", marginBottom:"20px" }}>
          <div style={{ width:"40px", height:"2px", background:"#a8e63d" }} />
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
            letterSpacing:"4px", textTransform:"uppercase", color:"#a8e63d" }}>
            Más escuchadas
          </span>
        </div>
        <h2 style={{ fontFamily:"var(--font-display)",
          fontSize:"clamp(56px,8vw,110px)", lineHeight:0.88,
          letterSpacing:"-1px", color:"var(--white)" }}>
          TOP TRACKS<br />
          <span style={{ color:"transparent",
            WebkitTextStroke:"2px rgba(240,240,240,0.12)" }}>
            DEL SELLO
          </span>
        </h2>
      </motion.div>

      {/* Lista */}
      <div style={{ padding:"0 56px" }}>

        {/* Header tabla */}
        <div style={{ display:"grid",
          gridTemplateColumns:"48px 64px 1fr 160px 120px 180px",
          gap:"24px", padding:"0 0 16px",
          borderBottom:"1px solid rgba(255,255,255,0.05)",
          marginBottom:"4px" }}>
          {["#","","Track","Artista","Streams",""].map((h,i) => (
            <span key={i} style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
              letterSpacing:"3px", textTransform:"uppercase",
              color:"rgba(240,240,240,0.2)" }}>{h}</span>
          ))}
        </div>

        {/* Tracks */}
        {tracks.map((track, i) => {
          const href = track.slug ? `/catalog/${track.slug}` : null;

          return (
            <motion.div
              key={`${track.track_name}-${track.artist}`}
              initial={{ opacity:0, y:16 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }}
              transition={{ duration:0.5, delay:i*0.05 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => { if (href) window.location.href = href; }}
              style={{ display:"grid",
                gridTemplateColumns:"48px 64px 1fr 160px 120px 180px",
                gap:"24px", padding:"16px 0",
                borderBottom:"1px solid rgba(255,255,255,0.04)",
                alignItems:"center",
                cursor: href ? "pointer" : "default",
                background: hovered === i ? "rgba(168,230,61,0.02)" : "transparent",
                transition:"background .2s" }}>

              {/* Número */}
              <span style={{ fontFamily:"var(--font-display)", fontSize:"28px",
                lineHeight:1,
                color: i < 3 ? "#a8e63d" : "rgba(240,240,240,0.15)" }}>
                {String(i+1).padStart(2,"0")}
              </span>

              {/* Cover */}
              <div style={{ width:"56px", height:"56px", flexShrink:0,
                background:"#111", overflow:"hidden", position:"relative" }}>
                {track.image_url ? (
                  <motion.img
                    src={track.image_url}
                    alt={track.track_name}
                    style={{ width:"100%", height:"100%", objectFit:"cover" }}
                    animate={{ scale: hovered === i ? 1.08 : 1 }}
                    transition={{ duration:0.4 }} />
                ) : (
                  <div style={{ width:"100%", height:"100%",
                    background:`hsl(${i*37}, 10%, 14%)`,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontSize:"20px",
                      color:"rgba(240,240,240,0.1)" }}>♪</span>
                  </div>
                )}
                {/* Overlay play en hover */}
                {href && (
                  <motion.div
                    style={{ position:"absolute", inset:0,
                      background:"rgba(8,8,8,0.7)",
                      display:"flex", alignItems:"center", justifyContent:"center" }}
                    animate={{ opacity: hovered === i ? 1 : 0 }}
                    transition={{ duration:0.2 }}>
                    <span style={{ color:"#a8e63d", fontSize:"14px" }}>▶</span>
                  </motion.div>
                )}
              </div>

              {/* Track name */}
              <div>
                <motion.p
                  style={{ fontFamily:"var(--font-display)", fontSize:"20px",
                    lineHeight:1, marginBottom:"4px", letterSpacing:"0.5px",
                    transition:"color .2s" }}
                  animate={{ color: hovered === i ? "#a8e63d" : "#f0f0f0" }}>
                  {track.track_name}
                </motion.p>
                {i < 3 && (
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"8px",
                    letterSpacing:"2px", textTransform:"uppercase",
                    padding:"2px 8px", background:"rgba(168,230,61,0.1)",
                    color:"#a8e63d", border:"1px solid rgba(168,230,61,0.2)" }}>
                    {i === 0 ? "🔥 #1 del sello" : i === 1 ? "Top 2" : "Top 3"}
                  </span>
                )}
              </div>

              {/* Artista */}
              <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
                color:"rgba(240,240,240,0.4)", letterSpacing:"0.5px" }}>
                {track.artist}
              </p>

              {/* Streams */}
              <p style={{ fontFamily:"var(--font-display)", fontSize:"24px",
                lineHeight:1, color:"#a8e63d" }}>
                {fmt(track.streams)}
              </p>

              {/* Barra + link */}
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                  <div style={{ flex:1, height:"2px",
                    background:"rgba(255,255,255,0.06)", borderRadius:"2px",
                    overflow:"hidden" }}>
                    <motion.div
                      initial={{ width:0 }}
                      whileInView={{ width:`${(track.streams/maxStreams)*100}%` }}
                      viewport={{ once:true }}
                      transition={{ duration:0.8, delay:i*0.06, ease:[0.22,1,0.36,1] }}
                      style={{ height:"100%", borderRadius:"2px",
                        background: i === 0 ? "#a8e63d"
                          : i === 1 ? "rgba(168,230,61,0.7)"
                          : i === 2 ? "rgba(168,230,61,0.5)"
                          : "rgba(168,230,61,0.25)" }} />
                  </div>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                    color:"rgba(240,240,240,0.2)", minWidth:"32px", textAlign:"right" }}>
                    {((track.streams/maxStreams)*100).toFixed(0)}%
                  </span>
                </div>
                {href && (
                  <motion.span
                    style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                      letterSpacing:"2px", textTransform:"uppercase",
                      color:"#a8e63d" }}
                    animate={{ opacity: hovered === i ? 1 : 0 }}
                    transition={{ duration:0.2 }}>
                    Ver track →
                  </motion.span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}