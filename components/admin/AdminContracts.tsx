"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { css, hs } from "./styles";

type Artist = { id:string; name:string; artist_name:string; };
type Contract = {
  id:string; artist_account_id:string; artist_name:string;
  title:string; description:string; pdf_url:string;
  status:"pending"|"signed"; signature_url:string|null;
  signed_at:string|null; created_at:string;
};

export default function AdminContracts() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [artists, setArtists]     = useState<Artist[]>([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm]           = useState({
    artist_account_id:"", title:"", description:"",
  });
  const [file, setFile]           = useState<File|null>(null);
  const [search, setSearch]       = useState("");

  const load = async () => {
    const [cRes, aRes] = await Promise.all([
      fetch("/api/admin/contracts"),
      supabase.from("artist_accounts").select("id,name,artist_name").eq("active",true),
    ]);
    const cData = await cRes.json();
    setContracts(cData);
    if (aRes.data) setArtists(aRes.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const selectedArtist = artists.find(a => a.id===form.artist_account_id);

  const upload = async () => {
    if (!file || !form.artist_account_id || !form.title) {
      alert("Selecciona un artista, pon un título y sube el PDF"); return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("artist_account_id", form.artist_account_id);
    fd.append("artist_name", selectedArtist?.artist_name||"");
    fd.append("title", form.title);
    fd.append("description", form.description);

    const res = await fetch("/api/admin/contracts", { method:"POST", body:fd });
    if (!res.ok) { alert("Error al subir el contrato"); setUploading(false); return; }
    setForm({ artist_account_id:"", title:"", description:"" });
    setFile(null);
    await load();
    setUploading(false);
  };

  const deleteContract = async (id:string) => {
    if (!confirm("¿Eliminar este contrato?")) return;
    await fetch("/api/admin/contracts", {
      method:"DELETE", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ id }),
    });
    await load();
  };

  const filtered = contracts.filter(c =>
    !search ||
    c.artist_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.title?.toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (d:string) => new Date(d).toLocaleDateString("es",{day:"numeric",month:"short",year:"numeric"});

  return (
    <div style={{ maxWidth:"1000px" }}>
      <p style={hs.subtitle}>Sube contratos en PDF para que los artistas los firmen digitalmente</p>

      {/* Formulario subir contrato */}
      <div style={{ ...hs.section, marginBottom:"24px" }}>
        <div style={hs.sectionHeader}>
          <p style={hs.cardTitle}>Subir nuevo contrato</p>
        </div>
        <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:"14px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div>
              <label style={hs.formLabel}>Artista *</label>
              <select value={form.artist_account_id}
                onChange={e => setForm(f => ({...f, artist_account_id:e.target.value}))}
                style={{...hs.input, appearance:"none" as any}}>
                <option value="">Seleccionar artista...</option>
                {artists.map(a => (
                  <option key={a.id} value={a.id}>{a.artist_name} ({a.name})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={hs.formLabel}>Título del contrato *</label>
              <input placeholder="Ej: Contrato de distribución 2025"
                value={form.title}
                onChange={e => setForm(f => ({...f, title:e.target.value}))}
                style={hs.input} />
            </div>
          </div>
          <div>
            <label style={hs.formLabel}>Descripción (opcional)</label>
            <textarea placeholder="Breve descripción del contrato..."
              value={form.description}
              onChange={e => setForm(f => ({...f, description:e.target.value}))}
              style={{...hs.input, minHeight:"60px", resize:"vertical" as any}} />
          </div>
          <div>
            <label style={hs.formLabel}>Archivo PDF *</label>
            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
              <label style={{ display:"inline-flex", alignItems:"center", gap:"6px",
                padding:"7px 14px", borderRadius:"6px", cursor:"pointer",
                border:`1px solid ${css.border}`, background:css.white,
                fontSize:"13px", fontWeight:500, color:css.text, fontFamily:"system-ui" }}>
                {file ? `✓ ${file.name}` : "Seleccionar PDF"}
                <input type="file" accept=".pdf" style={{ display:"none" }}
                  onChange={e => setFile(e.target.files?.[0]||null)} />
              </label>
              {file && (
                <span style={{ fontFamily:"system-ui", fontSize:"12px", color:css.green }}>
                  {(file.size/1024/1024).toFixed(2)} MB
                </span>
              )}
            </div>
          </div>
          <div>
            <button onClick={upload} disabled={uploading}
              style={{ ...hs.btnGreen, opacity:uploading?0.6:1 }}>
              {uploading?"Subiendo...":"Subir contrato"}
            </button>
          </div>
        </div>
      </div>

      {/* Lista contratos */}
      <div style={hs.section}>
        <div style={hs.sectionHeader}>
          <p style={hs.cardTitle}>Contratos ({contracts.length})</p>
          <input placeholder="Buscar artista o contrato..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{...hs.input, width:"220px"}} />
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:css.bg }}>
              {["Artista","Contrato","Estado","Fecha","Firma",""].map((h,i) => (
                <th key={i} style={{ padding:"10px 16px", textAlign:"left",
                  fontSize:"11px", fontWeight:500, color:css.textMute,
                  fontFamily:"system-ui", borderBottom:`1px solid ${css.border}`,
                  textTransform:"uppercase", letterSpacing:"0.04em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding:"40px", textAlign:"center",
                fontFamily:"system-ui", fontSize:"13px", color:css.textMute }}>
                Cargando...
              </td></tr>
            ) : filtered.length===0 ? (
              <tr><td colSpan={6} style={{ padding:"40px", textAlign:"center",
                fontFamily:"system-ui", fontSize:"13px", color:css.textMute }}>
                {search?"Sin resultados":"Sin contratos. Sube el primero arriba."}
              </td></tr>
            ) : filtered.map((c,i) => (
              <tr key={c.id} style={{ borderBottom:`1px solid ${css.borderLight}`,
                background:i%2===0?css.white:css.bg }}>
                <td style={{ padding:"12px 16px", fontFamily:"system-ui",
                  fontSize:"13px", fontWeight:500, color:css.text }}>
                  {c.artist_name}
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <p style={{ fontFamily:"system-ui", fontSize:"13px",
                    fontWeight:500, color:css.text }}>{c.title}</p>
                  {c.description && (
                    <p style={{ fontFamily:"system-ui", fontSize:"11px",
                      color:css.textMute, marginTop:"2px" }}>{c.description}</p>
                  )}
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <span style={{
                    display:"inline-flex", alignItems:"center", padding:"2px 8px",
                    borderRadius:"9999px", fontSize:"11px", fontWeight:500,
                    fontFamily:"system-ui",
                    color: c.status==="signed" ? css.green : css.yellow,
                    background: c.status==="signed" ? css.greenBg : css.yellowBg,
                    border: `1px solid ${c.status==="signed" ? css.greenBorder : css.yellowBorder}`,
                  }}>
                    {c.status==="signed" ? "✓ Firmado" : "Pendiente"}
                  </span>
                </td>
                <td style={{ padding:"12px 16px", fontFamily:"system-ui",
                  fontSize:"12px", color:css.textMute }}>
                  {fmtDate(c.created_at)}
                  {c.signed_at && (
                    <p style={{ fontSize:"11px", color:css.green, marginTop:"2px" }}>
                      Firmado: {fmtDate(c.signed_at)}
                    </p>
                  )}
                </td>
                <td style={{ padding:"12px 16px" }}>
                  {c.signature_url ? (
                    <a href={c.signature_url} target="_blank" rel="noreferrer">
                      <img src={c.signature_url} alt="firma"
                        style={{ height:"32px", border:`1px solid ${css.border}`,
                          borderRadius:"4px", background:css.white, padding:"2px" }} />
                    </a>
                  ) : (
                    <span style={{ fontFamily:"system-ui", fontSize:"12px", color:css.textMute }}>—</span>
                  )}
                </td>
                <td style={{ padding:"12px 16px" }}>
                  <div style={{ display:"flex", gap:"6px" }}>
                    <a href={c.pdf_url} target="_blank" rel="noreferrer"
                      style={{ ...hs.btnSmall, textDecoration:"none",
                        display:"inline-flex", alignItems:"center" }}>
                      Ver PDF
                    </a>
                    <button onClick={() => deleteContract(c.id)} style={hs.btnDanger}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
