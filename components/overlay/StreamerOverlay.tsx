"use client";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

type Track = {
  id: string; name: string; artist: string;
  image_url: string; url_spotify: string; duration: string;
};
type Playlist = { id: string; name: string; image_url: string };

export default function StreamerOverlay({ token }: { token: string }) {
  const [streamer, setStreamer]         = useState<any>(null);
  const [playlists, setPlaylists]       = useState<Playlist[]>([]);
  const [tracks, setTracks]             = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState(true);
  const [progress, setProgress]         = useState(0);
  const [shuffle, setShuffle]           = useState(false);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
  supabase.from("streamer_accounts").select("*")
    .eq("overlay_token", token).single()
    .then(({ data, error }) => {
      console.log("token buscado:", token);
      console.log("data:", data);
      console.log("error:", error);
      if (data) setStreamer(data);
    });

  supabase.from("playlists").select("*").order("created_at", { ascending:false })
    .then(({ data }) => { if (data) setPlaylists(data); });
}, [token]);

  const startProgress = () => {
    setProgress(0);
    if (progressRef.current) clearInterval(progressRef.current);
    progressRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { return 0; }
        return p + 0.05;
      });
    }, 300);
  };

  const loadPlaylist = async (playlistId: string) => {
  const { data } = await supabase.from("tracks").select("*")
    .order("created_at", { ascending:false });
  if (data && data.length > 0) {
    setTracks(data);
    setCurrentIndex(0);
    setCurrentTrack(data[0]);
    setSelectedPlaylist(playlistId);
    setShowSelector(false);
    setIsPlaying(true);
    startProgress();
  }
};

  const nextTrack = (currentTracks = tracks, currentIdx = currentIndex) => {
    if (currentTracks.length === 0) return;
    const next = shuffle
      ? Math.floor(Math.random() * currentTracks.length)
      : (currentIdx + 1) % currentTracks.length;
    setCurrentIndex(next);
    setCurrentTrack(currentTracks[next]);
    setProgress(0);
    startProgress();
  };

  const prevTrack = () => {
    if (tracks.length === 0) return;
    const prev = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentIndex(prev);
    setCurrentTrack(tracks[prev]);
    setProgress(0);
    startProgress();
  };

  const selectTrack = (track: Track, index: number) => {
    setCurrentTrack(track);
    setCurrentIndex(index);
    setIsPlaying(true);
    startProgress();
  };

  const togglePlay = () => {
    setIsPlaying(p => {
      if (p) {
        if (progressRef.current) clearInterval(progressRef.current);
      } else {
        startProgress();
      }
      return !p;
    });
  };

  useEffect(() => {
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, []);

  if (!streamer) return (
    <div style={{ background:"transparent", minHeight:"100vh",
      display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"12px",
        color:"rgba(255,255,255,0.5)", letterSpacing:"2px" }}>Token inválido</p>
    </div>
  );

  return (
    <div style={{ background:"transparent", minHeight:"100vh",
      fontFamily:"'Share Tech Mono',monospace", position:"relative" }}>

      {/* Selector de playlist */}
      {showSelector && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)",
          display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", padding:"40px", zIndex:100 }}>
          <div style={{ marginBottom:"32px", textAlign:"center" }}>
            <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"28px",
              letterSpacing:"4px", color:"#e8e8e8", marginBottom:"4px" }}>
              LOYAL<span style={{ color:"#39ff14" }}>FOX</span>
            </p>
            <p style={{ fontSize:"10px", letterSpacing:"3px",
              textTransform:"uppercase", color:"#555" }}>
              Selecciona una playlist para empezar
            </p>
          </div>
          <div style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fill, minmax(160px,1fr))",
            gap:"12px", width:"100%", maxWidth:"600px" }}>
            {playlists.map((pl) => (
              <div key={pl.id} onClick={() => loadPlaylist(pl.id)}
                style={{ cursor:"pointer", padding:"16px", background:"#0e0e0e",
                  border:"1px solid #222", transition:"all .2s",
                  display:"flex", flexDirection:"column",
                  alignItems:"center", gap:"10px" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#39ff14"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#222"; }}>
                {pl.image_url ? (
                  <img src={pl.image_url} alt={pl.name}
                    style={{ width:"80px", height:"80px", objectFit:"cover" }} />
                ) : (
                  <div style={{ width:"80px", height:"80px", background:"#1a1a1a",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontSize:"24px" }}>♪</span>
                  </div>
                )}
                <p style={{ fontSize:"10px", letterSpacing:"1px",
                  textTransform:"uppercase", color:"#e8e8e8", textAlign:"center" }}>
                  {pl.name}
                </p>
              </div>
            ))}
            {playlists.length === 0 && (
              <p style={{ color:"#555", fontSize:"11px", letterSpacing:"1px",
                gridColumn:"1/-1", textAlign:"center" }}>
                No hay playlists disponibles
              </p>
            )}
          </div>
        </div>
      )}

      {/* Overlay principal — esquina inferior izquierda */}
      {currentTrack && !showSelector && (
        <div style={{ position:"fixed", bottom:"24px", left:"24px", zIndex:50 }}>

          {/* Card canción actual */}
          <div style={{ display:"flex", alignItems:"center",
            background:"rgba(6,6,6,0.92)", backdropFilter:"blur(12px)",
            border:"1px solid rgba(57,255,20,0.3)",
            boxShadow:"0 0 30px rgba(57,255,20,0.1)",
            overflow:"hidden", width:"340px" }}>

            {/* Portada */}
            <div style={{ position:"relative", flexShrink:0 }}>
              {currentTrack.image_url ? (
                <img src={currentTrack.image_url} alt={currentTrack.name}
                  style={{ width:"72px", height:"72px", objectFit:"cover",
                    display:"block",
                    filter: isPlaying ? "none" : "brightness(0.5)" }} />
              ) : (
                <div style={{ width:"72px", height:"72px", background:"#1a1a1a",
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <span style={{ fontSize:"28px" }}>♪</span>
                </div>
              )}
              {isPlaying && (
                <div style={{ position:"absolute", bottom:"4px", right:"4px",
                  display:"flex", alignItems:"flex-end", gap:"2px", height:"14px" }}>
                  {[4,8,12,6,10].map((h,i) => (
                    <div key={i} style={{ width:"3px", borderRadius:"2px",
                      background:"#39ff14", height:`${h}px`,
                      animation:`eq ${0.8 + i*0.15}s ease-in-out infinite alternate`,
                      boxShadow:"0 0 4px #39ff14" }} />
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ flex:1, padding:"10px 14px", overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"6px", marginBottom:"2px" }}>
                <div style={{ width:"4px", height:"4px", borderRadius:"50%",
                  background:"#39ff14", flexShrink:0,
                  boxShadow:"0 0 6px #39ff14" }} />
                <p style={{ fontSize:"8px", letterSpacing:"2px",
                  textTransform:"uppercase", color:"#39ff14" }}>
                  {isPlaying ? "En directo" : "Pausado"}
                </p>
              </div>
              <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"13px",
                color:"#e8e8e8", letterSpacing:"0.5px",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                marginBottom:"2px", lineHeight:1.2 }}>
                {currentTrack.name}
              </p>
              <p style={{ fontSize:"10px", color:"rgba(232,232,232,0.5)",
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {currentTrack.artist}
              </p>
              <div style={{ marginTop:"8px", height:"2px",
                background:"rgba(255,255,255,0.1)", borderRadius:"2px", overflow:"hidden" }}>
                <div style={{ height:"100%", background:"#39ff14",
                  width:`${progress}%`, transition:"width .3s linear",
                  boxShadow:"0 0 4px #39ff14" }} />
              </div>
            </div>

            {/* Logo */}
            <div style={{ padding:"0 12px", flexShrink:0 }}>
              <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"13px",
                letterSpacing:"2px", color:"rgba(57,255,20,0.6)" }}>LF</p>
            </div>
          </div>

          {/* Controles */}
          <div style={{ display:"flex", justifyContent:"center", gap:"4px",
            marginTop:"4px", padding:"6px 8px",
            background:"rgba(6,6,6,0.85)", backdropFilter:"blur(8px)",
            border:"1px solid rgba(57,255,20,0.1)" }}>
            <button onClick={prevTrack}
              style={{ background:"transparent", border:"none", color:"#555",
                cursor:"pointer", fontSize:"14px", padding:"4px 8px", transition:"color .2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#39ff14")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#555")}>
              ⏮
            </button>
            <button onClick={togglePlay}
              style={{ background:"transparent", border:"1px solid rgba(57,255,20,0.3)",
                color:"#39ff14", cursor:"pointer", fontSize:"14px",
                padding:"4px 12px", transition:"all .2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(57,255,20,0.1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button onClick={() => nextTrack()}
              style={{ background:"transparent", border:"none", color:"#555",
                cursor:"pointer", fontSize:"14px", padding:"4px 8px", transition:"color .2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#39ff14")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#555")}>
              ⏭
            </button>
            <button onClick={() => setShuffle(s => !s)}
              style={{ background:"transparent", border:"none",
                color: shuffle ? "#39ff14" : "#555",
                cursor:"pointer", fontSize:"12px", padding:"4px 8px", transition:"color .2s" }}>
              ⇄
            </button>
            <button onClick={() => setShowSelector(true)}
              style={{ background:"transparent", border:"none", color:"#555",
                cursor:"pointer", fontSize:"11px", padding:"4px 8px",
                letterSpacing:"1px", transition:"color .2s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "#e8e8e8")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "#555")}>
              ☰
            </button>
          </div>
        </div>
      )}

      {/* Lista de tracks lateral */}
      {!showSelector && tracks.length > 0 && (
        <div style={{ position:"fixed", right:"24px", top:"50%",
          transform:"translateY(-50%)", width:"220px", zIndex:50,
          background:"rgba(6,6,6,0.88)", backdropFilter:"blur(12px)",
          border:"1px solid rgba(57,255,20,0.15)",
          maxHeight:"60vh", overflowY:"auto" }}>
          <div style={{ padding:"10px 14px",
            borderBottom:"1px solid rgba(57,255,20,0.1)" }}>
            <p style={{ fontSize:"9px", letterSpacing:"2px",
              textTransform:"uppercase", color:"#555" }}>Playlist</p>
          </div>
          {tracks.map((tr, i) => (
            <div key={tr.id} onClick={() => selectTrack(tr, i)}
              style={{ display:"flex", alignItems:"center", gap:"10px",
                padding:"8px 14px", cursor:"pointer",
                background: currentIndex === i ? "rgba(57,255,20,0.08)" : "transparent",
                borderLeft: currentIndex === i ? "2px solid #39ff14" : "2px solid transparent",
                transition:"all .2s" }}
              onMouseEnter={(e) => { if (currentIndex !== i) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}
              onMouseLeave={(e) => { if (currentIndex !== i) (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
              {tr.image_url ? (
                <img src={tr.image_url} alt={tr.name}
                  style={{ width:"32px", height:"32px", objectFit:"cover", flexShrink:0 }} />
              ) : (
                <div style={{ width:"32px", height:"32px",
                  background:"#1a1a1a", flexShrink:0 }} />
              )}
              <div style={{ overflow:"hidden", flex:1 }}>
                <p style={{ fontSize:"10px",
                  color: currentIndex === i ? "#39ff14" : "#e8e8e8",
                  overflow:"hidden", textOverflow:"ellipsis",
                  whiteSpace:"nowrap", marginBottom:"2px" }}>{tr.name}</p>
                <p style={{ fontSize:"9px", color:"#555",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {tr.artist}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Share+Tech+Mono&display=swap');
        @keyframes eq {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(57,255,20,0.2); border-radius: 2px; }
      `}</style>
    </div>
  );
}