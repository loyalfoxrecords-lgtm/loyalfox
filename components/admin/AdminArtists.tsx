"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { css, hs } from "./styles";

type Artist = {
  id: string; name: string; slug: string; genre: string;
  bio: string; image_url: string;
  url_spotify: string; url_instagram: string; url_soundcloud: string;
};

const empty = {
  name:"", slug:"", genre:"", bio:"", image_url:"",
  url_spotify:"", url_instagram:"", url_soundcloud:"",
};

function toSlug(s: string) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

// ─── FORMULARIO fuera del componente principal ───
function ArtistForm({ data, onChange, onUpload, uploading }: {
  data: typeof empty;
  onChange: (d: typeof empty) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
        <div>
          <label style={hs.formLabel}>Nombre *</label>
          <input placeholder="Nombre artístico" value={data.name}
            onChange={e => onChange({...data, name:e.target.value,
              slug: data.slug || toSlug(e.target.value) })}
            style={hs.input} />
        </div>
        <div>
          <label style={hs.formLabel}>Slug (URL)</label>
          <input placeholder="nombre-artista" value={data.slug}
            onChange={e => onChange({...data, slug:e.target.value})}
            style={hs.input} />
        </div>
        <div>
          <label style={hs.formLabel}>Género</label>
          <select value={data.genre}
            onChange={e => onChange({...data, genre:e.target.value})}
            style={{...hs.input, appearance:"none" as any}}>
            <option value="">Seleccionar...</option>
            <option>House</option>
            <option>Deep House</option>
            <option>Techno</option>
            <option>Ambient</option>
            <option>Melodic House</option>
            <option>Afro House</option>
            <option>Organic House</option>
            <option>Progressive House</option>
          </select>
        </div>
        <div>
          <label style={hs.formLabel}>Instagram</label>
          <input placeholder="https://instagram.com/..." value={data.url_instagram}
            onChange={e => onChange({...data, url_instagram:e.target.value})}
            style={hs.input} />
        </div>
        <div>
          <label style={hs.formLabel}>Spotify</label>
          <input placeholder="https://open.spotify.com/artist/..." value={data.url_spotify}
            onChange={e => onChange({...data, url_spotify:e.target.value})}
            style={hs.input} />
        </div>
        <div>
          <label style={hs.formLabel}>SoundCloud</label>
          <input placeholder="https://soundcloud.com/..." value={data.url_soundcloud}
            onChange={e => onChange({...data, url_soundcloud:e.target.value})}
            style={hs.input} />
        </div>
      </div>
      <div>
        <label style={hs.formLabel}>Bio</label>
        <textarea placeholder="Biografía del artista..." value={data.bio}
          onChange={e => onChange({...data, bio:e.target.value})}
          style={{...hs.input, minHeight:"80px", resize:"vertical" as any}} />
      </div>
      <div>
        <label style={hs.formLabel}>Foto</label>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <div style={{ width:"64px", height:"64px", borderRadius:"50%",
            background:css.bg, border:`1px solid ${css.border}`,
            overflow:"hidden", flexShrink:0 }}>
            {data.image_url ? (
              <img src={data.image_url} alt="foto"
                style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            ) : (
              <div style={{ width:"100%", height:"100%", display:"flex",
                alignItems:"center", justifyContent:"center",
                fontSize:"20px", color:css.textMute }}>◉</div>
            )}
          </div>
          <label style={{ display:"inline-flex", alignItems:"center", gap:"6px",
            padding:"7px 14px", borderRadius:"6px", cursor:"pointer",
            border:`1px solid ${css.border}`, background:css.white,
            fontSize:"13px", fontWeight:500, color:css.text, fontFamily:"system-ui" }}>
            {uploading?"Subiendo...":"Subir foto"}
            <input type="file" accept="image/*" style={{ display:"none" }}
              disabled={uploading}
              onChange={e => { const f=e.target.files?.[0]; if(f) onUpload(f); }} />
          </label>
          {data.image_url && (
            <p style={{ fontSize:"11px", color:css.green, fontFamily:"system-ui" }}>✓ Lista</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminArtists() {
  const [artists, setArtists]     = useState<Artist[]>([]);
  const [form, setForm]           = useState(empty);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editForm, setEditForm]   = useState(empty);
  const [loading, setLoading]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch]       = useState("");

  const load = async () => {
    const { data } = await supabase.from("artists").select("*")
      .order("name", { ascending:true });
    if (data) setArtists(data);
  };
  useEffect(() => { load(); }, []);

  const uploadImage = async (file: File, onDone: (url:string)=>void) => {
    setUploading(true);
    const ext  = file.name.split(".").pop();
    const path = `artist-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("artists").upload(path, file, { upsert:true });
    if (error) { alert("Error al subir imagen"); setUploading(false); return; }
    const { data } = supabase.storage.from("artists").getPublicUrl(path);
    onDone(data.publicUrl);
    setUploading(false);
  };

  const addArtist = async () => {
    if (!form.name) { alert("El nombre es obligatorio"); return; }
    setLoading(true);
    const slug = form.slug || toSlug(form.name);
    const { error } = await supabase.from("artists").insert({ ...form, slug });
    if (error) alert("Error: "+error.message);
    else { setForm(empty); await load(); }
    setLoading(false);
  };

  const saveEdit = async (id: string) => {
    setLoading(true);
    const slug = editForm.slug || toSlug(editForm.name);
    await supabase.from("artists").update({ ...editForm, slug }).eq("id", id);
    setEditingId(null); await load(); setLoading(false);
  };

  const deleteArtist = async (id: string) => {
    if (!confirm("¿Eliminar este artista?")) return;
    await supabase.from("artists").delete().eq("id", id);
    await load();
  };

  const filtered = artists.filter(a =>
    !search || a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth:"1000px" }}>
      <p style={hs.subtitle}>Perfiles públicos de artistas del sello</p>

      <div style={{ ...hs.section, marginBottom:"24px" }}>
        <div style={hs.sectionHeader}>
          <p style={hs.cardTitle}>Añadir artista</p>
        </div>
        <div style={{ padding:"20px" }}>
          <ArtistForm
            data={form}
            onChange={setForm}
            uploading={uploading}
            onUpload={(file) => uploadImage(file, (url) => setForm(f => ({...f, image_url:url})))} />
          <div style={{ marginTop:"16px" }}>
            <button onClick={addArtist} disabled={loading||uploading}
              style={{ ...hs.btnGreen, opacity:(loading||uploading)?0.7:1 }}>
              {loading?"Guardando...":"Añadir artista"}
            </button>
          </div>
        </div>
      </div>

      <div style={hs.section}>
        <div style={hs.sectionHeader}>
          <p style={hs.cardTitle}>Artistas ({artists.length})</p>
          <input placeholder="Buscar artista..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{...hs.input, width:"200px"}} />
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:css.bg }}>
              {["","Artista","Género","Redes",""].map((h,i) => (
                <th key={i} style={{ padding:"10px 16px", textAlign:"left",
                  fontSize:"11px", fontWeight:500, color:css.textMute,
                  fontFamily:"system-ui", borderBottom:`1px solid ${css.border}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((artist, i) => (
              <>
                <tr key={artist.id} style={{ borderBottom:`1px solid ${css.border}`,
                  background:i%2===0?css.white:css.bg }}>
                  <td style={{ padding:"10px 16px", width:"48px" }}>
                    <div style={{ width:"40px", height:"40px", borderRadius:"50%",
                      overflow:"hidden", background:css.accentBg }}>
                      {artist.image_url ? (
                        <img src={artist.image_url} alt={artist.name}
                          style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      ) : (
                        <div style={{ width:"100%", height:"100%", display:"flex",
                          alignItems:"center", justifyContent:"center",
                          fontSize:"16px", fontWeight:700, color:css.text }}>
                          {artist.name[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    <p style={{ fontSize:"13px", fontWeight:500, color:css.text, fontFamily:"system-ui" }}>{artist.name}</p>
                    <p style={{ fontSize:"11px", color:css.textMute, fontFamily:"system-ui" }}>/artists/{artist.slug}</p>
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    {artist.genre && <span style={hs.badgeGray}>{artist.genre}</span>}
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    <div style={{ display:"flex", gap:"6px" }}>
                      {artist.url_spotify && (
                        <a href={artist.url_spotify} target="_blank" rel="noreferrer"
                          style={{ fontSize:"11px", color:css.green, fontFamily:"system-ui",
                            textDecoration:"none", padding:"2px 6px",
                            background:css.greenBg, borderRadius:"4px",
                            border:`1px solid ${css.greenBorder}` }}>Spotify</a>
                      )}
                      {artist.url_instagram && (
                        <a href={artist.url_instagram} target="_blank" rel="noreferrer"
                          style={{ fontSize:"11px", color:css.purple, fontFamily:"system-ui",
                            textDecoration:"none", padding:"2px 6px",
                            background:css.purpleBg, borderRadius:"4px",
                            border:`1px solid ${css.purpleBorder}` }}>Instagram</a>
                      )}
                    </div>
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    <div style={{ display:"flex", gap:"6px" }}>
                      <button onClick={() => {
                        if(editingId===artist.id){ setEditingId(null); return; }
                        setEditingId(artist.id);
                        setEditForm({
                          name:artist.name, slug:artist.slug||"",
                          genre:artist.genre||"", bio:artist.bio||"",
                          image_url:artist.image_url||"",
                          url_spotify:artist.url_spotify||"",
                          url_instagram:artist.url_instagram||"",
                          url_soundcloud:artist.url_soundcloud||"",
                        });
                      }} style={hs.btnSmall}>
                        {editingId===artist.id?"Cancelar":"Editar"}
                      </button>
                      <button onClick={() => deleteArtist(artist.id)} style={hs.btnDanger}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
                {editingId===artist.id && (
                  <tr key={`edit-${artist.id}`}>
                    <td colSpan={5} style={{ padding:"20px 24px",
                      background:css.blueBg, borderBottom:`1px solid ${css.border}` }}>
                      <ArtistForm
                        data={editForm}
                        onChange={setEditForm}
                        uploading={uploading}
                        onUpload={(file) => uploadImage(file, (url) => setEditForm(f => ({...f, image_url:url})))} />
                      <div style={{ display:"flex", gap:"8px", marginTop:"16px" }}>
                        <button onClick={() => saveEdit(artist.id)} disabled={loading}
                          style={{ ...hs.btnGreen, opacity:loading?0.7:1 }}>
                          {loading?"Guardando...":"Guardar"}
                        </button>
                        <button onClick={() => setEditingId(null)} style={hs.btnSmall}>
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {filtered.length===0 && (
          <div style={{ padding:"40px", textAlign:"center" }}>
            <p style={{ fontSize:"13px", color:css.textMute, fontFamily:"system-ui" }}>
              {search?"Sin resultados":"Sin artistas. Añade el primero arriba."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
