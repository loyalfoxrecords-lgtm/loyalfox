"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { css, hs } from "./styles";

type Track = {
  id: string; name: string; artist: string; artist_slug: string;
  genre: string; bpm: number; duration: string;
  description: string; slug: string; image_url: string;
  url_spotify: string; url_apple: string; url_beatport: string;
};

const empty = {
  name:"", artist:"", artist_slug:"", genre:"", bpm:0, duration:"",
  description:"", slug:"", image_url:"",
  url_spotify:"", url_apple:"", url_beatport:"",
};

function toSlug(s: string) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

export default function AdminTracks() {
  const [tracks, setTracks]     = useState<Track[]>([]);
  const [form, setForm]         = useState(empty);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editForm, setEditForm] = useState(empty);
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch]     = useState("");

  const load = async () => {
    const { data } = await supabase.from("tracks").select("*")
      .order("created_at", { ascending:false });
    if (data) setTracks(data);
  };
  useEffect(() => { load(); }, []);

  const uploadImage = async (file: File, onDone: (url:string)=>void) => {
    setUploading(true);
    const ext  = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("tracks").upload(path, file, { upsert:true });
    if (error) { alert("Error al subir imagen"); setUploading(false); return; }
    const { data } = supabase.storage.from("tracks").getPublicUrl(path);
    onDone(data.publicUrl);
    setUploading(false);
  };

  const addTrack = async () => {
    if (!form.name || !form.artist) { alert("Nombre y artista son obligatorios"); return; }
    setLoading(true);
    const slug = form.slug || toSlug(`${form.name}-${form.artist}`);
    const { error } = await supabase.from("tracks").insert({ ...form, slug });
    if (error) alert("Error: "+error.message);
    else { setForm(empty); await load(); }
    setLoading(false);
  };

  const saveEdit = async (id: string) => {
    setLoading(true);
    const slug = editForm.slug || toSlug(`${editForm.name}-${editForm.artist}`);
    const { error } = await supabase.from("tracks").update({ ...editForm, slug }).eq("id", id);
    if (error) alert("Error: "+error.message);
    else { setEditingId(null); await load(); }
    setLoading(false);
  };

  const deleteTrack = async (id: string) => {
    if (!confirm("¿Eliminar este track?")) return;
    await supabase.from("tracks").delete().eq("id", id);
    await load();
  };

  const filtered = tracks.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.artist.toLowerCase().includes(search.toLowerCase())
  );

  const TrackForm = ({ data, onChange, onUpload }: {
    data: typeof empty;
    onChange: (d: typeof empty) => void;
    onUpload: (url: string) => void;
  }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
        <div>
          <label style={hs.formLabel}>Nombre del track *</label>
          <input placeholder="Nombre" value={data.name}
            onChange={e => onChange({...data, name:e.target.value,
              slug: data.slug || toSlug(`${e.target.value}-${data.artist}`) })}
            style={hs.input} />
        </div>
        <div>
          <label style={hs.formLabel}>Artista *</label>
          <input placeholder="Nombre del artista" value={data.artist}
            onChange={e => onChange({...data, artist:e.target.value})}
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
          </select>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
          <div>
            <label style={hs.formLabel}>BPM</label>
            <input type="number" placeholder="128" value={data.bpm||""}
              onChange={e => onChange({...data, bpm:+e.target.value})}
              style={hs.input} />
          </div>
          <div>
            <label style={hs.formLabel}>Duración</label>
            <input placeholder="5:32" value={data.duration}
              onChange={e => onChange({...data, duration:e.target.value})}
              style={hs.input} />
          </div>
        </div>
        <div>
          <label style={hs.formLabel}>Slug (URL)</label>
          <input placeholder="nombre-track" value={data.slug}
            onChange={e => onChange({...data, slug:e.target.value})}
            style={hs.input} />
        </div>
        <div>
          <label style={hs.formLabel}>Slug del artista</label>
          <input placeholder="nombre-artista" value={data.artist_slug}
            onChange={e => onChange({...data, artist_slug:e.target.value})}
            style={hs.input} />
        </div>
      </div>

      <div>
        <label style={hs.formLabel}>Descripción</label>
        <textarea placeholder="Descripción del track..." value={data.description}
          onChange={e => onChange({...data, description:e.target.value})}
          style={{...hs.input, minHeight:"72px", resize:"vertical" as any}} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"12px" }}>
        <div>
          <label style={hs.formLabel}>Spotify URL</label>
          <input placeholder="https://open.spotify.com/..." value={data.url_spotify}
            onChange={e => onChange({...data, url_spotify:e.target.value})}
            style={hs.input} />
        </div>
        <div>
          <label style={hs.formLabel}>Apple Music URL</label>
          <input placeholder="https://music.apple.com/..." value={data.url_apple}
            onChange={e => onChange({...data, url_apple:e.target.value})}
            style={hs.input} />
        </div>
        <div>
          <label style={hs.formLabel}>Beatport URL</label>
          <input placeholder="https://www.beatport.com/..." value={data.url_beatport}
            onChange={e => onChange({...data, url_beatport:e.target.value})}
            style={hs.input} />
        </div>
      </div>

      {/* Imagen */}
      <div>
        <label style={hs.formLabel}>Artwork / Portada</label>
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <div style={{ width:"64px", height:"64px", borderRadius:"6px",
            background:css.bg, border:`1px solid ${css.border}`,
            overflow:"hidden", flexShrink:0 }}>
            {data.image_url ? (
              <img src={data.image_url} alt="cover"
                style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            ) : (
              <div style={{ width:"100%", height:"100%", display:"flex",
                alignItems:"center", justifyContent:"center",
                fontSize:"20px", color:css.textMute }}>♪</div>
            )}
          </div>
          <div style={{ flex:1 }}>
            <label style={{ display:"inline-flex", alignItems:"center", gap:"6px",
              padding:"7px 14px", borderRadius:"6px", cursor:"pointer",
              border:`1px solid ${css.border}`, background:css.white,
              fontSize:"13px", fontWeight:500, color:css.text,
              fontFamily:"system-ui" }}>
              {uploading ? "Subiendo..." : "Subir imagen"}
              <input type="file" accept="image/*" style={{ display:"none" }}
                disabled={uploading}
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) uploadImage(f, onUpload);
                }} />
            </label>
            {data.image_url && (
              <p style={{ fontSize:"11px", color:css.green, marginTop:"4px",
                fontFamily:"system-ui" }}>✓ Imagen subida</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:"1100px" }}>
      <p style={hs.subtitle}>Gestiona el catálogo de tracks del sello</p>

      {/* Formulario añadir */}
      <div style={{ ...hs.section, marginBottom:"24px" }}>
        <div style={hs.sectionHeader}>
          <p style={hs.cardTitle}>Añadir track</p>
        </div>
        <div style={{ padding:"20px" }}>
          <TrackForm
            data={form}
            onChange={setForm}
            onUpload={(url) => setForm(f => ({...f, image_url:url}))} />
          <div style={{ marginTop:"16px" }}>
            <button onClick={addTrack} disabled={loading||uploading}
              style={{ ...hs.btnGreen, opacity:(loading||uploading)?0.7:1 }}>
              {loading?"Guardando...":"Añadir track"}
            </button>
          </div>
        </div>
      </div>

      {/* Lista */}
      <div style={hs.section}>
        <div style={hs.sectionHeader}>
          <p style={hs.cardTitle}>Tracks ({tracks.length})</p>
          <input placeholder="Buscar track o artista..."
            value={search} onChange={e => setSearch(e.target.value)}
            style={{...hs.input, width:"240px"}} />
        </div>

        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:css.bg }}>
              {["","Track","Artista","Género","BPM","Links",""].map((h,i) => (
                <th key={i} style={{ padding:"10px 16px", textAlign:"left",
                  fontSize:"11px", fontWeight:500, color:css.textMute,
                  fontFamily:"system-ui", borderBottom:`1px solid ${css.border}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((track, i) => (
              <>
                <tr key={track.id} style={{ borderBottom:`1px solid ${css.border}`,
                  background:i%2===0?css.white:css.bg }}>
                  <td style={{ padding:"10px 16px", width:"48px" }}>
                    <div style={{ width:"40px", height:"40px", borderRadius:"4px",
                      overflow:"hidden", background:css.accentBg, flexShrink:0 }}>
                      {track.image_url ? (
                        <img src={track.image_url} alt={track.name}
                          style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      ) : (
                        <div style={{ width:"100%", height:"100%", display:"flex",
                          alignItems:"center", justifyContent:"center",
                          fontSize:"16px", color:css.textMute }}>♪</div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    <p style={{ fontSize:"13px", fontWeight:500,
                      color:css.text, fontFamily:"system-ui" }}>{track.name}</p>
                    <p style={{ fontSize:"11px", color:css.textMute,
                      fontFamily:"system-ui" }}>{track.duration}</p>
                  </td>
                  <td style={{ padding:"10px 16px", fontSize:"13px",
                    color:css.textSub, fontFamily:"system-ui" }}>{track.artist}</td>
                  <td style={{ padding:"10px 16px" }}>
                    {track.genre && (
                      <span style={hs.badgeGray}>{track.genre}</span>
                    )}
                  </td>
                  <td style={{ padding:"10px 16px", fontSize:"13px",
                    color:css.textSub, fontFamily:"system-ui" }}>
                    {track.bpm > 0 ? `${track.bpm} BPM` : "—"}
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    <div style={{ display:"flex", gap:"6px" }}>
                      {track.url_spotify && (
                        <a href={track.url_spotify} target="_blank" rel="noreferrer"
                          style={{ fontSize:"11px", color:css.green,
                            fontFamily:"system-ui", textDecoration:"none",
                            padding:"2px 6px", background:css.greenBg,
                            borderRadius:"4px", border:`1px solid ${css.greenBorder}` }}>
                          Spotify
                        </a>
                      )}
                      {track.url_apple && (
                        <a href={track.url_apple} target="_blank" rel="noreferrer"
                          style={{ fontSize:"11px", color:css.textSub,
                            fontFamily:"system-ui", textDecoration:"none",
                            padding:"2px 6px", background:css.bg,
                            borderRadius:"4px", border:`1px solid ${css.border}` }}>
                          Apple
                        </a>
                      )}
                      {track.url_beatport && (
                        <a href={track.url_beatport} target="_blank" rel="noreferrer"
                          style={{ fontSize:"11px", color:css.blue,
                            fontFamily:"system-ui", textDecoration:"none",
                            padding:"2px 6px", background:css.blueBg,
                            borderRadius:"4px", border:`1px solid ${css.blueBorder}` }}>
                          Beatport
                        </a>
                      )}
                    </div>
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    <div style={{ display:"flex", gap:"6px" }}>
                      <button
                        onClick={() => {
                          if (editingId===track.id) { setEditingId(null); return; }
                          setEditingId(track.id);
                          setEditForm({
                            name:track.name, artist:track.artist,
                            artist_slug:track.artist_slug||"",
                            genre:track.genre||"", bpm:track.bpm||0,
                            duration:track.duration||"",
                            description:track.description||"",
                            slug:track.slug||"", image_url:track.image_url||"",
                            url_spotify:track.url_spotify||"",
                            url_apple:track.url_apple||"",
                            url_beatport:track.url_beatport||"",
                          });
                        }}
                        style={hs.btnSmall}>
                        {editingId===track.id?"Cancelar":"Editar"}
                      </button>
                      <button onClick={() => deleteTrack(track.id)}
                        style={hs.btnDanger}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
                {editingId===track.id && (
                  <tr key={`edit-${track.id}`}>
                    <td colSpan={7} style={{ padding:"20px 24px",
                      background:css.blueBg,
                      borderBottom:`1px solid ${css.border}` }}>
                      <TrackForm
                        data={editForm}
                        onChange={setEditForm}
                        onUpload={(url) => setEditForm(f => ({...f, image_url:url}))} />
                      <div style={{ display:"flex", gap:"8px", marginTop:"16px" }}>
                        <button onClick={() => saveEdit(track.id)} disabled={loading}
                          style={{ ...hs.btnGreen, opacity:loading?0.7:1 }}>
                          {loading?"Guardando...":"Guardar cambios"}
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
              {search ? "Sin resultados" : "Sin tracks. Añade el primero arriba."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}