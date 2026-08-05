"use client";
import { useState, useRef } from "react";

const TEMPLATES = [
  { id:"new-release",      name:"New Release",      tag:"NEW RELEASE",      layout:"bottom-left",  accent:"#39ff14", overlay:"linear-gradient(to bottom, rgba(6,6,6,0.5) 0%, rgba(6,6,6,0.1) 40%, rgba(6,6,6,0.85) 100%)" },
  { id:"out-now",          name:"Out Now",           tag:"OUT NOW",          layout:"bottom-left",  accent:"#39ff14", overlay:"linear-gradient(to top, rgba(6,6,6,0.95) 0%, rgba(6,6,6,0.3) 60%, transparent 100%)" },
  { id:"centered",         name:"Centrado",          tag:"NEW TRACK",        layout:"center",       accent:"#39ff14", overlay:"rgba(6,6,6,0.65)" },
  { id:"dark-minimal",     name:"Dark Minimal",      tag:"LOYALFOX",         layout:"bottom-right", accent:"#39ff14", overlay:"linear-gradient(135deg, rgba(6,6,6,0.9) 0%, rgba(6,6,6,0.4) 100%)" },
  { id:"split",            name:"Split Negro",       tag:"RELEASE",          layout:"split",        accent:"#39ff14", overlay:"none" },
  { id:"collab",           name:"Colaboración",      tag:"COLLAB",           layout:"bottom-left",  accent:"#39ff14", overlay:"linear-gradient(to bottom, rgba(6,6,6,0.7) 0%, transparent 40%, rgba(6,6,6,0.9) 100%)" },
  { id:"clip",             name:"Clip / Preview",    tag:"CLIP PREVIEW",     layout:"top-center",   accent:"#39ff14", overlay:"linear-gradient(to bottom, rgba(6,6,6,0.85) 0%, transparent 50%, rgba(6,6,6,0.85) 100%)" },
  { id:"anniversary",      name:"Aniversario",       tag:"ANNIVERSARY",      layout:"center",       accent:"#39ff14", overlay:"rgba(6,6,6,0.55)" },
  { id:"artist-spotlight", name:"Artista del mes",   tag:"ARTIST SPOTLIGHT", layout:"bottom-left",  accent:"#39ff14", overlay:"linear-gradient(to top, rgba(6,6,6,1) 0%, rgba(6,6,6,0.6) 40%, rgba(6,6,6,0.1) 100%)" },
  { id:"playlist-drop",    name:"Nueva Playlist",    tag:"NEW PLAYLIST",     layout:"bottom-left",  accent:"#1DB954", overlay:"linear-gradient(to bottom, rgba(6,6,6,0.6) 0%, rgba(6,6,6,0.1) 50%, rgba(6,6,6,0.9) 100%)" },
];

const CAPTION_TEMPLATES: Record<string, string> = {
  "new-release":      `The kind of track you play when words aren't enough.\n\n{track} — {artist}\n{genre} · Out now on all platforms.\n\n🔗 Link in bio\n\n#LoyalFoxRecords #{artistTag} #NewRelease #ElectronicMusic`,
  "out-now":          `Out now. No filter needed.\n\n{track} — {artist}\nAvailable everywhere.\n\n🔗 Link in bio\n\n#LoyalFoxRecords #OutNow #ElectronicMusic #{genreTag}`,
  "centered":         `Some tracks find you at exactly the right moment.\n\n{track} — {artist}\n{genre} · LoyalFox Records\n\n🔗 Link in bio\n\n#LoyalFoxRecords #{artistTag} #{genreTag}`,
  "dark-minimal":     `Close your eyes. Let it hit.\n\n{track} — {artist}\n\n🔗 Link in bio\n\n#LoyalFoxRecords #DarkElectronic #{genreTag}`,
  "split":            `Two worlds. One track.\n\n{track} — {artist}\n{genre} · Out now.\n\n🔗 Link in bio\n\n#LoyalFoxRecords #{artistTag} #NewMusic`,
  "collab":           `When two sounds become one.\n\n{track} — {artist}\nA LoyalFox Records collaboration.\n\n🔗 Link in bio\n\n#LoyalFoxRecords #Collab #ElectronicMusic`,
  "clip":             `30 seconds of what's coming.\n\n{track} — {artist}\nFull track out soon.\n\n🔗 Link in bio\n\n#LoyalFoxRecords #ComingSoon #{genreTag}`,
  "anniversary":      `One year of sound. Thank you.\n\n{track} — {artist}\nA track that started it all.\n\n🔗 Link in bio\n\n#LoyalFoxRecords #Anniversary #ElectronicMusic`,
  "artist-spotlight": `This month, one artist. One vision.\n\n{artist} · LoyalFox Records\n{genre} producer. Check the full catalog.\n\n🔗 Link in bio\n\n#LoyalFoxRecords #ArtistSpotlight #{artistTag}`,
  "playlist-drop":    `New playlist just dropped.\n\n{track}\nHandpicked tracks for your set.\n\nSpotify → Link in bio\n\n#LoyalFoxRecords #NewPlaylist #ElectronicMusic`,
};

function buildCaption(templateId: string, track: string, artist: string, genre: string) {
  const tpl = CAPTION_TEMPLATES[templateId] || CAPTION_TEMPLATES["new-release"];
  return tpl
    .replace(/{track}/g, track || "Track Name")
    .replace(/{artist}/g, artist || "Artist")
    .replace(/{genre}/g, genre || "Electronic")
    .replace(/{artistTag}/g, (artist || "Artist").replace(/\s+/g, ""))
    .replace(/{genreTag}/g, (genre || "Electronic").replace(/\s+/g, ""));
}

function Card({ tpl, track, artist, bgUrl, bgBase64 }: {
  tpl: typeof TEMPLATES[0]; track: string; artist: string; bgUrl: string; bgBase64: string;
}) {
  const isCenter      = tpl.layout === "center";
  const isTopCenter   = tpl.layout === "top-center";
  const isBottomRight = tpl.layout === "bottom-right";
  const isSplit       = tpl.layout === "split";
  const bgSrc         = bgBase64 || bgUrl;

  return (
    <div style={{ position:"relative", width:"300px", height:"300px",
      overflow:"hidden", background:"#060606", flexShrink:0 }}>

      {bgSrc && (
        <div data-bg="true" style={{ position:"absolute", inset:0,
          backgroundImage:`url(${bgSrc})`,
          backgroundSize:"cover", backgroundPosition:"center" }} />
      )}

      {tpl.overlay !== "none" && (
        <div style={{ position:"absolute", inset:0, background: tpl.overlay }} />
      )}

      {isSplit && (
        <div style={{ position:"absolute", top:0, left:0, bottom:0, width:"45%",
          background:"#060606", zIndex:1 }} />
      )}

      <div style={{ position:"absolute", inset:0,
        backgroundImage:"linear-gradient(rgba(57,255,20,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.025) 1px, transparent 1px)",
        backgroundSize:"30px 30px" }} />

      {isCenter && (
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", textAlign:"center", padding:"16px", zIndex:5 }}>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"8px",
            letterSpacing:"3px", textTransform:"uppercase", color:tpl.accent, marginBottom:"10px" }}>
            {tpl.tag}
          </span>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"32px",
            lineHeight:0.9, color:"#e8e8e8", marginBottom:"8px", textShadow:"0 0 20px rgba(0,0,0,0.9)" }}>
            {track || "TRACK NAME"}
          </div>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
            color:"rgba(232,232,232,0.7)", letterSpacing:"1px" }}>
            by <span style={{ color:tpl.accent }}>{artist || "Artist"}</span>
          </div>
          <div style={{ width:"40px", height:"1px", background:tpl.accent, margin:"10px auto" }} />
        </div>
      )}

      {isTopCenter && (
        <div style={{ position:"absolute", top:"20px", left:0, right:0,
          textAlign:"center", padding:"0 16px", zIndex:5 }}>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"8px",
            letterSpacing:"3px", textTransform:"uppercase", color:tpl.accent,
            display:"block", marginBottom:"8px" }}>
            {tpl.tag}
          </span>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"30px",
            lineHeight:0.9, color:"#e8e8e8", textShadow:"0 0 20px rgba(0,0,0,0.9)" }}>
            {track || "TRACK NAME"}
          </div>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
            color:"rgba(232,232,232,0.7)", marginTop:"6px" }}>
            by <span style={{ color:tpl.accent }}>{artist || "Artist"}</span>
          </div>
        </div>
      )}

      {isSplit && (
        <div style={{ position:"absolute", top:0, left:0, bottom:0, width:"45%",
          display:"flex", flexDirection:"column", justifyContent:"center",
          padding:"16px", zIndex:5 }}>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"7px",
            letterSpacing:"2px", textTransform:"uppercase", color:tpl.accent, marginBottom:"8px" }}>
            {tpl.tag}
          </span>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"26px",
            lineHeight:0.9, color:"#e8e8e8", marginBottom:"8px" }}>
            {track || "TRACK NAME"}
          </div>
          <div style={{ width:"24px", height:"1px", background:tpl.accent, marginBottom:"8px" }} />
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
            color:"rgba(232,232,232,0.7)" }}>
            {artist || "Artist"}
          </div>
        </div>
      )}

      {(tpl.layout === "bottom-left" || isBottomRight) && (
        <div style={{ position:"absolute", bottom:0, left:0, right:0,
          padding:"12px 14px 14px",
          textAlign:isBottomRight ? "right" : "left", zIndex:5 }}>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"8px",
            letterSpacing:"2px", textTransform:"uppercase",
            color:tpl.accent, display:"inline-block", marginBottom:"6px" }}>
            {tpl.tag}
          </span>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"30px",
            lineHeight:0.9, color:"#e8e8e8", marginBottom:"5px",
            textShadow:"0 2px 8px rgba(0,0,0,0.8)" }}>
            {track || "TRACK NAME"}
          </div>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
            color:"rgba(232,232,232,0.7)", letterSpacing:"1px" }}>
            by <span style={{ color:tpl.accent }}>{artist || "Artist"}</span>
          </div>
        </div>
      )}

      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"2px",
        background:tpl.accent, zIndex:6 }} />
    </div>
  );
}

export default function AdminInstagram() {
  const [selected, setSelected]       = useState(TEMPLATES[0].id);
  const [track, setTrack]             = useState("");
  const [artist, setArtist]           = useState("");
  const [genre, setGenre]             = useState("");
  const [bgUrl, setBgUrl]             = useState("");
  const [bgBase64, setBgBase64]       = useState("");
  const [bgStatus, setBgStatus]       = useState<"idle"|"loading"|"ready"|"error">("idle");
  const [copied, setCopied]           = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const tpl     = TEMPLATES.find((t) => t.id === selected) || TEMPLATES[0];
  const caption = buildCaption(selected, track, artist, genre);

  const handleBgUrl = async (url: string) => {
    setBgUrl(url);
    setBgBase64("");
    setBgStatus("idle");
    if (!url) return;
    setBgStatus("loading");
    try {
      const res  = await fetch(url);
      const blob = await res.blob();
      const b64  = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror  = reject;
        reader.readAsDataURL(blob);
      });
      setBgBase64(b64);
      setBgStatus("ready");
    } catch {
      setBgStatus("error");
    }
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = async () => {
    const card = cardRef.current;
    if (!card) return;
    setDownloading(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(card, {
        width: 300, height: 300,
        backgroundColor: "#060606",
        useCORS: true, allowTaint: true,
        imageTimeout: 0,
        ...({ scale: 3.6 } as any),
      });
      const link = document.createElement("a");
      link.download = `loyalfox-${selected}-${(track || "track").toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error(e);
      alert("Error al descargar");
    }
    setDownloading(false);
  };

  const inputStyle: React.CSSProperties = {
    width:"100%", padding:"10px 12px", background:"#161616",
    border:"1px solid #222", color:"#e8e8e8",
    fontFamily:"inherit", fontSize:"13px", outline:"none",
  };
  const lbl: React.CSSProperties = {
    fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
    letterSpacing:"2px", textTransform:"uppercase",
    color:"#555", display:"block", marginBottom:"6px",
  };

  return (
    <div>
      <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"32px",
        letterSpacing:"2px", color:"#e8e8e8", marginBottom:"8px" }}>
        Instagram Templates
      </h2>
      <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
        color:"#555", marginBottom:"32px", letterSpacing:"1px" }}>
        10 plantillas · Rellena los campos · Descarga en PNG 1080×1080px
      </p>

      <div style={{ display:"flex", gap:"24px", alignItems:"flex-start", flexWrap:"wrap" }}>

        {/* LEFT */}
        <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>

          <div ref={cardRef}>
            <Card tpl={tpl} track={track} artist={artist} bgUrl={bgUrl} bgBase64={bgBase64} />
          </div>

          {/* Descargar PNG */}
          <button onClick={downloadImage} disabled={downloading}
            style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
              letterSpacing:"2px", textTransform:"uppercase", padding:"13px",
              background: downloading ? "rgba(57,255,20,0.4)" : "#39ff14",
              color:"#000", border:"none", cursor: downloading ? "wait" : "pointer",
              fontWeight:700, display:"flex", alignItems:"center",
              justifyContent:"center", gap:"8px", width:"300px" }}>
            {downloading ? "Generando..." : "↓ Descargar PNG 1080×1080"}
          </button>

          {/* Abrir imagen original en nueva pestaña */}
          {bgUrl && (
            <a href={bgUrl} target="_blank" rel="noreferrer"
              style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                letterSpacing:"2px", textTransform:"uppercase", padding:"11px",
                background:"transparent", color:"#555",
                border:"1px solid #222", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                gap:"8px", width:"300px", textDecoration:"none",
                boxSizing:"border-box", transition:"all .2s" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#39ff14";
                (e.currentTarget as HTMLElement).style.color = "#39ff14";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#222";
                (e.currentTarget as HTMLElement).style.color = "#555";
              }}>
              ↗ Abrir imagen en nueva pestaña
            </a>
          )}

          {/* Template selector */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)",
            gap:"4px", width:"300px" }}>
            {TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => setSelected(t.id)}
                style={{ padding:"6px 4px",
                  background: selected === t.id ? "rgba(57,255,20,0.1)" : "#0e0e0e",
                  border: selected === t.id ? "1px solid #39ff14" : "1px solid #222",
                  color: selected === t.id ? "#39ff14" : "#555",
                  fontFamily:"'Share Tech Mono',monospace", fontSize:"8px",
                  letterSpacing:"0.5px", cursor:"pointer",
                  textAlign:"center", lineHeight:1.3 }}>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ flex:1, minWidth:"260px", display:"flex", flexDirection:"column", gap:"14px" }}>

          <div>
            <label style={lbl}>Nombre del track</label>
            <input style={inputStyle} placeholder="Signal Fading"
              value={track} onChange={(e) => setTrack(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(57,255,20,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#222")} />
          </div>

          <div>
            <label style={lbl}>Artista</label>
            <input style={inputStyle} placeholder="Noselo"
              value={artist} onChange={(e) => setArtist(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(57,255,20,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#222")} />
          </div>

          <div>
            <label style={lbl}>Género (solo para el caption)</label>
            <input style={inputStyle} placeholder="Techno"
              value={genre} onChange={(e) => setGenre(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(57,255,20,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#222")} />
          </div>

          <div>
            <label style={lbl}>Imagen de fondo (URL)</label>
            <input style={inputStyle} placeholder="https://i.ibb.co/..."
              value={bgUrl}
              onChange={(e) => handleBgUrl(e.target.value)}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(57,255,20,0.4)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#222")} />
            {bgStatus === "loading" && (
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                color:"#555", marginTop:"4px", letterSpacing:"1px" }}>
                Cargando imagen...
              </p>
            )}
            {bgStatus === "ready" && (
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                color:"#39ff14", marginTop:"4px", letterSpacing:"1px" }}>
                ✓ Imagen lista para descarga
              </p>
            )}
            {bgStatus === "error" && (
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                color:"#ff4444", marginTop:"4px", letterSpacing:"1px" }}>
                ⚠ No se pudo cargar — usa el botón "Abrir en nueva pestaña"
              </p>
            )}
          </div>

          {/* Caption */}
          <div>
            <label style={lbl}>Caption generado</label>
            <textarea readOnly value={caption}
              style={{ ...inputStyle, resize:"none", minHeight:"140px",
                lineHeight:1.6, color:"#aaa",
                fontFamily:"'Share Tech Mono',monospace" }} />
            <button onClick={copyCaption}
              style={{ marginTop:"6px", width:"100%", padding:"10px",
                background: copied ? "#1DB954" : "transparent",
                color: copied ? "#000" : "#39ff14",
                border:"1px solid rgba(57,255,20,0.3)",
                fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                letterSpacing:"2px", textTransform:"uppercase",
                cursor:"pointer", fontWeight: copied ? 700 : 400 }}>
              {copied ? "✓ Copiado" : "Copiar caption"}
            </button>
          </div>

          {/* Tips */}
          <div style={{ padding:"14px", background:"#0e0e0e", border:"1px solid #1a1a1a" }}>
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
              letterSpacing:"2px", textTransform:"uppercase",
              color:"#39ff14", marginBottom:"8px" }}>
              Instrucciones
            </p>
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
              color:"#444", lineHeight:1.8 }}>
              1. Rellena nombre del track y artista<br/>
              2. Pega la URL de la imagen de fondo<br/>
              3. Espera a que diga "✓ Imagen lista"<br/>
              4. Descarga el PNG con el botón verde<br/>
              5. Si no funciona → abre en nueva pestaña y guarda desde ahí<br/>
              6. Copia el caption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}