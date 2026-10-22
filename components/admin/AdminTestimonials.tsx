"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { compressImage } from "@/lib/image";
import { css, hs } from "./styles";

type T = { id: string; name: string; role: string; quote: string; image_url: string; track_url: string; published: boolean; sort_order: number };
const empty = { name: "", role: "", quote: "", image_url: "", track_url: "", published: true, sort_order: 0 };

function Form({ initial, onSave, onCancel }: { initial: Partial<T>; onSave: (d: any) => Promise<void>; onCancel?: () => void }) {
  const [d, setD] = useState({ ...empty, ...initial });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const blob = await compressImage(file, 400, 0.85);
      const path = `testimonial-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("artists").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      setD(x => ({ ...x, image_url: supabase.storage.from("artists").getPublicUrl(path).data.publicUrl }));
    } catch { alert("Error al subir la imagen"); }
    setUploading(false);
  };

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div><label style={hs.formLabel}>Nombre *</label>
          <input value={d.name} onChange={e => setD({ ...d, name: e.target.value })} style={hs.input} /></div>
        <div><label style={hs.formLabel}>Rol (p. ej. "Artista, Deep House")</label>
          <input value={d.role} onChange={e => setD({ ...d, role: e.target.value })} style={hs.input} /></div>
      </div>
      <div><label style={hs.formLabel}>Cita * (debe ser real y con permiso del artista)</label>
        <textarea value={d.quote} onChange={e => setD({ ...d, quote: e.target.value })}
          style={{ ...hs.input, minHeight: "70px", resize: "vertical" as any }} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div><label style={hs.formLabel}>Enlace a su track (opcional)</label>
          <input value={d.track_url} onChange={e => setD({ ...d, track_url: e.target.value })} style={hs.input} placeholder="https://open.spotify.com/..." /></div>
        <div><label style={hs.formLabel}>Orden</label>
          <input type="number" value={d.sort_order} onChange={e => setD({ ...d, sort_order: Number(e.target.value) })} style={hs.input} /></div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        {d.image_url && <img src={d.image_url} alt="" width={40} height={40} style={{ borderRadius: "50%", objectFit: "cover" }} />}
        <label style={{ fontFamily: "system-ui", fontSize: "13px", padding: "6px 12px", border: `1px solid ${css.border}`, borderRadius: "6px", cursor: "pointer", background: css.white }}>
          {uploading ? "Subiendo…" : d.image_url ? "Cambiar foto" : "Subir foto"}
          <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); }} />
        </label>
        <label style={{ fontFamily: "system-ui", fontSize: "13px", color: css.textSub, display: "flex", gap: "6px", alignItems: "center" }}>
          <input type="checkbox" checked={d.published} onChange={e => setD({ ...d, published: e.target.checked })} /> Publicado
        </label>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button disabled={saving || !d.name || !d.quote} style={{ ...hs.btnGreen, opacity: saving || !d.name || !d.quote ? 0.5 : 1 }}
          onClick={async () => { setSaving(true); await onSave(d); setSaving(false); if (!initial.id) setD({ ...empty }); }}>
          {saving ? "Guardando…" : initial.id ? "Guardar cambios" : "Añadir testimonio"}
        </button>
        {onCancel && <button style={hs.btnSmall} onClick={onCancel}>Cancelar</button>}
      </div>
    </div>
  );
}

export default function AdminTestimonials() {
  const [items, setItems] = useState<T[]>([]);
  const [editing, setEditing] = useState<string | null>(null);

  const load = async () => {
    const r = await fetch("/api/admin/testimonials");
    if (r.ok) setItems(await r.json());
  };
  useEffect(() => { load(); }, []);

  const save = async (d: any) => {
    const r = await fetch("/api/admin/testimonials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    if (!r.ok) alert("Error al guardar");
    setEditing(null);
    await load();
  };
  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este testimonio?")) return;
    await fetch("/api/admin/testimonials", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
  };

  return (
    <div style={{ maxWidth: "900px" }}>
      <p style={hs.subtitle}>Citas de artistas que se muestran en la web. Publica solo testimonios reales y con permiso.</p>
      <div style={{ ...hs.section, marginBottom: "24px" }}>
        <div style={hs.sectionHeader}><p style={hs.cardTitle}>Nuevo testimonio</p></div>
        <Form initial={{}} onSave={save} />
      </div>
      <div style={hs.section}>
        <div style={hs.sectionHeader}><p style={hs.cardTitle}>Testimonios ({items.length})</p></div>
        {items.length === 0 && <p style={{ fontFamily: "system-ui", fontSize: "13px", color: css.textMute, padding: "28px", textAlign: "center" }}>Aún no hay testimonios. La sección de la web mostrará solo las cifras reales.</p>}
        {items.map(it => (
          <div key={it.id} style={{ borderTop: `1px solid ${css.borderLight}` }}>
            {editing === it.id ? (
              <Form initial={it} onSave={save} onCancel={() => setEditing(null)} />
            ) : (
              <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontFamily: "system-ui", fontSize: "13px", fontWeight: 600, color: css.text }}>
                    {it.name} <span style={{ fontWeight: 400, color: css.textMute }}>{it.role && `· ${it.role}`}</span>
                    {!it.published && <span style={{ marginLeft: "8px", fontSize: "11px", color: css.yellow }}>borrador</span>}
                  </p>
                  <p style={{ fontFamily: "system-ui", fontSize: "12px", color: css.textSub, marginTop: "4px", lineHeight: 1.6 }}>“{it.quote}”</p>
                </div>
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button style={hs.btnSmall} onClick={() => setEditing(it.id)}>Editar</button>
                  <button style={hs.btnDanger} onClick={() => remove(it.id)}>Eliminar</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
