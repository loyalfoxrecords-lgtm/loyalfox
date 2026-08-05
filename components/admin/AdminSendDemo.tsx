"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { css, hs } from "./styles";

const SLOTS = [
  { id:"hero",        label:"Hero (imagen de fondo principal)" },
  { id:"benefit_01",  label:"01 · Distribución global"         },
  { id:"benefit_02",  label:"02 · Presencia en YouTube"        },
  { id:"benefit_03",  label:"03 · Prensa digital"              },
  { id:"benefit_04",  label:"04 · Sin contrato de artista"     },
  { id:"benefit_05",  label:"05 · Radio digital"               },
  { id:"benefit_06",  label:"06 · Biografía online"            },
  { id:"benefit_07",  label:"07 · Playlists del sello"         },
  { id:"benefit_08",  label:"08 · Dashboard de artista"        },
  { id:"benefit_09",  label:"09 · Regalías justas"             },
];

export default function AdminSendDemo() {
  const [images, setImages]     = useState<Record<string,string>>({});
  const [uploading, setUploading] = useState<string|null>(null);

  const load = async () => {
    const { data } = await supabase.from("send_demo_images").select("id, url");
    if (!data) return;
    const map: Record<string,string> = {};
    data.forEach(r => { map[r.id] = r.url; });
    setImages(map);
  };
  useEffect(() => { load(); }, []);

  const uploadImage = async (slotId: string, file: File) => {
    setUploading(slotId);
    const ext  = file.name.split(".").pop();
    const path = `${slotId}.${ext}`;
    const { error } = await supabase.storage
      .from("send-demo").upload(path, file, { upsert:true });
    if (error) { alert("Error al subir: "+error.message); setUploading(null); return; }
    const { data: urlData } = supabase.storage.from("send-demo").getPublicUrl(path);
    await supabase.from("send_demo_images")
      .upsert({ id:slotId, url:urlData.publicUrl, updated_at:new Date().toISOString() });
    await load();
    setUploading(null);
  };

  const removeImage = async (slotId: string) => {
    if (!confirm("¿Eliminar esta imagen?")) return;
    await supabase.from("send_demo_images")
      .upsert({ id:slotId, url:"", updated_at:new Date().toISOString() });
    await load();
  };

  return (
    <div style={{ maxWidth:"900px" }}>
      <p style={hs.subtitle}>
        Gestiona las imágenes de la página "Enviar Demo". Si no hay imagen, se usa una por defecto.
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
        {SLOTS.map((slot) => {
          const url  = images[slot.id] || "";
          const busy = uploading === slot.id;
          return (
            <div key={slot.id} style={{ ...hs.section }}>
              <div style={hs.sectionHeader}>
                <p style={hs.cardTitle}>{slot.label}</p>
              </div>
              <div style={{ padding:"16px" }}>
                {/* Preview */}
                <div style={{ width:"100%", aspectRatio:"16/9",
                  borderRadius:"6px", overflow:"hidden", marginBottom:"12px",
                  background:css.bg, border:`1px solid ${css.border}`,
                  position:"relative" }}>
                  {url ? (
                    <img src={url} alt={slot.label}
                      style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  ) : (
                    <div style={{ width:"100%", height:"100%",
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <p style={{ fontSize:"12px", color:css.textMute,
                        fontFamily:"system-ui" }}>Sin imagen — se usa por defecto</p>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div style={{ display:"flex", gap:"8px" }}>
                  <label style={{ flex:1, display:"inline-flex", alignItems:"center",
                    justifyContent:"center", gap:"6px", padding:"8px 14px",
                    borderRadius:"6px", cursor:busy?"not-allowed":"pointer",
                    background:busy?css.accentBg:css.text, color:busy?css.textMute:"#fff",
                    fontSize:"12px", fontWeight:500, fontFamily:"system-ui",
                    transition:"all .15s" }}>
                    {busy ? "Subiendo..." : "📤 Subir imagen"}
                    <input type="file" accept="image/*" style={{ display:"none" }}
                      disabled={busy}
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) uploadImage(slot.id, f);
                      }} />
                  </label>
                  {url && (
                    <button onClick={() => removeImage(slot.id)}
                      style={{ ...hs.btnDanger, padding:"8px 12px" }}>
                      Eliminar
                    </button>
                  )}
                </div>

                {url && (
                  <p style={{ fontSize:"10px", color:css.green, marginTop:"8px",
                    fontFamily:"system-ui" }}>✓ Imagen personalizada activa</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}