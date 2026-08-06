"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { css, hs } from "./styles";

type Streamer = {
  id: string; name: string; slug: string; bio: string;
  image_url: string; platform: string; channel_url: string;
  spotify_playlist_url: string; followers: string;
};

const empty = {
  name:"", slug:"", bio:"", image_url:"",
  platform:"Twitch", channel_url:"",
  spotify_playlist_url:"", followers:"",
};

function toSlug(s: string) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

const PLATFORMS = ["Twitch","YouTube","Kick","TikTok","Otro"];

// ─── FORMULARIO fuera del componente principal ───
function StreamerForm({ data, onChange, onUpload, uploading }: {
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
          <input placeholder="Nombre del streamer" value={data.name}
            onChange={e => onChange({...data, name:e.target.value,
              slug: data.slug || toSlug(e.target.value) })}
            style={hs.input} />
        </div>
        <div>
          <label style={hs.formLabel}>Slug (URL)</label>
          <input placeholder="nombre-streamer" value={data.slug}
            onChange={e => onChange({...data, slug:e.target.value})}
            style={hs.input} />
        </div>
        <div>
          <label style={hs.formLabel}>Plataforma</label>
          <select value={data.platform}
            onChange={e => onChange({...data, platform:e.target.value})}
            style={{...hs.input, appearance:"none" as any}}>
            {PLATFORMS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label style={hs.formLabel}>Seguidores</label>
          <input placeholder="ej: 12.5K" value={data.followers}
            onChange={e => onChange({...data, followers:e.target.value})}
            style={hs.input} />
        </div>
        <div>
          <label style={hs.formLabel}>URL del canal</label>
          <input placeholder="https://twitch.tv/..." value={data.channel_url}
            onChange={e => onChange({...data, channel_url:e.target.value})}
            style={hs.input} />
        </div>
        <div>
          <label style={hs.formLabel}>Playlist de Spotify</label>
          <input placeholder="https://open.spotify.com/playlist/..." value={data.spotify_playlist_url}
            onChange={e => onChange({...data, spotify_playlist_url:e.target.value})}
            style={hs.input} />
        </div>
      </div>
      <div>
        <label style={hs.formLabel}>Bio</label>
        <textarea placeholder="Descripción del streamer..." value={data.bio}
          onChange={e => onChange({...data, bio:e.target.value})}
          style={{...hs.input, minHeight:"72px", resize:"vertical" as any}} />
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
                fontSize:"20px", color:css.textMute }}>◎</div>
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

export default function AdminStreamers() {
  const [streamers, setStreamers] = useState<Streamer[]>([]);
  const [form, setForm]           = useState(empty);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editForm, setEditForm]   = useState(empty);
  const [loading, setLoading]     = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("streamers").select("*")
      .order("name", { ascending:true });
    if (data) setStreamers(data);
  };
  useEffect(() => { load(); }, []);

  const uploadImage = async (file: File, onDone: (url:string)=>void) => {
    setUploading(true);
    const ext  = file.name.split(".").pop();
    const path = `streamer-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("streamers").upload(path, file, { upsert:true });
    if (error) { alert("Error al subir imagen"); setUploading(false); return; }
    const { data } = supabase.storage.from("streamers").getPublicUrl(path);
    onDone(data.publicUrl);
    setUploading(false);
  };

  const addStreamer = async () => {
    if (!form.name) { alert("El nombre es obligatorio"); return; }
    setLoading(true);
    const slug = form.slug || toSlug(form.name);
    const { error } = await supabase.from("streamers").insert({ ...form, slug });
    if (error) alert("Error: "+error.message);
    else { setForm(empty); await load(); }
    setLoading(false);
  };

  const saveEdit = async (id: string) => {
    setLoading(true);
    const slug = editForm.slug || toSlug(editForm.name);
    await supabase.from("streamers").update({ ...editForm, slug }).eq("id", id);
    setEditingId(null); await load(); setLoading(false);
  };

  const deleteStreamer = async (id: string) => {
    if (!confirm("¿Eliminar este streamer?")) return;
    await supabase.from("streamers").delete().eq("id", id);
    await load();
  };

  return (
    <div style={{ maxWidth:"1000px" }}>
      <p style={hs.subtitle}>Perfiles públicos de streamers colaboradores</p>

      <div style={{ ...hs.section, marginBottom:"24px" }}>
        <div style={hs.sectionHeader}>
          <p style={hs.cardTitle}>Añadir streamer</p>
        </div>
        <div style={{ padding:"20px" }}>
          <StreamerForm
            data={form}
            onChange={setForm}
            uploading={uploading}
            onUpload={(file) => uploadImage(file, (url) => setForm(f => ({...f, image_url:url})))} />
          <div style={{ marginTop:"16px" }}>
            <button onClick={addStreamer} disabled={loading||uploading}
              style={{ ...hs.btnGreen, opacity:(loading||uploading)?0.7:1 }}>
              {loading?"Guardando...":"Añadir streamer"}
            </button>
          </div>
        </div>
      </div>

      <div style={hs.section}>
        <div style={hs.sectionHeader}>
          <p style={hs.cardTitle}>Streamers ({streamers.length})</p>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:css.bg }}>
              {["","Streamer","Plataforma","Playlist",""].map((h,i) => (
                <th key={i} style={{ padding:"10px 16px", textAlign:"left",
                  fontSize:"11px", fontWeight:500, color:css.textMute,
                  fontFamily:"system-ui", borderBottom:`1px solid ${css.border}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {streamers.map((s, i) => (
              <>
                <tr key={s.id} style={{ borderBottom:`1px solid ${css.border}`,
                  background:i%2===0?css.white:css.bg }}>
                  <td style={{ padding:"10px 16px", width:"48px" }}>
                    <div style={{ width:"40px", height:"40px", borderRadius:"50%",
                      overflow:"hidden", background:css.accentBg }}>
                      {s.image_url ? (
                        <img src={s.image_url} alt={s.name}
                          style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      ) : (
                        <div style={{ width:"100%", height:"100%", display:"flex",
                          alignItems:"center", justifyContent:"center",
                          fontSize:"16px", fontWeight:700, color:css.text }}>
                          {s.name[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    <p style={{ fontSize:"13px", fontWeight:500, color:css.text, fontFamily:"system-ui" }}>{s.name}</p>
                    <p style={{ fontSize:"11px", color:css.textMute, fontFamily:"system-ui" }}>/streamers/{s.slug}</p>
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    <span style={hs.badgeGray}>{s.platform}</span>
                    {s.followers && (
                      <p style={{ fontSize:"11px", color:css.textMute, marginTop:"2px", fontFamily:"system-ui" }}>
                        {s.followers} seguidores
                      </p>
                    )}
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    {s.spotify_playlist_url ? (
                      <a href={s.spotify_playlist_url} target="_blank" rel="noreferrer"
                        style={{ fontSize:"11px", color:css.green, fontFamily:"system-ui",
                          textDecoration:"none", padding:"2px 6px",
                          background:css.greenBg, borderRadius:"4px",
                          border:`1px solid ${css.greenBorder}` }}>✓ Spotify</a>
                    ) : (
                      <span style={{ fontSize:"12px", color:css.textMute, fontFamily:"system-ui" }}>Sin playlist</span>
                    )}
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    <div style={{ display:"flex", gap:"6px" }}>
                      <button onClick={() => {
                        if(editingId===s.id){ setEditingId(null); return; }
                        setEditingId(s.id);
                        setEditForm({
                          name:s.name, slug:s.slug||"", bio:s.bio||"",
                          image_url:s.image_url||"", platform:s.platform||"Twitch",
                          channel_url:s.channel_url||"",
                          spotify_playlist_url:s.spotify_playlist_url||"",
                          followers:s.followers||"",
                        });
                      }} style={hs.btnSmall}>
                        {editingId===s.id?"Cancelar":"Editar"}
                      </button>
                      <button onClick={() => deleteStreamer(s.id)} style={hs.btnDanger}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
                {editingId===s.id && (
                  <tr key={`edit-${s.id}`}>
                    <td colSpan={5} style={{ padding:"20px 24px",
                      background:css.blueBg, borderBottom:`1px solid ${css.border}` }}>
                      <StreamerForm
                        data={editForm}
                        onChange={setEditForm}
                        uploading={uploading}
                        onUpload={(file) => uploadImage(file, (url) => setEditForm(f => ({...f, image_url:url})))} />
                      <div style={{ display:"flex", gap:"8px", marginTop:"16px" }}>
                        <button onClick={() => saveEdit(s.id)} disabled={loading}
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
        {streamers.length===0 && (
          <div style={{ padding:"40px", textAlign:"center" }}>
            <p style={{ fontSize:"13px", color:css.textMute, fontFamily:"system-ui" }}>
              Sin streamers. Añade el primero arriba.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
