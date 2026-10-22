"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/lib/LocaleContext";

type Testimonial = { id: string; name: string; role: string; quote: string; image_url: string; track_url: string };

const COPY = {
  es: { eyebrow: "Lo que dicen", title: "ARTISTAS QUE\nYA ESTÁN DENTRO", tracks: "Tracks publicados", artists: "Artistas", streams: "Reproducciones", listen: "Escuchar" },
  en: { eyebrow: "What they say", title: "ARTISTS ALREADY\nON THE LABEL", tracks: "Published tracks", artists: "Artists", streams: "Streams", listen: "Listen" },
  de: { eyebrow: "Stimmen", title: "KÜNSTLER, DIE\nSCHON DABEI SIND", tracks: "Veröffentlichte Tracks", artists: "Künstler", streams: "Streams", listen: "Anhören" },
} as const;

const fmtN = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

export default function SocialProof() {
  const { locale } = useLocale();
  const copy = COPY[(locale as keyof typeof COPY)] || COPY.es;
  const [stats, setStats] = useState({ tracks: 0, artists: 0, streams: 0 });
  const [items, setItems] = useState<Testimonial[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: tracks }, { data: artists }, { data: an }] = await Promise.all([
        supabase.from("tracks").select("id"),
        supabase.from("artists").select("id"),
        supabase.from("analytics_monthly").select("total_streams"),
      ]);
      setStats({
        tracks: tracks?.length || 0, artists: artists?.length || 0,
        streams: an?.reduce((a, m) => a + (m.total_streams || 0), 0) || 0,
      });
    })();
    fetch("/api/testimonials").then(r => (r.ok ? r.json() : [])).then(setItems).catch(() => {});
  }, []);

  const nums = [
    { n: stats.tracks, l: copy.tracks, f: String(stats.tracks) },
    { n: stats.artists, l: copy.artists, f: String(stats.artists) },
    { n: stats.streams, l: copy.streams, f: fmtN(stats.streams) },
  ].filter(x => x.n > 0);

  // Sin datos reales todavía: no se muestra nada
  if (nums.length === 0 && items.length === 0) return null;
  const lines = copy.title.split("\n");

  return (
    <section id="proof" style={{ background: "var(--black2)", padding: "clamp(64px,9vw,120px) clamp(20px,5vw,56px)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <div style={{ width: "32px", height: "2px", background: "#a8e63d" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "4px", textTransform: "uppercase", color: "#a8e63d" }}>{copy.eyebrow}</span>
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px,7vw,88px)", lineHeight: 0.9, letterSpacing: "-1px", color: "var(--white)", marginBottom: "clamp(32px,5vw,56px)" }}>
          {lines[0]}<br />
          <span style={{ color: "transparent", WebkitTextStroke: "1.5px rgba(240,240,240,0.15)" }}>{lines[1]}</span>
        </h2>

        {nums.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: "2px", marginBottom: items.length ? "2px" : 0 }}>
            {nums.map((x, i) => (
              <div key={i} style={{ background: "#0d0d0d", padding: "28px 24px", borderLeft: "2px solid #a8e63d" }}>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px,5vw,52px)", lineHeight: 1, color: "#a8e63d", marginBottom: "6px" }}>{x.f}</p>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: "rgba(240,240,240,0.35)" }}>{x.l}</p>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "2px" }}>
            {items.map((it, i) => (
              <motion.figure key={it.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                style={{ margin: 0, background: "#0d0d0d", padding: "30px 26px", display: "flex", flexDirection: "column", gap: "22px" }}>
                <blockquote style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "13px", lineHeight: 1.9, color: "rgba(240,240,240,0.7)" }}>
                  “{it.quote}”
                </blockquote>
                <figcaption style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "auto" }}>
                  {it.image_url ? (
                    <img src={it.image_url} alt={it.name} width={44} height={44} style={{ borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#1a1a1a", color: "#a8e63d", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: "18px" }}>
                      {it.name[0]?.toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "17px", letterSpacing: "1px", color: "var(--white)" }}>{it.name}</p>
                    {it.role && <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "rgba(240,240,240,0.35)" }}>{it.role}</p>}
                  </div>
                  {it.track_url && (
                    <a href={it.track_url} target="_blank" rel="noreferrer"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", color: "#a8e63d", textDecoration: "none" }}>
                      {copy.listen} ▶
                    </a>
                  )}
                </figcaption>
              </motion.figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
