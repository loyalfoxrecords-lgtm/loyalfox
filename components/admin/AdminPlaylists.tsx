"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { css, hs } from "./styles";

type Playlist = {
  id: string; name: string; description: string;
  image_url: string; slug: string;
};

const empty = { name:"", description:"", image_url:"", slug:"" };

function toSlug(s: string) {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}

export default function AdminPlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [form, setForm]           = useState(empty);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editForm, setEditForm]   = useState(empty);
  const [loading, setLoading]     = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("playlists").select("*")
      .order("created_at", { ascending:false });
    if (data) setPlaylists(data);
  };
  useEffect(() => { load(); }, []);

  const uploadImage = async (file: File, onDone: (url:string)=>void) => {
    setUploading(true);
    const ext  = file.name.split(".").pop();
    const path = `pl-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("playlists").upload(path, file, { upsert:true });
    if (error) { alert("Error al subir imagen"); setUploading(false); return; }
    const { data } = supabase.storage.from("playlists").getPublicUrl(path);
    onDone(data.publicUrl);
    setUploading(false);
  };

  const addPlaylist = async () => {
    if (!form.name) { alert("El nombre es obligatorio"); return; }
    setLoading(true);
    const slug = form.slug || toSlug(form.name);
    const { error } = await supabase.from("playlists").insert({ ...form, slug });
    if (error) alert("Error: "+error.message);
    else { setForm(empty); await load(); }
    setLoading(false);
  };

  const saveEdit = async (id: string) => {
    setLoading(true);
    const slug = editForm.slug || toSlug(editForm.name);
    await supabase.from("playlists").update({ ...editForm, slug }).eq("id", id);
    setEditingId(null); await load(); setLoading(false);
  };

  const deletePlaylist = async (id: string) => {
    if (!confirm("¿Eliminar esta playlist?")) return;
    await supabase.from("playlists").delete().eq("id", id);
    await load();
  };

  const PlaylistForm = ({ data, onChange, onUpload }: {
    data: typeof empty;
    onChange: (d: typeof empty) => void;
    onUpload: (url: string) => void;
  }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
        <div>
          <label style={hs.formLabel}>Nombre *</label>
          <input placeholder="Nombre de la playlist" value={data.name}
            onChange={e => onChange({...data, name:e.target.value,
              slug: data.slug || toSlug(e.target.value) })}
            style={hs.input} />
        </div>
        <div>
          <label style={hs.formLabel}>Slug (URL)</label>
          <input placeholder="nombre-playlist" value={data.slug}
            onChange={e => onChange({...data, slug:e.target.value})}
            style={hs.input} />
        </div>
      </div>
      <div>
        <label style={hs.formLabel}>Descripción</label>
        <textarea placeholder="Descripción de la playlist..." value={data.description}
          onChange={e => onChange({...data, description:e.target.value})}
          style={{...hs.input, minHeight:"72px", resize:"vertical" as any}} />
      </div>
      <div>
        <label style={hs.formLabel}>Imagen de portada</label>
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
                fontSize:"20px", color:css.textMute }}>♫</div>
            )}
          </div>
          <label style={{ display:"inline-flex", alignItems:"center", gap:"6px",
            padding:"7px 14px", borderRadius:"6px", cursor:"pointer",
            border:`1px solid ${css.border}`, background:css.white,
            fontSize:"13px", fontWeight:500, color:css.text, fontFamily:"system-ui" }}>
            {uploading?"Subiendo...":"Subir imagen"}
            <input type="file" accept="image/*" style={{ display:"none" }}
              disabled={uploading}
              onChange={e => { const f=e.target.files?.[0]; if(f) uploadImage(f,onUpload); }} />
          </label>
          {data.image_url && (
            <p style={{ fontSize:"11px", color:css.green, fontFamily:"system-ui" }}>✓ Lista</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:"900px" }}>
      <p style={hs.subtitle}>Gestiona las playlists del sello</p>

      <div style={{ ...hs.section, marginBottom:"24px" }}>
        <div style={hs.sectionHeader}>
          <p style={hs.cardTitle}>Nueva playlist</p>
        </div>
        <div style={{ padding:"20px" }}>
          <PlaylistForm data={form} onChange={setForm}
            onUpload={(url) => setForm(f => ({...f, image_url:url}))} />
          <div style={{ marginTop:"16px" }}>
            <button onClick={addPlaylist} disabled={loading||uploading}
              style={{ ...hs.btnGreen, opacity:(loading||uploading)?0.7:1 }}>
              {loading?"Guardando...":"Añadir playlist"}
            </button>
          </div>
        </div>
      </div>

      <div style={hs.section}>
        <div style={hs.sectionHeader}>
          <p style={hs.cardTitle}>Playlists ({playlists.length})</p>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:css.bg }}>
              {["","Nombre","Descripción",""].map((h,i) => (
                <th key={i} style={{ padding:"10px 16px", textAlign:"left",
                  fontSize:"11px", fontWeight:500, color:css.textMute,
                  fontFamily:"system-ui", borderBottom:`1px solid ${css.border}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {playlists.map((pl, i) => (
              <>
                <tr key={pl.id} style={{ borderBottom:`1px solid ${css.border}`,
                  background:i%2===0?css.white:css.bg }}>
                  <td style={{ padding:"10px 16px", width:"48px" }}>
                    <div style={{ width:"40px", height:"40px", borderRadius:"4px",
                      overflow:"hidden", background:css.accentBg }}>
                      {pl.image_url ? (
                        <img src={pl.image_url} alt={pl.name}
                          style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      ) : (
                        <div style={{ width:"100%", height:"100%", display:"flex",
                          alignItems:"center", justifyContent:"center",
                          fontSize:"16px", color:css.textMute }}>♫</div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    <p style={{ fontSize:"13px", fontWeight:500,
                      color:css.text, fontFamily:"system-ui" }}>{pl.name}</p>
                    <p style={{ fontSize:"11px", color:css.textMute,
                      fontFamily:"system-ui" }}>/{pl.slug}</p>
                  </td>
                  <td style={{ padding:"10px 16px", fontSize:"13px",
                    color:css.textSub, fontFamily:"system-ui",
                    maxWidth:"300px", overflow:"hidden",
                    textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {pl.description || "—"}
                  </td>
                  <td style={{ padding:"10px 16px" }}>
                    <div style={{ display:"flex", gap:"6px" }}>
                      <button onClick={() => {
                        if(editingId===pl.id){setEditingId(null);return;}
                        setEditingId(pl.id);
                        setEditForm({ name:pl.name, description:pl.description||"",
                          image_url:pl.image_url||"", slug:pl.slug||"" });
                      }} style={hs.btnSmall}>
                        {editingId===pl.id?"Cancelar":"Editar"}
                      </button>
                      <button onClick={() => deletePlaylist(pl.id)} style={hs.btnDanger}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
                {editingId===pl.id && (
                  <tr key={`edit-${pl.id}`}>
                    <td colSpan={4} style={{ padding:"20px 24px",
                      background:css.blueBg, borderBottom:`1px solid ${css.border}` }}>
                      <PlaylistForm data={editForm} onChange={setEditForm}
                        onUpload={(url) => setEditForm(f => ({...f, image_url:url}))} />
                      <div style={{ display:"flex", gap:"8px", marginTop:"16px" }}>
                        <button onClick={() => saveEdit(pl.id)} disabled={loading}
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
        {playlists.length===0 && (
          <div style={{ padding:"40px", textAlign:"center" }}>
            <p style={{ fontSize:"13px", color:css.textMute, fontFamily:"system-ui" }}>
              Sin playlists. Añade la primera arriba.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}