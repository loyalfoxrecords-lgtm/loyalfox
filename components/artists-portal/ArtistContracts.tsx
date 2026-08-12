"use client";
import { useEffect, useState, useRef } from "react";

type Contract = {
  id: string; title: string; description: string; pdf_url: string;
  status: "pending"|"signed"; signature_url: string|null;
  signed_at: string|null; created_at: string; signed_pdf_url: string|null;
};

type ReleaseInfo = {
  full_name: string; artist_name: string; city: string;
  url_spotify_artist: string; url_soundcloud: string; url_apple_artist: string;
};

type Submission = {
  id?: string; track_title: string; genre: string; notes: string;
};

const c = {
  bg:"#f9fafb", white:"#ffffff", border:"#e5e7eb", borderLight:"#f3f4f6",
  text:"#111827", textSub:"#6b7280", textMute:"#9ca3af", accent:"#111827",
  green:"#16a34a", greenBg:"#f0fdf4", greenBorder:"#bbf7d0",
  blue:"#2563eb", blueBg:"#eff6ff", blueBorder:"#bfdbfe",
  yellow:"#d97706", yellowBg:"#fffbeb", yellowBorder:"#fde68a",
  red:"#dc2626", redBg:"#fef2f2", redBorder:"#fecaca",
};

const base: React.CSSProperties = { fontFamily:"system-ui, -apple-system, sans-serif" };

const GENRES = ["House","Deep House","Techno","Ambient","Melodic House","Afro House","Organic House","Progressive House","Otro/Other"];

// ─── Canvas de firma ───
function SignatureCanvas({ onSave, onCancel, lang }: {
  onSave:(data:string)=>void; onCancel:()=>void; lang:"es"|"en";
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing   = useRef(false);

  const getPos = (e:any, canvas:HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) return { x:e.touches[0].clientX-rect.left, y:e.touches[0].clientY-rect.top };
    return { x:e.clientX-rect.left, y:e.clientY-rect.top };
  };
  const startDraw = (e:any) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.beginPath();
    const pos = getPos(e, canvasRef.current!);
    ctx.moveTo(pos.x, pos.y);
  };
  const draw = (e:any) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.strokeStyle = "#111827"; ctx.lineWidth = 2; ctx.lineCap = "round";
    const pos = getPos(e, canvasRef.current!);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
  };
  const endDraw = () => { drawing.current = false; };
  const clear   = () => canvasRef.current!.getContext("2d")!.clearRect(0,0,canvasRef.current!.width,canvasRef.current!.height);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)",
      zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div style={{ background:c.white, borderRadius:"12px", padding:"28px",
        width:"500px", maxWidth:"95vw" }}>
        <h3 style={{ ...base, fontSize:"16px", fontWeight:700, color:c.text, marginBottom:"6px" }}>
          {lang==="en"?"Sign contract":"Firmar contrato"}
        </h3>
        <p style={{ ...base, fontSize:"13px", color:c.textMute, marginBottom:"16px" }}>
          {lang==="en"?"Draw your signature below":"Dibuja tu firma en el recuadro"}
        </p>
        <canvas ref={canvasRef} width={450} height={150}
          style={{ border:`2px solid ${c.border}`, borderRadius:"8px",
            width:"100%", cursor:"crosshair", touchAction:"none",
            background:"#fafafa", display:"block" }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        <div style={{ display:"flex", gap:"8px", marginTop:"16px", justifyContent:"flex-end" }}>
          <button onClick={clear}
            style={{ ...base, padding:"8px 16px", borderRadius:"6px",
              border:`1px solid ${c.border}`, background:c.white,
              fontSize:"13px", cursor:"pointer", color:c.textSub }}>
            {lang==="en"?"Clear":"Limpiar"}
          </button>
          <button onClick={onCancel}
            style={{ ...base, padding:"8px 16px", borderRadius:"6px",
              border:`1px solid ${c.border}`, background:c.white,
              fontSize:"13px", cursor:"pointer", color:c.textSub }}>
            {lang==="en"?"Cancel":"Cancelar"}
          </button>
          <button onClick={() => onSave(canvasRef.current!.toDataURL("image/png"))}
            style={{ ...base, padding:"8px 20px", borderRadius:"6px", border:"none",
              background:c.accent, color:c.white, fontSize:"13px",
              fontWeight:600, cursor:"pointer" }}>
            {lang==="en"?"Confirm signature":"Confirmar firma"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Carpeta de lanzamiento ───
function LaunchFolder({ contract, lang, releaseInfo, onSigned }: {
  contract: Contract;
  lang: "es"|"en";
  releaseInfo: ReleaseInfo;
  onSigned: () => void;
}) {
  const [open, setOpen]               = useState(false);
  const [signingId, setSigningId]     = useState(false);
  const [signingLoading, setSigningLoading] = useState(false);
  const [submission, setSubmission]   = useState<Submission>({ track_title:"", genre:"", notes:"" });
  const [savingSubmission, setSavingSubmission] = useState(false);
  const [submissionSaved, setSubmissionSaved]   = useState(false);
  const [loadingSubmission, setLoadingSubmission] = useState(false);

  useEffect(() => {
    if (open) {
      setLoadingSubmission(true);
      fetch(`/api/artists-portal/release-submission?contract_id=${contract.id}`)
        .then(r => r.json())
        .then(d => {
          if (d) setSubmission({ track_title:d.track_title||"", genre:d.genre||"", notes:d.notes||"" });
          setLoadingSubmission(false);
        });
    }
  }, [open, contract.id]);

  const saveSubmission = async () => {
    setSavingSubmission(true);
    await fetch("/api/artists-portal/release-submission", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ contract_id:contract.id, ...submission }),
    });
    setSubmissionSaved(true);
    setTimeout(() => setSubmissionSaved(false), 3000);
    setSavingSubmission(false);
  };

  const signContract = async (signatureData: string) => {
    setSigningLoading(true);
    const res = await fetch("/api/artists-portal/contracts/sign", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ contract_id:contract.id, signature_data:signatureData }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.signed_pdf_url) window.open(data.signed_pdf_url, "_blank");
      onSigned();
    }
    setSigningId(false);
    setSigningLoading(false);
  };

  const fmtDate = (d:string) => new Date(d).toLocaleDateString(lang==="en"?"en":"es",{day:"numeric",month:"long",year:"numeric"});

  return (
    <div style={{ border:`1px solid ${c.border}`, borderRadius:"12px", overflow:"hidden", background:c.white }}>
      {/* Cabecera carpeta */}
      <div onClick={() => setOpen(!open)}
        style={{ padding:"18px 20px", cursor:"pointer", display:"flex",
          alignItems:"center", gap:"14px", transition:"background .1s",
          background: open ? c.bg : c.white }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background=c.bg}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=open?c.bg:c.white}>
        {/* Icono carpeta */}
        <div style={{ width:"44px", height:"44px", borderRadius:"10px",
          background: contract.status==="signed" ? c.greenBg : c.yellowBg,
          border: `1px solid ${contract.status==="signed" ? c.greenBorder : c.yellowBorder}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"22px", flexShrink:0 }}>
          {contract.status==="signed" ? "✅" : "📁"}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ ...base, fontSize:"15px", fontWeight:600, color:c.text, marginBottom:"3px" }}>
            {contract.title}
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", flexWrap:"wrap" }}>
            <span style={{ ...base, fontSize:"11px",
              padding:"2px 8px", borderRadius:"9999px",
              color: contract.status==="signed" ? c.green : c.yellow,
              background: contract.status==="signed" ? c.greenBg : c.yellowBg,
              border:`1px solid ${contract.status==="signed" ? c.greenBorder : c.yellowBorder}`,
              fontWeight:500 }}>
              {contract.status==="signed"
                ? (lang==="en"?"✓ Signed":"✓ Firmado")
                : (lang==="en"?"Pending signature":"Pendiente de firma")}
            </span>
            <span style={{ ...base, fontSize:"11px", color:c.textMute }}>
              {fmtDate(contract.created_at)}
            </span>
            {contract.description && (
              <span style={{ ...base, fontSize:"11px", color:c.textMute }}>
                · {contract.description}
              </span>
            )}
          </div>
        </div>
        <span style={{ color:c.textMute, fontSize:"18px", transition:"transform .2s",
          transform:open?"rotate(180deg)":"none", display:"inline-block" }}>⌄</span>
      </div>

      {/* Contenido de la carpeta */}
      {open && (
        <div style={{ borderTop:`1px solid ${c.border}` }}>

          {/* ── Sección 1: Contrato ── */}
          <div style={{ padding:"20px", borderBottom:`1px solid ${c.borderLight}` }}>
            <p style={{ ...base, fontSize:"12px", fontWeight:600, color:c.textMute,
              textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"14px" }}>
              📄 {lang==="en"?"Contract":"Contrato"}
            </p>

            {contract.status==="signed" && contract.signed_at && (
              <div style={{ padding:"12px 16px", background:c.greenBg,
                border:`1px solid ${c.greenBorder}`, borderRadius:"8px", marginBottom:"14px",
                display:"flex", alignItems:"center", gap:"10px" }}>
                <span style={{ fontSize:"18px" }}>✅</span>
                <div>
                  <p style={{ ...base, fontSize:"13px", fontWeight:600, color:c.green }}>
                    {lang==="en"?"Contract signed":"Contrato firmado"}
                  </p>
                  <p style={{ ...base, fontSize:"11px", color:c.green, opacity:0.8 }}>
                    {fmtDate(contract.signed_at)}
                  </p>
                </div>
                {contract.signature_url && (
                  <img src={contract.signature_url} alt="firma"
                    style={{ height:"36px", marginLeft:"auto", border:`1px solid ${c.greenBorder}`,
                      borderRadius:"4px", background:c.white, padding:"3px" }} />
                )}
              </div>
            )}

            <div style={{ display:"flex", gap:"8px", flexWrap:"wrap" }}>
              <a href={contract.pdf_url} target="_blank" rel="noreferrer"
                style={{ ...base, padding:"8px 14px", borderRadius:"6px",
                  border:`1px solid ${c.border}`, background:c.white,
                  fontSize:"13px", fontWeight:500, color:c.textSub,
                  textDecoration:"none", display:"inline-flex", alignItems:"center", gap:"6px" }}>
                📄 {lang==="en"?"View original PDF":"Ver PDF original"}
              </a>
              {contract.status==="signed" && contract.signed_pdf_url && (
                <a href={contract.signed_pdf_url} target="_blank" rel="noreferrer"
                  style={{ ...base, padding:"8px 14px", borderRadius:"6px",
                    border:`1px solid ${c.greenBorder}`, background:c.greenBg,
                    fontSize:"13px", fontWeight:500, color:c.green,
                    textDecoration:"none", display:"inline-flex", alignItems:"center", gap:"6px" }}>
                  ✅ {lang==="en"?"Download signed PDF":"Descargar PDF firmado"}
                </a>
              )}
              {contract.status==="pending" && (
                <button onClick={() => setSigningId(true)} disabled={signingLoading}
                  style={{ ...base, padding:"8px 18px", borderRadius:"6px", border:"none",
                    background:c.accent, color:c.white, fontSize:"13px",
                    fontWeight:600, cursor:"pointer", opacity:signingLoading?0.6:1 }}>
                  ✍️ {signingLoading
                    ? (lang==="en"?"Saving...":"Guardando...")
                    : (lang==="en"?"Sign contract":"Firmar contrato")}
                </button>
              )}
            </div>
          </div>

          {/* ── Sección 2: Info del lanzamiento ── */}
          <div style={{ padding:"20px" }}>
            <p style={{ ...base, fontSize:"12px", fontWeight:600, color:c.textMute,
              textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:"4px" }}>
              🚀 {lang==="en"?"Release information":"Información del lanzamiento"}
            </p>
            <p style={{ ...base, fontSize:"12px", color:c.textMute, marginBottom:"16px" }}>
              {lang==="en"
                ? "Fill in the details for this release. Your personal info is pre-filled from your profile."
                : "Rellena los datos de este lanzamiento. Tu información personal viene de tu perfil."}
            </p>

            {loadingSubmission ? (
              <p style={{ ...base, fontSize:"13px", color:c.textMute }}>Cargando...</p>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                {/* Info fija del artista — solo lectura */}
                <div style={{ padding:"14px 16px", background:c.bg,
                  borderRadius:"8px", border:`1px solid ${c.borderLight}` }}>
                  <p style={{ ...base, fontSize:"11px", fontWeight:600, color:c.textMute,
                    marginBottom:"10px", textTransform:"uppercase", letterSpacing:"0.04em" }}>
                    {lang==="en"?"Your profile info (fixed)":"Tu información de perfil (fija)"}
                  </p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                    {[
                      { label:lang==="en"?"Full name":"Nombre completo", value:releaseInfo.full_name },
                      { label:lang==="en"?"Artist name":"Nombre artístico", value:releaseInfo.artist_name },
                      { label:lang==="en"?"City":"Ciudad", value:releaseInfo.city },
                      { label:"Spotify", value:releaseInfo.url_spotify_artist },
                      { label:"SoundCloud", value:releaseInfo.url_soundcloud },
                      { label:"Apple Music", value:releaseInfo.url_apple_artist },
                    ].map((f,i) => (
                      <div key={i}>
                        <p style={{ ...base, fontSize:"10px", color:c.textMute, marginBottom:"2px",
                          textTransform:"uppercase", letterSpacing:"0.04em" }}>{f.label}</p>
                        <p style={{ ...base, fontSize:"13px", color:f.value?c.text:c.textMute,
                          fontStyle:f.value?"normal":"italic" }}>
                          {f.value || (lang==="en"?"Not set — update in profile":"Sin datos — actualiza en perfil")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info específica del lanzamiento */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                  <div>
                    <label style={{ ...base, fontSize:"12px", fontWeight:500,
                      color:c.textSub, display:"block", marginBottom:"6px" }}>
                      {lang==="en"?"Song title":"Título de la canción"}
                    </label>
                    <input value={submission.track_title}
                      onChange={e => setSubmission(s => ({...s, track_title:e.target.value}))}
                      placeholder={lang==="en"?"My Track":"Mi canción"}
                      style={{ width:"100%", padding:"9px 12px",
                        border:`1px solid ${c.border}`, borderRadius:"6px",
                        fontFamily:"system-ui", fontSize:"13px", color:c.text,
                        outline:"none", boxSizing:"border-box" as any }}
                      onFocus={e => e.currentTarget.style.borderColor=c.accent}
                      onBlur={e => e.currentTarget.style.borderColor=c.border} />
                  </div>
                  <div>
                    <label style={{ ...base, fontSize:"12px", fontWeight:500,
                      color:c.textSub, display:"block", marginBottom:"6px" }}>
                      {lang==="en"?"Genre":"Género musical"}
                    </label>
                    <select value={submission.genre}
                      onChange={e => setSubmission(s => ({...s, genre:e.target.value}))}
                      style={{ width:"100%", padding:"9px 12px",
                        border:`1px solid ${c.border}`, borderRadius:"6px",
                        fontFamily:"system-ui", fontSize:"13px", color:c.text,
                        outline:"none", background:c.white, boxSizing:"border-box" as any,
                        appearance:"none" as any }}
                      onFocus={e => e.currentTarget.style.borderColor=c.accent}
                      onBlur={e => e.currentTarget.style.borderColor=c.border}>
                      <option value="">{lang==="en"?"Select genre...":"Seleccionar género..."}</option>
                      {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ ...base, fontSize:"12px", fontWeight:500,
                    color:c.textSub, display:"block", marginBottom:"6px" }}>
                    {lang==="en"?"Notes (optional)":"Notas adicionales (opcional)"}
                  </label>
                  <textarea value={submission.notes}
                    onChange={e => setSubmission(s => ({...s, notes:e.target.value}))}
                    placeholder={lang==="en"
                      ?"Release date, collaborators, anything else..."
                      :"Fecha de lanzamiento deseada, colaboradores, cualquier otra info..."}
                    rows={3}
                    style={{ width:"100%", padding:"9px 12px",
                      border:`1px solid ${c.border}`, borderRadius:"6px",
                      fontFamily:"system-ui", fontSize:"13px", color:c.text,
                      outline:"none", resize:"vertical" as any,
                      boxSizing:"border-box" as any }}
                    onFocus={e => e.currentTarget.style.borderColor=c.accent}
                    onBlur={e => e.currentTarget.style.borderColor=c.border} />
                </div>

                <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                  <button onClick={saveSubmission} disabled={savingSubmission}
                    style={{ ...base, padding:"9px 20px", borderRadius:"6px", border:"none",
                      background:c.accent, color:c.white, fontSize:"13px",
                      fontWeight:600, cursor:"pointer", opacity:savingSubmission?0.6:1 }}>
                    {savingSubmission
                      ? (lang==="en"?"Saving...":"Guardando...")
                      : (lang==="en"?"Save release info":"Guardar información")}
                  </button>
                  {submissionSaved && (
                    <span style={{ ...base, fontSize:"13px", color:c.green, fontWeight:500 }}>
                      ✓ {lang==="en"?"Saved!":"¡Guardado!"}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Canvas de firma */}
      {signingId && (
        <SignatureCanvas
          lang={lang}
          onCancel={() => setSigningId(false)}
          onSave={signContract}
        />
      )}
    </div>
  );
}

// ─── Componente principal ───
export default function ArtistContracts({ lang, artistName }: { lang:"es"|"en"; artistName:string }) {
  const [contracts, setContracts]     = useState<Contract[]>([]);
  const [releaseInfo, setReleaseInfo] = useState<ReleaseInfo>({
    full_name:"", artist_name:"", city:"",
    url_spotify_artist:"", url_soundcloud:"", url_apple_artist:"",
  });
  const [loading, setLoading]         = useState(true);

  const load = async () => {
    const [cRes, rRes] = await Promise.all([
      fetch("/api/artists-portal/contracts"),
      fetch("/api/artists-portal/release-info"),
    ]);
    const cData = await cRes.json();
    const rData = await rRes.json();
    setContracts(cData || []);
    setReleaseInfo({ ...rData, artist_name: rData.artist_name || artistName });
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const card: React.CSSProperties = { background:c.white, border:`1px solid ${c.border}`, borderRadius:"8px", overflow:"hidden" };
  const cardHeader: React.CSSProperties = { padding:"14px 20px", borderBottom:`1px solid ${c.border}`, display:"flex", alignItems:"center", justifyContent:"space-between" };
  const cardTitle: React.CSSProperties = { ...base, fontSize:"13px", fontWeight:600, color:c.text };
  const lbl: React.CSSProperties = { ...base, fontSize:"11px", fontWeight:500, color:c.textMute, textTransform:"uppercase", letterSpacing:"0.04em" };

  if (loading) return (
    <div style={{ padding:"40px", textAlign:"center" }}>
      <p style={{ ...base, fontSize:"13px", color:c.textMute }}>Cargando...</p>
    </div>
  );

  return (
    <div style={{ maxWidth:"760px", display:"flex", flexDirection:"column", gap:"24px" }}>

      {/* ── Mi perfil de artista ── */}
      <ArtistProfileForm releaseInfo={releaseInfo} setReleaseInfo={setReleaseInfo} lang={lang} />

      {/* ── Lanzamientos ── */}
      <div>
        <p style={{ ...base, fontSize:"15px", fontWeight:600, color:c.text, marginBottom:"12px" }}>
          🎵 {lang==="en"?"My releases":"Mis lanzamientos"}
        </p>
        {contracts.length===0 ? (
          <div style={{ ...card, padding:"40px", textAlign:"center" }}>
            <p style={{ fontSize:"28px", marginBottom:"8px" }}>📁</p>
            <p style={{ ...base, fontSize:"13px", color:c.textMute }}>
              {lang==="en"
                ? "No releases yet. We'll add them when you sign with the label."
                : "Aún no tienes lanzamientos. Los añadiremos cuando firmes con el sello."}
            </p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {contracts.map(contract => (
              <LaunchFolder
                key={contract.id}
                contract={contract}
                lang={lang}
                releaseInfo={releaseInfo}
                onSigned={load}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Formulario de info del artista ───
function ArtistProfileForm({ releaseInfo, setReleaseInfo, lang }: {
  releaseInfo: ReleaseInfo;
  setReleaseInfo: (r: ReleaseInfo) => void;
  lang: "es"|"en";
}) {
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [editing, setEditing] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch("/api/artists-portal/release-info", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify(releaseInfo),
    });
    setSaved(true); setEditing(false);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  const fields = [
    { key:"full_name",          label:lang==="en"?"Full name *":"Nombre completo *",           ph:lang==="en"?"Your full name":"Tu nombre completo",       fixed:true  },
    { key:"artist_name",        label:lang==="en"?"Artist name *":"Nombre artístico *",         ph:lang==="en"?"Your artist name":"Tu nombre artístico",    fixed:true  },
    { key:"city",               label:lang==="en"?"City *":"Ciudad de residencia *",            ph:lang==="en"?"Madrid, Spain":"Madrid, España",            fixed:true  },
    { key:"url_spotify_artist", label:"Spotify URL *",                                          ph:"https://open.spotify.com/artist/...",                   fixed:true  },
    { key:"url_soundcloud",     label:"SoundCloud URL *",                                       ph:"https://soundcloud.com/...",                            fixed:true  },
    { key:"url_apple_artist",   label:"Apple Music URL *",                                      ph:"https://music.apple.com/...",                           fixed:true  },
  ];

  const allFilled = fields.every(f => releaseInfo[f.key as keyof ReleaseInfo]);

  return (
    <div style={{ background:"#ffffff", border:`1px solid ${c.border}`, borderRadius:"12px", overflow:"hidden" }}>
      <div style={{ padding:"16px 20px", borderBottom:`1px solid ${c.border}`,
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <p style={{ fontFamily:"system-ui", fontSize:"14px", fontWeight:600, color:c.text }}>
            👤 {lang==="en"?"My artist profile":"Mi perfil de artista"}
          </p>
          <p style={{ fontFamily:"system-ui", fontSize:"12px", color:c.textMute, marginTop:"2px" }}>
            {lang==="en"
              ? "This info is reused across all your releases"
              : "Esta info se reutiliza en todos tus lanzamientos"}
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          {!allFilled && (
            <span style={{ fontFamily:"system-ui", fontSize:"11px", fontWeight:500,
              padding:"3px 8px", borderRadius:"9999px",
              color:c.yellow, background:c.yellowBg, border:`1px solid ${c.yellowBorder}` }}>
              {lang==="en"?"Incomplete":"Incompleto"}
            </span>
          )}
          {allFilled && !editing && (
            <span style={{ fontFamily:"system-ui", fontSize:"11px", fontWeight:500,
              padding:"3px 8px", borderRadius:"9999px",
              color:c.green, background:c.greenBg, border:`1px solid ${c.greenBorder}` }}>
              ✓ {lang==="en"?"Complete":"Completo"}
            </span>
          )}
          <button onClick={() => setEditing(!editing)}
            style={{ fontFamily:"system-ui", padding:"7px 14px", borderRadius:"6px",
              border:`1px solid ${c.border}`, background:"#ffffff",
              fontSize:"13px", fontWeight:500, color:c.textSub, cursor:"pointer" }}>
            {editing ? (lang==="en"?"Cancel":"Cancelar") : (lang==="en"?"Edit":"Editar")}
          </button>
        </div>
      </div>

      <div style={{ padding:"20px" }}>
        {editing ? (
          <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
              {fields.map(f => (
                <div key={f.key}>
                  <label style={{ fontFamily:"system-ui", fontSize:"12px", fontWeight:500,
                    color:c.textSub, display:"block", marginBottom:"6px" }}>
                    {f.label}
                  </label>
                  <input
                    value={releaseInfo[f.key as keyof ReleaseInfo]}
                    onChange={e => setReleaseInfo({...releaseInfo, [f.key]:e.target.value})}
                    placeholder={f.ph}
                    style={{ width:"100%", padding:"9px 12px",
                      border:`1px solid ${c.border}`, borderRadius:"6px",
                      fontFamily:"system-ui", fontSize:"13px", color:c.text,
                      outline:"none", boxSizing:"border-box" as any }}
                    onFocus={e => e.currentTarget.style.borderColor=c.accent}
                    onBlur={e => e.currentTarget.style.borderColor=c.border}
                  />
                </div>
              ))}
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"10px", marginTop:"4px" }}>
              <button onClick={save} disabled={saving}
                style={{ fontFamily:"system-ui", padding:"9px 20px", borderRadius:"6px",
                  border:"none", background:c.accent, color:"#ffffff", fontSize:"13px",
                  fontWeight:600, cursor:"pointer", opacity:saving?0.6:1 }}>
                {saving ? (lang==="en"?"Saving...":"Guardando...") : (lang==="en"?"Save":"Guardar")}
              </button>
              {saved && (
                <span style={{ fontFamily:"system-ui", fontSize:"13px", color:c.green, fontWeight:500 }}>
                  ✓ {lang==="en"?"Saved!":"¡Guardado!"}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            {fields.map(f => (
              <div key={f.key}>
                <p style={{ fontFamily:"system-ui", fontSize:"11px", color:c.textMute,
                  marginBottom:"3px", textTransform:"uppercase", letterSpacing:"0.04em" }}>
                  {f.label.replace(" *","")}
                </p>
                <p style={{ fontFamily:"system-ui", fontSize:"13px",
                  color:releaseInfo[f.key as keyof ReleaseInfo]?c.text:c.textMute,
                  fontStyle:releaseInfo[f.key as keyof ReleaseInfo]?"normal":"italic" }}>
                  {releaseInfo[f.key as keyof ReleaseInfo] ||
                    (lang==="en"?"Not set":"Sin datos")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
