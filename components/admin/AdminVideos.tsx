"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { hs } from "./styles";
import ImageUpload from "./ImageUpload";
import VideoUpload from "./VideoUpload";

type Video = {
  id: string; title: string; artist: string; type: string;
  track_slug: string; thumbnail_url: string; video_url: string; notes: string;
};

const empty = {
  title:"", artist:"", type:"visualizer", track_slug:"",
  thumbnail_url:"", video_url:"", notes:""
};

const TYPE_LABELS: Record<string, string> = {
  visualizer: "Visualizer",
  lyric: "Lyric Video",
  clip: "Clip Preview",
};

export default function AdminVideos() {
  const [items, setItems]     = useState<Video[]>([]);
  const [form, setForm]       = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [filter, setFilter]   = useState("all");

  const load = async () => {
    const { data } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
    if (data) setItems(data);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setLoading(true);
    if (editing) {
      await supabase.from("videos").update(form).eq("id", editing);
      setEditing(null);
    } else {
      await supabase.from("videos").insert(form);
    }
    setForm(empty);
    await load();
    setLoading(false);
  };

  const del = async (id: string) => {
    if (!confirm("¿Eliminar vídeo?")) return;
    await supabase.from("videos").delete().eq("id", id);
    if (playing === id) setPlaying(null);
    await load();
  };

  const edit = (v: Video) => {
    setEditing(v.id);
    setForm({
      title:         v.title         ?? "",
      artist:        v.artist        ?? "",
      type:          v.type          ?? "visualizer",
      track_slug:    v.track_slug    ?? "",
      thumbnail_url: v.thumbnail_url ?? "",
      video_url:     v.video_url     ?? "",
      notes:         v.notes         ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filtered = filter === "all" ? items : items.filter((v) => v.type === filter);

  return (
    <div>
      <h2 style={hs.title}>Vídeos</h2>

      {/* Form */}
      <div style={{ ...hs.form, flexDirection:"column", alignItems:"stretch" }}>
        <div style={{ display:"flex", gap:"12px", flexWrap:"wrap" }}>
          <input
            placeholder="Título del vídeo"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={{ ...hs.input, flex:2 }}
          />
          <input
            placeholder="Artista"
            value={form.artist}
            onChange={(e) => setForm({ ...form, artist: e.target.value })}
            style={hs.input}
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            style={{ ...hs.input, width:"150px", flex:"none", appearance:"none" }}
          >
            <option value="visualizer">Visualizer</option>
            <option value="lyric">Lyric Video</option>
            <option value="clip">Clip Preview</option>
          </select>
          <input
            placeholder="Slug del track (opcional)"
            value={form.track_slug}
            onChange={(e) => setForm({ ...form, track_slug: e.target.value })}
            style={hs.input}
          />
        </div>

        <textarea
          placeholder="Notas internas (uso del vídeo, estado, plataformas...)"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          style={{ ...hs.input, resize:"vertical", minHeight:"60px" }}
        />

        <div>
          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
            letterSpacing:"2px", textTransform:"uppercase", color:"#555", marginBottom:"8px" }}>
            Thumbnail / Portada
          </p>
          <ImageUpload
            value={form.thumbnail_url}
            onChange={(url) => setForm({ ...form, thumbnail_url: url })}
            folder="video-thumbnails"
          />
        </div>

        <div>
          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
            letterSpacing:"2px", textTransform:"uppercase", color:"#555", marginBottom:"8px" }}>
            Archivo de vídeo
          </p>
          <VideoUpload
            value={form.video_url}
            onChange={(url) => setForm({ ...form, video_url: url })}
          />
        </div>

        <div style={{ display:"flex", gap:"8px" }}>
          <button onClick={save} disabled={loading} style={hs.btnGreen}>
            {editing ? "Guardar cambios" : "Añadir vídeo"}
          </button>
          {editing && (
            <button onClick={() => { setEditing(null); setForm(empty); }} style={hs.btnGhost}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:"flex", gap:"4px", marginBottom:"20px" }}>
        {["all", "visualizer", "lyric", "clip"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
              letterSpacing:"2px", textTransform:"uppercase", padding:"7px 16px",
              background: filter === f ? "rgba(57,255,20,0.08)" : "transparent",
              border: filter === f ? "1px solid #39ff14" : "1px solid #222",
              color: filter === f ? "#39ff14" : "#555", cursor:"pointer",
            }}>
            {f === "all" ? "Todos" : TYPE_LABELS[f]}
            {f !== "all" && (
              <span style={{ marginLeft:"6px", opacity:0.5 }}>
                {items.filter((v) => v.type === f).length}
              </span>
            )}
          </button>
        ))}
        <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
          color:"#333", alignSelf:"center", marginLeft:"auto" }}>
          {filtered.length} vídeos
        </span>
      </div>

      {/* Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:"2px" }}>
        {filtered.map((v) => (
          <div key={v.id} style={{ background:"#0e0e0e", overflow:"hidden", position:"relative" }}>

            {/* Player / Thumbnail */}
            <div style={{ position:"relative", aspectRatio:"16/9", background:"#060606", overflow:"hidden" }}>
              {playing === v.id && v.video_url ? (
                <video
                  src={v.video_url}
                  controls
                  autoPlay
                  style={{ width:"100%", height:"100%", objectFit:"cover" }}
                  onEnded={() => setPlaying(null)}
                />
              ) : (
                <>
                  {v.thumbnail_url ? (
                    <img src={v.thumbnail_url} alt={v.title}
                      style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                  ) : (
                    <div style={{ width:"100%", height:"100%", background:"#111",
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <span style={{ fontSize:"32px", opacity:0.3 }}>🎬</span>
                    </div>
                  )}
                  {v.video_url && (
                    <button
                      onClick={() => setPlaying(v.id)}
                      style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.4)",
                        border:"none", cursor:"pointer", display:"flex",
                        alignItems:"center", justifyContent:"center" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.6)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.4)")}>
                      <div style={{ width:"52px", height:"52px", borderRadius:"50%",
                        border:"2px solid #39ff14", background:"rgba(6,6,6,0.7)",
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ color:"#39ff14", fontSize:"20px", marginLeft:"4px" }}>▶</span>
                      </div>
                    </button>
                  )}
                </>
              )}

              {/* Type badge */}
              <div style={{ position:"absolute", top:"8px", left:"8px" }}>
                <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"8px",
                  letterSpacing:"1px", textTransform:"uppercase",
                  padding:"3px 8px", background:"rgba(6,6,6,0.85)",
                  color:"#39ff14", border:"1px solid rgba(57,255,20,0.3)" }}>
                  {TYPE_LABELS[v.type] || v.type}
                </span>
              </div>
            </div>

            {/* Info */}
            <div style={{ padding:"14px" }}>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"12px",
                color:"#e8e8e8", marginBottom:"4px", fontWeight:500 }}>{v.title}</p>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                color:"#555", marginBottom: v.notes ? "8px" : "0" }}>{v.artist}</p>
              {v.notes && (
                <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
                  color:"#333", lineHeight:1.6, borderTop:"1px solid #161616",
                  paddingTop:"8px", marginTop:"4px" }}>{v.notes}</p>
              )}
              <div style={{ display:"flex", gap:"6px", marginTop:"12px" }}>
                <button onClick={() => edit(v)} style={hs.btnSmall}>Editar</button>
                {playing === v.id ? (
                  <button onClick={() => setPlaying(null)}
                    style={{ ...hs.btnSmall, color:"#39ff14", borderColor:"#39ff14" }}>
                    ■ Stop
                  </button>
                ) : v.video_url ? (
                  <button onClick={() => setPlaying(v.id)}
                    style={{ ...hs.btnSmall, color:"#39ff14", borderColor:"rgba(57,255,20,0.3)" }}>
                    ▶ Play
                  </button>
                ) : null}
                <button onClick={() => del(v.id)}
                  style={{ ...hs.btnSmall, color:"#ff4444", borderColor:"#ff4444", marginLeft:"auto" }}>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding:"60px", textAlign:"center" }}>
          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
            color:"#333", letterSpacing:"2px" }}>
            SIN VÍDEOS — Añade el primero arriba
          </p>
        </div>
      )}
    </div>
  );
}