"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";
import { c, base, card, cardHeader, cardTitle, btnLight, btnDark, Lang } from "./theme";

type Track = { id: string; name: string; artist: string; slug: string; image_url: string | null };

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "file";

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function loadImage(src: string, cors: boolean) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    if (cors) img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

// Imagen con CORS (el parámetro evita usar la copia cacheada sin cabeceras)
const corsUrl = (u: string) => u + (u.includes("?") ? "&" : "?") + "cors=1";

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxW) t = t.slice(0, -1);
  return t + "…";
}

async function buildStory(track: Track, link: string, lang: Lang): Promise<Blob> {
  const W = 1080, H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  let art: HTMLImageElement | null = null;
  if (track.image_url) { try { art = await loadImage(corsUrl(track.image_url), true); } catch { art = null; } }

  // Fondo
  ctx.fillStyle = "#0b0b0f"; ctx.fillRect(0, 0, W, H);
  if (art) {
    try {
      ctx.save();
      ctx.filter = "blur(60px) brightness(0.55)";
      const s = Math.max(W / art.width, H / art.height) * 1.2;
      ctx.drawImage(art, (W - art.width * s) / 2, (H - art.height * s) / 2, art.width * s, art.height * s);
      ctx.restore();
    } catch { /* filter no soportado */ }
  }
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0.25)"); g.addColorStop(1, "rgba(0,0,0,0.75)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  // Zona segura de Instagram: ~250px arriba y abajo
  const artSize = 780, artX = (W - artSize) / 2, artY = 330;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20;
  roundRect(ctx, artX, artY, artSize, artSize, 28);
  ctx.fillStyle = "#1a1a22"; ctx.fill();
  ctx.restore();
  if (art) {
    ctx.save(); roundRect(ctx, artX, artY, artSize, artSize, 28); ctx.clip();
    ctx.drawImage(art, artX, artY, artSize, artSize); ctx.restore();
  }

  ctx.textAlign = "center"; ctx.fillStyle = "#ffffff";
  ctx.font = "700 64px system-ui, -apple-system, sans-serif";
  ctx.fillText(fitText(ctx, track.name, 900), W / 2, artY + artSize + 100);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.font = "500 40px system-ui, -apple-system, sans-serif";
  ctx.fillText(fitText(ctx, track.artist, 900), W / 2, artY + artSize + 164);

  // QR
  const qrSize = 300, qrX = (W - qrSize) / 2, qrY = 1290;
  const qrUrl = await QRCode.toDataURL(link, { width: 600, margin: 1, color: { dark: "#0b0b0f", light: "#ffffff" } });
  const qr = await loadImage(qrUrl, false);
  roundRect(ctx, qrX - 24, qrY - 24, qrSize + 48, qrSize + 48, 28);
  ctx.fillStyle = "#ffffff"; ctx.fill();
  ctx.drawImage(qr, qrX, qrY, qrSize, qrSize);

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 34px system-ui, -apple-system, sans-serif";
  ctx.fillText(lang === "en" ? "Listen on all platforms" : "Escúchala en todas las plataformas", W / 2, qrY + qrSize + 90);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "500 28px system-ui, -apple-system, sans-serif";
  ctx.fillText("LoyalFox Records", W / 2, qrY + qrSize + 136);

  return new Promise<Blob>((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error("png"))), "image/png"));
}

function PromoKit({ track, link, lang }: { track: Track; link: string; lang: Lang }) {
  const L = (es: string, en: string) => (lang === "en" ? en : es);
  const [qr, setQr] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(link, { width: 220, margin: 1 }).then(setQr).catch(() => setQr(""));
  }, [link]);

  const dlQr = async () => {
    setBusy("qr");
    try {
      const big = await QRCode.toDataURL(link, { width: 1200, margin: 2 });
      const blob = await (await fetch(big)).blob();
      saveBlob(blob, `qr-${clean(track.name)}.png`);
    } finally { setBusy(null); }
  };
  const dlArt = async () => {
    if (!track.image_url) return;
    setBusy("art");
    try {
      const blob = await (await fetch(corsUrl(track.image_url))).blob();
      saveBlob(blob, `artwork-${clean(track.name)}.${blob.type.includes("png") ? "png" : "jpg"}`);
    } catch { window.open(track.image_url, "_blank"); }
    finally { setBusy(null); }
  };
  const dlStory = async () => {
    setBusy("story");
    try { saveBlob(await buildStory(track, link, lang), `story-${clean(track.name)}.png`); }
    catch { alert(L("No se pudo generar la imagen.", "Could not generate the image.")); }
    finally { setBusy(null); }
  };

  return (
    <div className="ad-promo" style={{ display: "flex", gap: "20px", padding: "16px 20px", background: c.bg, borderTop: `1px solid ${c.borderLight}`, flexWrap: "wrap", alignItems: "center" }}>
      {qr && <img src={qr} alt="QR" width={110} height={110} style={{ borderRadius: "8px", border: `1px solid ${c.border}`, background: c.white }} />}
      <div style={{ flex: 1, minWidth: "220px" }}>
        <p style={{ ...base, fontSize: "13px", fontWeight: 600, color: c.text, marginBottom: "4px" }}>{L("Kit promo", "Promo kit")}</p>
        <p style={{ ...base, fontSize: "12px", color: c.textMute, marginBottom: "12px", lineHeight: 1.6 }}>
          {L("QR del smart link, artwork en alta y una plantilla lista para stories (1080×1920).", "Smart link QR, hi-res artwork and a story-ready template (1080×1920).")}
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={dlQr} disabled={!!busy} style={btnLight}>{busy === "qr" ? "…" : "⬇ QR"}</button>
          {track.image_url && <button onClick={dlArt} disabled={!!busy} style={btnLight}>{busy === "art" ? "…" : `⬇ ${L("Artwork", "Artwork")}`}</button>}
          <button onClick={dlStory} disabled={!!busy} style={{ ...btnDark, padding: "8px 14px" }}>{busy === "story" ? L("Generando…", "Generating…") : `⬇ ${L("Imagen para story", "Story image")}`}</button>
        </div>
      </div>
    </div>
  );
}

// Lee las visitas del endpoint de stats sin asumir una forma concreta
function viewsFor(stats: any, slug: string): number | null {
  if (!stats) return null;
  try {
    if (Array.isArray(stats)) {
      const row = stats.find((s: any) => s.slug === slug || s.track_slug === slug);
      return row ? Number(row.views ?? row.total ?? row.count ?? 0) : null;
    }
    const v = stats[slug] ?? stats.bySlug?.[slug] ?? stats.views?.[slug];
    if (v === undefined) return null;
    return typeof v === "number" ? v : Number(v.views ?? v.total ?? v.count ?? 0);
  } catch { return null; }
}

export default function ArtistSmartLinks({ artistName, lang }: { artistName: string; lang: Lang }) {
  const L = (es: string, en: string) => (lang === "en" ? en : es);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    if (!artistName) return;
    supabase.from("tracks").select("id,name,artist,slug,image_url").eq("artist", artistName)
      .then(({ data }) => { setTracks((data as Track[]) || []); setLoading(false); });
    fetch("/api/track-link/stats").then(r => (r.ok ? r.json() : null)).then(setStats).catch(() => {});
  }, [artistName]);

  const linkOf = (t: Track) => `${typeof window !== "undefined" ? window.location.origin : "https://loyalfoxrecords.com"}/l/${t.slug}`;
  const copy = async (t: Track) => {
    try { await navigator.clipboard.writeText(linkOf(t)); setCopied(t.id); setTimeout(() => setCopied(null), 1800); } catch { /* sin permiso */ }
  };

  return (
    <div style={card}>
      <div style={cardHeader}><p style={cardTitle}>Smart Links</p></div>
      <p style={{ ...base, fontSize: "13px", color: c.textMute, padding: "14px 20px", lineHeight: 1.6 }}>
        {L("Un enlace único por canción para compartir en redes. Abre el kit promo para descargar el QR y la imagen para stories.",
           "One link per song to share on social media. Open the promo kit to download the QR and story image.")}
      </p>
      {loading ? (
        <p style={{ ...base, fontSize: "13px", color: c.textMute, padding: "28px", textAlign: "center" }}>{L("Cargando…", "Loading…")}</p>
      ) : tracks.length === 0 ? (
        <p style={{ ...base, fontSize: "13px", color: c.textMute, padding: "28px", textAlign: "center" }}>{L("Aún no tienes canciones publicadas.", "You have no published songs yet.")}</p>
      ) : tracks.map(t => {
        const v = viewsFor(stats, t.slug);
        return (
          <div key={t.id} style={{ borderTop: `1px solid ${c.borderLight}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", flexWrap: "wrap" }}>
              {t.image_url
                ? <img src={t.image_url} alt="" width={44} height={44} style={{ borderRadius: "6px", objectFit: "cover", flexShrink: 0 }} />
                : <div style={{ width: 44, height: 44, borderRadius: 6, background: c.accentBg, flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: "140px" }}>
                <p style={{ ...base, fontSize: "14px", fontWeight: 600, color: c.text }}>{t.name}</p>
                <p style={{ ...base, fontSize: "12px", color: c.textMute, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  /l/{t.slug}{v !== null ? ` · ${v} ${L("visitas", "views")}` : ""}
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => copy(t)} style={btnLight}>{copied === t.id ? `✓ ${L("Copiado", "Copied")}` : L("Copiar", "Copy")}</button>
                <button onClick={() => setOpen(open === t.id ? null : t.id)} style={btnLight}>{L("Kit promo", "Promo kit")} {open === t.id ? "▲" : "▼"}</button>
              </div>
            </div>
            {open === t.id && <PromoKit track={t} link={linkOf(t)} lang={lang} />}
          </div>
        );
      })}
    </div>
  );
}
