"use client";
import { useEffect, useState } from "react";
import { css, hs } from "./styles";

type Submission = {
  id: string; track_title: string; genre: string; notes: string;
  submitted_at: string; updated_at: string;
  artist_contracts: { title:string; pdf_url:string; status:string; signed_pdf_url:string|null };
  artist_accounts: {
    name:string; artist_name:string; full_name:string; city:string; email:string;
    url_spotify_artist:string; url_soundcloud:string; url_apple_artist:string;
  };
};

export default function AdminReleases() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState<Submission|null>(null);

  useEffect(() => {
    fetch("/api/admin/release-submissions")
      .then(r => r.json())
      .then(d => { setSubmissions(d); setLoading(false); });
  }, []);

  const filtered = submissions.filter(s =>
    !search ||
    s.artist_accounts?.artist_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.track_title?.toLowerCase().includes(search.toLowerCase()) ||
    s.artist_contracts?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (d:string) => new Date(d).toLocaleDateString("es",{day:"numeric",month:"short",year:"numeric"});

  return (
    <div style={{ maxWidth:"1100px", display:"grid",
      gridTemplateColumns: selected ? "1fr 360px" : "1fr", gap:"20px" }}>
      <div>
        <p style={hs.subtitle}>Información de lanzamiento enviada por los artistas</p>

        <div style={hs.section}>
          <div style={hs.sectionHeader}>
            <p style={hs.cardTitle}>Lanzamientos ({submissions.length})</p>
            <input placeholder="Buscar artista, canción..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{...hs.input, width:"220px"}} />
          </div>

          {loading ? (
            <div style={{ padding:"40px", textAlign:"center" }}>
              <p style={{ fontFamily:"system-ui", fontSize:"13px", color:css.textMute }}>Cargando...</p>
            </div>
          ) : filtered.length===0 ? (
            <div style={{ padding:"40px", textAlign:"center" }}>
              <p style={{ fontFamily:"system-ui", fontSize:"13px", color:css.textMute }}>
                {search ? "Sin resultados" : "Ningún artista ha enviado información de lanzamiento aún."}
              </p>
            </div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:css.bg }}>
                  {["Artista","Contrato","Canción","Género","Fecha",""].map((h,i) => (
                    <th key={i} style={{ padding:"10px 16px", textAlign:"left",
                      fontSize:"11px", fontWeight:500, color:css.textMute,
                      fontFamily:"system-ui", borderBottom:`1px solid ${css.border}`,
                      textTransform:"uppercase", letterSpacing:"0.04em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s,i) => (
                  <tr key={s.id}
                    onClick={() => setSelected(selected?.id===s.id?null:s)}
                    style={{ borderBottom:`1px solid ${css.borderLight}`,
                      background: selected?.id===s.id ? css.blueBg : i%2===0?css.white:css.bg,
                      cursor:"pointer", transition:"background .1s" }}
                    onMouseEnter={e => { if(selected?.id!==s.id)(e.currentTarget as HTMLElement).style.background=css.bg; }}
                    onMouseLeave={e => { if(selected?.id!==s.id)(e.currentTarget as HTMLElement).style.background=i%2===0?css.white:css.bg; }}>
                    <td style={{ padding:"12px 16px" }}>
                      <p style={{ fontFamily:"system-ui", fontSize:"13px", fontWeight:500, color:css.text }}>
                        {s.artist_accounts?.artist_name}
                      </p>
                      <p style={{ fontFamily:"system-ui", fontSize:"11px", color:css.textMute }}>
                        {s.artist_accounts?.name}
                      </p>
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <p style={{ fontFamily:"system-ui", fontSize:"13px", color:css.text }}>
                        {s.artist_contracts?.title}
                      </p>
                      <span style={{
                        display:"inline-flex", padding:"1px 6px", borderRadius:"9999px",
                        fontSize:"10px", fontWeight:500, fontFamily:"system-ui",
                        color: s.artist_contracts?.status==="signed" ? css.green : css.yellow,
                        background: s.artist_contracts?.status==="signed" ? css.greenBg : css.yellowBg,
                        border:`1px solid ${s.artist_contracts?.status==="signed" ? css.greenBorder : css.yellowBorder}`,
                      }}>
                        {s.artist_contracts?.status==="signed" ? "✓ Firmado" : "Pendiente"}
                      </span>
                    </td>
                    <td style={{ padding:"12px 16px", fontFamily:"system-ui", fontSize:"13px", color:css.text }}>
                      {s.track_title || <span style={{ color:css.textMute, fontStyle:"italic" }}>Sin título</span>}
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      {s.genre && <span style={hs.badgeGray}>{s.genre}</span>}
                    </td>
                    <td style={{ padding:"12px 16px", fontFamily:"system-ui", fontSize:"12px", color:css.textMute }}>
                      {fmtDate(s.submitted_at)}
                    </td>
                    <td style={{ padding:"12px 16px" }}>
                      <span style={{ fontFamily:"system-ui", fontSize:"12px",
                        color: selected?.id===s.id ? css.blue : css.textMute }}>
                        {selected?.id===s.id ? "Ocultar ←" : "Ver →"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Panel lateral detalle */}
      {selected && (
        <div style={{ ...hs.section, position:"sticky", top:"20px",
          height:"fit-content", maxHeight:"80vh", overflowY:"auto" }}>
          <div style={{ ...hs.sectionHeader, justifyContent:"space-between" }}>
            <p style={hs.cardTitle}>Detalle</p>
            <button onClick={() => setSelected(null)}
              style={{ background:"none", border:"none", cursor:"pointer",
                fontSize:"16px", color:css.textMute }}>✕</button>
          </div>
          <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:"16px" }}>

            {/* Artista */}
            <div>
              <p style={{ fontFamily:"system-ui", fontSize:"11px", fontWeight:600,
                color:css.textMute, textTransform:"uppercase", letterSpacing:"0.05em",
                marginBottom:"10px" }}>👤 Artista</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                {[
                  { label:"Nombre completo", value:selected.artist_accounts?.full_name },
                  { label:"Nombre artístico", value:selected.artist_accounts?.artist_name },
                  { label:"Email", value:selected.artist_accounts?.email },
                  { label:"Ciudad", value:selected.artist_accounts?.city },
                ].map((f,i) => (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"110px 1fr", gap:"8px" }}>
                    <p style={{ fontFamily:"system-ui", fontSize:"11px", color:css.textMute }}>{f.label}</p>
                    <p style={{ fontFamily:"system-ui", fontSize:"12px", color:f.value?css.text:css.textMute,
                      fontStyle:f.value?"normal":"italic", wordBreak:"break-all" }}>
                      {f.value || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* URLs artista */}
            <div>
              <p style={{ fontFamily:"system-ui", fontSize:"11px", fontWeight:600,
                color:css.textMute, textTransform:"uppercase", letterSpacing:"0.05em",
                marginBottom:"10px" }}>🔗 Links artista</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                {[
                  { label:"Spotify",     value:selected.artist_accounts?.url_spotify_artist },
                  { label:"SoundCloud",  value:selected.artist_accounts?.url_soundcloud },
                  { label:"Apple Music", value:selected.artist_accounts?.url_apple_artist },
                ].map((f,i) => (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"80px 1fr", gap:"8px" }}>
                    <p style={{ fontFamily:"system-ui", fontSize:"11px", color:css.textMute }}>{f.label}</p>
                    {f.value ? (
                      <a href={f.value} target="_blank" rel="noreferrer"
                        style={{ fontFamily:"system-ui", fontSize:"12px", color:css.blue,
                          wordBreak:"break-all", textDecoration:"none" }}>
                        {f.value.replace("https://","").slice(0,30)}...
                      </a>
                    ) : (
                      <p style={{ fontFamily:"system-ui", fontSize:"12px", color:css.textMute, fontStyle:"italic" }}>—</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Lanzamiento */}
            <div>
              <p style={{ fontFamily:"system-ui", fontSize:"11px", fontWeight:600,
                color:css.textMute, textTransform:"uppercase", letterSpacing:"0.05em",
                marginBottom:"10px" }}>🎵 Lanzamiento</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                {[
                  { label:"Contrato",  value:selected.artist_contracts?.title },
                  { label:"Canción",   value:selected.track_title },
                  { label:"Género",    value:selected.genre },
                  { label:"Notas",     value:selected.notes },
                  { label:"Enviado",   value:fmtDate(selected.submitted_at) },
                ].map((f,i) => (
                  <div key={i} style={{ display:"grid", gridTemplateColumns:"70px 1fr", gap:"8px" }}>
                    <p style={{ fontFamily:"system-ui", fontSize:"11px", color:css.textMute }}>{f.label}</p>
                    <p style={{ fontFamily:"system-ui", fontSize:"12px",
                      color:f.value?css.text:css.textMute, fontStyle:f.value?"normal":"italic",
                      lineHeight:1.5 }}>
                      {f.value || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contratos */}
            <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
              {selected.artist_contracts?.pdf_url && (
                <a href={selected.artist_contracts.pdf_url} target="_blank" rel="noreferrer"
                  style={{ ...hs.btnSmall, textDecoration:"none", display:"inline-flex",
                    alignItems:"center", justifyContent:"center" }}>
                  Ver contrato PDF
                </a>
              )}
              {selected.artist_contracts?.signed_pdf_url && (
                <a href={selected.artist_contracts.signed_pdf_url} target="_blank" rel="noreferrer"
                  style={{ fontFamily:"system-ui", fontSize:"12px", fontWeight:500,
                    padding:"6px 12px", borderRadius:"6px", textDecoration:"none",
                    color:css.green, background:css.greenBg,
                    border:`1px solid ${css.greenBorder}`,
                    display:"inline-flex", alignItems:"center", justifyContent:"center" }}>
                  ✓ PDF firmado
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
