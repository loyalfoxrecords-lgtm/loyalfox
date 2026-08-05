"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
}

export default function ImageUpload({ value, onChange, folder = "general" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setPreview(data.publicUrl);
      onChange(data.publicUrl);
    }
    setUploading(false);
  };

  return (
    <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
      {/* Preview */}
      <div
        onClick={() => inputRef.current?.click()}
        style={{ width:"72px", height:"72px", flexShrink:0, background:"#0e0e0e",
          border:"1px dashed #333", display:"flex", alignItems:"center", justifyContent:"center",
          cursor:"pointer", overflow:"hidden", position:"relative", transition:"border-color .2s" }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#39ff14")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#333")}
      >
        {preview ? (
          <img src={preview} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
        ) : (
          <span style={{ fontSize:"22px", color:"#333" }}>+</span>
        )}
        {uploading && (
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.7)",
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
              color:"#39ff14", letterSpacing:"1px" }}>...</span>
          </div>
        )}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"6px", flex:1 }}>
        <button type="button" onClick={() => inputRef.current?.click()}
          style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px", letterSpacing:"2px",
            textTransform:"uppercase", padding:"8px 16px", background:"transparent",
            border:"1px solid #333", color:"#555", cursor:"pointer", transition:"all .2s", alignSelf:"flex-start" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#39ff14"; e.currentTarget.style.color = "#39ff14"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#333"; e.currentTarget.style.color = "#555"; }}>
          {uploading ? "Subiendo..." : preview ? "Cambiar imagen" : "Subir imagen"}
        </button>
        {preview && (
          <button type="button" onClick={() => { setPreview(""); onChange(""); }}
            style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px", letterSpacing:"1px",
              textTransform:"uppercase", padding:"6px 12px", background:"transparent",
              border:"1px solid #2a1010", color:"#ff4444", cursor:"pointer", alignSelf:"flex-start" }}>
            Eliminar
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" style={{ display:"none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
    </div>
  );
}