"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { css, hs } from "./styles";

type Press = {
  id: string; artist_slug: string; title: string;
  url: string; source: string; image_url: string; published_at: string;
};
type Artist = { name: string; slug: string };

const empty = {
  artist_slug:"", title:"", url:"", source:"", image_url:"", published_at:""
};

export default function AdminArtistPress() {
  const [press, setPress]     = useState<Press[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [form, setForm]       = useState(empty);
  const [loading, setLoading] = useState(false);
  const [filterSlug, setFilterSlug] = useState("");

  const load = async () => {
    const [{ data:p }, { data:a }] = await Promise.all([
      supabase.from("artist_press").select("*").order("published_at", { ascending:false }),
      supabase.from("artists").select("name, slug").order("name"),
    ]);
    if (p) setPress(p);
    if (a) setArtists(a);
  };
  useEffect(() => { load(); }, []);

  const addPress = async () => {
    if (!form.artist_slug || !form.title || !form.url) {
      alert("Artista, titular y enlace son obligatorios"); return;
    }
    setLoading(true);
    await supabase.from("artist_press").insert(form);
    setForm(empty); await load(); setLoading(false);
  };

  const deletePress = async (id: string) => {
    if (!confirm("¿Eliminar este artículo?")) return;
    await supabase.from("artist_press").delete().eq("id", id);
    await load();
  };

  const filtered = filterSlug
    ? press.filter(p => p.artist_slug === filterSlug)
    : press;

  return (
    <div style={{ maxWidth:"900px" }}>
      <p style={hs.subtitle}>Artículos de prensa por artista</p>

      {/* Formulario */}
      <div style={{ ...hs.section, marginBottom:"24px" }}>
        <div style={hs.sectionHeader}>
          <p style={hs.cardTitle}>Añadir artículo</p>
        </div>
        <div style={{ padding:"20px", display:"flex", flexDirection:"column", gap:"12px" }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div>
              <label style={hs.formLabel}>Artista *</label>
              <select value={form.artist_slug}
                onChange={e => setForm({...form, artist_slug:e.target.value})}
                style={{...hs.input, appearance:"none" as any}}>
                <option value="">Seleccionar artista...</option>
                {artists.map(a => (
                  <option key={a.slug} value={a.slug}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={hs.formLabel}>Fuente (medio)</label>
              <input placeholder="ej: Resident Advisor, Mixmag..."
                value={form.source}
                onChange={e => setForm({...form, source:e.target.value})}
                style={hs.input} />
            </div>
          </div>
          <div>
            <label style={hs.formLabel}>Titular del artículo *</label>
            <input placeholder="Título del artículo tal como aparece en la web"
              value={form.title}
              onChange={e => setForm({...form, title:e.target.value})}
              style={hs.input} />
          </div>
          <div>
            <label style={hs.formLabel}>Enlace *</label>
            <input placeholder="https://..." value={form.url}
              onChange={e => setForm({...form, url:e.target.value})}
              style={hs.input} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            <div>
              <label style={hs.formLabel}>Imagen de portada (URL)</label>
              <input placeholder="https://... (imagen del artículo)"
                value={form.image_url}
                onChange={e => setForm({...form, image_url:e.target.value})}
                style={hs.input} />
            </div>
            <div>
              <label style={hs.formLabel}>Fecha de publicación</label>
              <input type="date" value={form.published_at}
                onChange={e => setForm({...form, published_at:e.target.value})}
                style={{...hs.input, colorScheme:"light"}} />
            </div>
          </div>
          {form.image_url && (
            <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
              <img src={form.image_url} alt="preview"
                style={{ width:"80px", height:"48px", objectFit:"cover",
                  borderRadius:"4px", border:`1px solid ${css.border}` }} />
              <p style={{ fontSize:"12px", color:css.textMute, fontFamily:"system-ui" }}>
                Preview de la imagen
              </p>
            </div>
          )}
          <div>
            <button onClick={addPress} disabled={loading}
              style={{ ...hs.btnGreen, opacity:loading?0.7:1 }}>
              {loading?"Guardando...":"Añadir artículo"}
            </button>
          </div>
        </div>
      </div>

      {/* Filtro y lista */}
      <div style={hs.section}>
        <div style={hs.sectionHeader}>
          <p style={hs.cardTitle}>Artículos ({press.length})</p>
          <select value={filterSlug}
            onChange={e => setFilterSlug(e.target.value)}
            style={{...hs.input, width:"200px", appearance:"none" as any}}>
            <option value="">Todos los artistas</option>
            {artists.map(a => (
              <option key={a.slug} value={a.slug}>{a.name}</option>
            ))}
          </select>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:css.bg }}>
              {["","Artista","Titular","Fuente","Fecha",""].map((h,i) => (
                <th key={i} style={{ padding:"10px 16px", textAlign:"left",
                  fontSize:"11px", fontWeight:500, color:css.textMute,
                  fontFamily:"system-ui", borderBottom:`1px solid ${css.border}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p,i) => {
              const artistName = artists.find(a => a.slug===p.artist_slug)?.name || p.artist_slug;
              return (
                <tr key={p.id} style={{ borderBottom:`1px solid ${css.border}`,
                  background:i%2===0?css.white:css.bg }}>
                  <td style={{ padding:"10px 16px", width:"60px" }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title}
                        style={{ width:"48px", height:"32px", objectFit:"cover",
                          borderRadius:"3px" }} />
                    ) : (
                      <div style={{ width:"48px", height:"32px",
                        background:css.accentBg, borderRadius:"3px" }} />
                    )}
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    <span style={hs.badgeGray}>{artistName}</span>
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    <a href={p.url} target="_blank" rel="noreferrer"
                      style={{ fontSize:"13px", fontWeight:500, color:css.text,
                        fontFamily:"system-ui", textDecoration:"none",
                        display:"block", maxWidth:"280px",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {p.title}
                    </a>
                  </td>
                  <td style={{ padding:"10px 16px", fontSize:"12px",
                    color:css.textSub, fontFamily:"system-ui" }}>
                    {p.source || "—"}
                  </td>
                  <td style={{ padding:"10px 16px", fontSize:"12px",
                    color:css.textSub, fontFamily:"system-ui" }}>
                    {p.published_at
                      ? new Date(p.published_at).toLocaleDateString("es",{
                          day:"numeric", month:"short", year:"numeric"
                        })
                      : "—"}
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    <button onClick={() => deletePress(p.id)} style={hs.btnDanger}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length===0 && (
          <div style={{ padding:"40px", textAlign:"center" }}>
            <p style={{ fontSize:"13px", color:css.textMute, fontFamily:"system-ui" }}>
              Sin artículos de prensa aún
            </p>
          </div>
        )}
      </div>
    </div>
  );
}