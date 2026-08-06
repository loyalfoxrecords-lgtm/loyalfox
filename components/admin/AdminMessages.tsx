"use client";
import { useEffect, useState, useRef } from "react";
import { css, hs } from "./styles";

type Message = {
  id: string;
  artist_account_id: string;
  artist_name: string;
  sender: "artist" | "admin";
  message: string;
  read: boolean;
  created_at: string;
};

export default function AdminMessages() {
  const [messages, setMessages]       = useState<Message[]>([]);
  const [artists, setArtists]         = useState<{id:string; name:string; unread:number}[]>([]);
  const [selectedId, setSelectedId]   = useState<string|null>(null);
  const [reply, setReply]             = useState("");
  const [sending, setSending]         = useState(false);
  const [loading, setLoading]         = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const res  = await fetch("/api/admin/messages");
    const data = await res.json();
    setMessages(data);

    // Agrupar por artista
    const map: Record<string, {id:string; name:string; unread:number}> = {};
    data.forEach((m: Message) => {
      if (!map[m.artist_account_id]) {
        map[m.artist_account_id] = { id:m.artist_account_id, name:m.artist_name, unread:0 };
      }
      if (m.sender==="artist" && !m.read) map[m.artist_account_id].unread++;
    });
    setArtists(Object.values(map));
    setLoading(false);
  };

  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (selectedId) {
      fetch("/api/admin/messages", {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ artist_account_id:selectedId }),
      }).then(() => load());
    }
  }, [selectedId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, selectedId]);

  const thread = messages.filter(m => m.artist_account_id===selectedId);
  const selectedArtist = artists.find(a => a.id===selectedId);

  const sendReply = async () => {
    if (!reply.trim() || !selectedId) return;
    setSending(true);
    await fetch("/api/admin/messages", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        artist_account_id: selectedId,
        artist_name: selectedArtist?.name,
        message: reply.trim(),
      }),
    });
    setReply("");
    await load();
    setSending(false);
  };

  const fmtTime = (d: string) => {
    const date = new Date(d);
    const now  = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return "Ahora";
    if (diff < 3600000) return `${Math.floor(diff/60000)}m`;
    if (diff < 86400000) return date.toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"});
    return date.toLocaleDateString("es",{day:"numeric",month:"short"});
  };

  return (
    <div style={{ display:"flex", height:"calc(100vh - 120px)", gap:"0",
      border:`1px solid ${css.border}`, borderRadius:"8px", overflow:"hidden",
      background:css.white }}>

      {/* Lista de artistas */}
      <div style={{ width:"280px", borderRight:`1px solid ${css.border}`,
        display:"flex", flexDirection:"column", flexShrink:0 }}>
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${css.border}` }}>
          <p style={{ fontFamily:"system-ui", fontSize:"13px", fontWeight:600, color:css.text }}>
            Mensajes
          </p>
          <p style={{ fontFamily:"system-ui", fontSize:"12px", color:css.textMute, marginTop:"2px" }}>
            {artists.length} conversaciones
          </p>
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {loading ? (
            <p style={{ fontFamily:"system-ui", fontSize:"13px", color:css.textMute,
              padding:"24px", textAlign:"center" }}>Cargando...</p>
          ) : artists.length===0 ? (
            <p style={{ fontFamily:"system-ui", fontSize:"13px", color:css.textMute,
              padding:"24px", textAlign:"center" }}>Sin mensajes aún</p>
          ) : artists.map(a => {
            const lastMsg = [...messages].reverse().find(m => m.artist_account_id===a.id);
            return (
              <div key={a.id}
                onClick={() => setSelectedId(a.id)}
                style={{ padding:"14px 20px", cursor:"pointer", transition:"background .1s",
                  background: selectedId===a.id ? css.bg : css.white,
                  borderBottom:`1px solid ${css.borderLight}` }}
                onMouseEnter={e => { if(selectedId!==a.id)(e.currentTarget as HTMLElement).style.background=css.bg; }}
                onMouseLeave={e => { if(selectedId!==a.id)(e.currentTarget as HTMLElement).style.background=css.white; }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <div style={{ width:"32px", height:"32px", borderRadius:"50%",
                      background:css.accent, display:"flex", alignItems:"center",
                      justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontFamily:"system-ui", fontSize:"13px",
                        fontWeight:700, color:css.white }}>
                        {a.name[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontFamily:"system-ui", fontSize:"13px",
                        fontWeight:600, color:css.text }}>{a.name}</p>
                      {lastMsg && (
                        <p style={{ fontFamily:"system-ui", fontSize:"11px",
                          color:css.textMute, marginTop:"1px",
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                          maxWidth:"160px" }}>
                          {lastMsg.sender==="admin"?"Tú: ":""}{lastMsg.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"4px" }}>
                    {lastMsg && (
                      <span style={{ fontFamily:"system-ui", fontSize:"10px", color:css.textMute }}>
                        {fmtTime(lastMsg.created_at)}
                      </span>
                    )}
                    {a.unread > 0 && (
                      <span style={{ width:"18px", height:"18px", borderRadius:"50%",
                        background:css.accent, display:"flex", alignItems:"center",
                        justifyContent:"center", fontFamily:"system-ui",
                        fontSize:"10px", fontWeight:700, color:css.white }}>
                        {a.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat */}
      {!selectedId ? (
        <div style={{ flex:1, display:"flex", alignItems:"center",
          justifyContent:"center", flexDirection:"column", gap:"8px" }}>
          <p style={{ fontFamily:"system-ui", fontSize:"24px" }}>💬</p>
          <p style={{ fontFamily:"system-ui", fontSize:"13px", color:css.textMute }}>
            Selecciona una conversación
          </p>
        </div>
      ) : (
        <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
          {/* Header */}
          <div style={{ padding:"14px 20px", borderBottom:`1px solid ${css.border}`,
            display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"50%",
              background:css.accent, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontFamily:"system-ui", fontSize:"14px",
                fontWeight:700, color:css.white }}>
                {selectedArtist?.name[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <p style={{ fontFamily:"system-ui", fontSize:"14px",
                fontWeight:600, color:css.text }}>{selectedArtist?.name}</p>
              <p style={{ fontFamily:"system-ui", fontSize:"11px", color:css.textMute }}>
                Portal de artistas
              </p>
            </div>
          </div>

          {/* Mensajes */}
          <div style={{ flex:1, overflowY:"auto", padding:"20px",
            display:"flex", flexDirection:"column", gap:"12px" }}>
            {thread.length===0 && (
              <p style={{ fontFamily:"system-ui", fontSize:"13px", color:css.textMute,
                textAlign:"center", padding:"40px" }}>
                Sin mensajes aún. Escribe el primero.
              </p>
            )}
            {thread.map(m => (
              <div key={m.id} style={{ display:"flex",
                justifyContent: m.sender==="admin" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth:"70%" }}>
                  <div style={{
                    padding:"10px 14px", borderRadius: m.sender==="admin"
                      ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                    background: m.sender==="admin" ? css.accent : css.bg,
                    border: m.sender==="admin" ? "none" : `1px solid ${css.border}`,
                  }}>
                    <p style={{ fontFamily:"system-ui", fontSize:"13px", lineHeight:1.6,
                      color: m.sender==="admin" ? css.white : css.text, margin:0 }}>
                      {m.message}
                    </p>
                  </div>
                  <p style={{ fontFamily:"system-ui", fontSize:"10px", color:css.textMute,
                    marginTop:"4px", textAlign: m.sender==="admin" ? "right" : "left" }}>
                    {fmtTime(m.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding:"16px 20px", borderTop:`1px solid ${css.border}`,
            display:"flex", gap:"10px", alignItems:"flex-end" }}>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); sendReply(); }}}
              placeholder="Escribe una respuesta... (Enter para enviar)"
              rows={2}
              style={{ flex:1, padding:"10px 12px", border:`1px solid ${css.border}`,
                borderRadius:"8px", fontFamily:"system-ui", fontSize:"13px",
                color:css.text, resize:"none", outline:"none",
                background:css.white, transition:"border-color .15s" }}
              onFocus={e => e.currentTarget.style.borderColor=css.accent}
              onBlur={e => e.currentTarget.style.borderColor=css.border}
            />
            <button onClick={sendReply} disabled={sending || !reply.trim()}
              style={{ ...hs.btnGreen, opacity:(sending||!reply.trim())?0.5:1,
                height:"42px", paddingLeft:"20px", paddingRight:"20px" }}>
              {sending?"...":"Enviar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
