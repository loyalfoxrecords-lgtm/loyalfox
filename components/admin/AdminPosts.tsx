"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { hs } from "./styles";
import ImageUpload from "./ImageUpload";

type Post = { id: string; title: string; excerpt: string; tag: string; date: string; slug: string; image_url: string };
const empty = { title:"", excerpt:"", tag:"", date:"", slug:"", image_url:"" };

export default function AdminPosts() {
  const [items, setItems]     = useState<Post[]>([]);
  const [form, setForm]       = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setLoading(true);
    if (editing) {
      await supabase.from("posts").update(form).eq("id", editing);
      setEditing(null);
    } else {
      await supabase.from("posts").insert(form);
    }
    setForm(empty);
    await load();
    setLoading(false);
  };

  const del = async (id: string) => {
    if (!confirm("¿Eliminar?")) return;
    await supabase.from("posts").delete().eq("id", id);
    await load();
  };

  const edit = (p: Post) => {
    setEditing(p.id);
    setForm({ title: p.title, excerpt: p.excerpt, tag: p.tag, date: p.date, slug: p.slug, image_url: p.image_url });
  };

  return (
    <div>
      <h2 style={hs.title}>Noticias</h2>

      <div style={{ ...hs.form, flexDirection:"column", alignItems:"stretch" }}>
        <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
          <input placeholder="Título" value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={{ ...hs.input, flex:2 }} />
          <input placeholder="Tag (ej: LANZAMIENTO)" value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
            style={hs.input} />
          <input placeholder="Fecha (ej: ENE 2025)" value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            style={hs.input} />
          <input placeholder="Slug (ej: nuevo-ep-2025)" value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            style={hs.input} />
        </div>

        <textarea placeholder="Extracto / descripción" value={form.excerpt}
          onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          style={{ ...hs.input, resize:"vertical", minHeight:"80px" }} />

        <div>
          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px", letterSpacing:"2px",
            textTransform:"uppercase", color:"#555", marginBottom:"8px" }}>Imagen destacada</p>
          <ImageUpload
            value={form.image_url}
            onChange={(url) => setForm({ ...form, image_url: url })}
            folder="posts"
          />
        </div>

        <div style={{ display:"flex", gap:"8px" }}>
          <button onClick={save} disabled={loading} style={hs.btnGreen}>
            {editing ? "Guardar" : "Añadir"}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm(empty); }} style={hs.btnGhost}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
        {items.map((p) => (
          <div key={p.id} style={hs.row}>
            {p.image_url ? (
              <img src={p.image_url} alt="" style={{ width:"48px", height:"48px", objectFit:"cover", flexShrink:0 }} />
            ) : (
              <div style={{ width:"48px", height:"48px", background:"#161616", flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:"18px", color:"#333" }}>✦</span>
              </div>
            )}
            <div style={{ flex:1 }}>
              <p style={hs.rowName}>{p.title}</p>
              <p style={hs.rowSub}>{p.date} · {p.tag} · /{p.slug}</p>
            </div>
            <div style={{ display:"flex", gap:"8px" }}>
              <button onClick={() => edit(p)} style={hs.btnSmall}>Editar</button>
              <button onClick={() => del(p.id)} style={{ ...hs.btnSmall, color:"#ff4444", borderColor:"#ff4444" }}>Eliminar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}