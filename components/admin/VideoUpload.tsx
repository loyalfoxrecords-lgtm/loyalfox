"use client";
import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  value: string;
  onChange: (url: string) => void;
}

export default function VideoUpload({ value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setProgress(0);
    const ext = file.name.split(".").pop();
    const path = `videos/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("videos").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("videos").getPublicUrl(path);
      onChange(data.publicUrl);
      setProgress(100);
    }
    setUploading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          padding:"20px",
          border:`2px dashed ${value ? "#39ff14" : "#222"}`,
          background:"#0e0e0e",
          cursor:"pointer",
          textAlign:"center",
          transition:"border-color .2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#39ff14")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = value ? "#39ff14" : "#222")}
      >
        {uploading ? (
          <div>
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
              color:"#39ff14", letterSpacing:"1px", marginBottom:"8px" }}>
              Subiendo...
            </p>
            <div style={{ height:"2px", background:"#222", borderRadius:"2px" }}>
              <div style={{ height:"100%", background:"#39ff14", width:`${progress}%`,
                transition:"width .3s", borderRadius:"2px" }} />
            </div>
          </div>
        ) : value ? (
          <div>
            <video
              src={value}
              style={{ maxWidth:"100%", maxHeight:"120px" }}
              controls
            />
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
              color:"#39ff14", marginTop:"8px", letterSpacing:"1px" }}>
              ✓ Vídeo subido — clic para cambiar
            </p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize:"24px", marginBottom:"8px" }}>🎬</p>
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
              color:"#555", letterSpacing:"1px" }}>
              Clic para subir vídeo
            </p>
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
              color:"#333", marginTop:"4px" }}>
              MP4, MOV, WEBM · Máx 500MB
            </p>
          </div>
        )}
      </div>

      {value && (
        <button
          onClick={() => onChange("")}
          style={{
            fontFamily:"'Share Tech Mono',monospace",
            fontSize:"9px",
            letterSpacing:"1px",
            textTransform:"uppercase",
            padding:"6px",
            background:"transparent",
            border:"1px solid #2a1010",
            color:"#ff4444",
            cursor:"pointer",
          }}>
          Eliminar vídeo
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        style={{ display:"none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
      />
    </div>
  );
}