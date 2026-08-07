"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { css, hs } from "./styles";

const LOGO = "https://i.ibb.co/KjqCYGmY/descarga-1.png";

type Message = {
  id: string; artist_account_id: string; artist_name: string;
  sender: "artist"|"admin"; message: string; read: boolean; created_at: string;
};

export default function AdminMessages() {
  const [messages, setMessages]     = useState<Message[]>([]);
  const [artists, setArtists]       = useState<{id:string; name:string; unread:number; avatar:string}[]>([]);
  const [selectedId, setSelectedId] = useState<string|null>(null);
  const [reply, setReply]           = useState("");
  const [sending, setSending]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [selloLogo, setSelloLogo]   = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const res  = await fetch("/api/admin/messages");
    const data = await res.json();
    setMessages(data);

    // Obtener avatares de artistas
    const { data: accounts } = await supabase
      .from("artist_accounts")
      .select("id, artist_name, avatar_url");

    const map: Record<string, {id:string; name:string; unread:number; avatar:string}> = {};
    data.forEach((m: Message) => {
      if (!map[m.artist_account_id]) {
        const acc = accounts?.find(a => a.artist_name === m.artist_name);
        map[m.artist_account_id] = {
          id: m.artist_account_id, name: m.artist_name,
          unread: 0, avatar: acc?.avatar_url || "",
        };
      }
      if (m.sender==="artist" && !m.read) map[m.artist_account_id].unread++;
    });
    setArtists(Object.values(map));
    setLoading(false);
  };

  // Cargar logo del sello desde send_demo_images o usar el hardcoded
  useEffect(() => {
    supabase.from("send_demo_images").select("url").eq("id","hero").single()
      .then(({ data }) => {
        setSelloLogo(data?.url || LOGO);
      });
  }, []);

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
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return "Ahora";
    if (diff < 3600000) return `${Math.floor(diff/60000)}m`;
    if (diff < 86400000) return date.toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"});
    return date.toLocaleDateString("es",{day:"numeric",month:"short"});
  };

  const ArtistAvatar = ({ name, avatar, size=32 }: { name:string; avatar:string; size?:number }) => (
    <div style={{ width:`${size}px`, height:`${size}px`, borderRadius:"50%",
      overflow:"hidden", flexShrink:0, background:css.accentBg,
      border:`1.5px solid ${css.border}` }}>
      {avatar ? (
        <img src={avatar} alt={name}
          style={{ width:"100%", height:"100%", objectFit:"cover" }} />
      ) : (
        <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center",
          justifyContent:"center", fontFamily:"system-ui", fontSize:`${size*0.4}px`,
          fontWeight:700, color:css.text }}>
          {name[0]?.toUpperCase()}
        </div>
      )}
    </div>
  );

  const SelloAvatar = ({ size=32 }: { size?:number }) => (
    <div style={{ width:`${size}px`, height:`${size}px`, borderRadius:"50%",
      overflow:"hidden", flexShrink:0, background:"#111827",
      border:`1.5px solid #374151`, display:"flex", alignItems:"center",
      justifyContent:"center" }}>
      <img src={LOGO} alt="LoyalFox"
        style={{ width:"65%", height:"65%", objectFit:"contain",
          filter:"brightness(0) saturate(100%) invert(79%) sepia(40%) saturate(500%) hue-rotate(42deg) brightness(95%)" }} />
    </div>
  );

  return (
    <div style={{ display:"flex", height:"calc(100vh - 120px)", gap:"0",
      border:`1px solid ${css.border}`, borderRadius:"12px", overflow:"hidden",
      background:css.white, boxShadow:"0 4px 24px rgba(0,0,0,0.06)" }}>

      {/* Lista artistas */}
      <div style={{ width:"290px", borderRight:`1px solid ${css.border}`,
        display:"flex", flexDirection:"column", flexShrink:0, background:css.white }}>
        <div style={{ padding:"18px 20px", borderBottom:`1px solid ${css.border}` }}>
          <p style={{ fontFamily:"system-ui", fontSize:"15px", fontWeight:700, color:css.text }}>
            Mensajes
          </p>
          <p style={{ fontFamily:"system-ui", fontSize:"12px", color:css.textMute, marginTop:"2px" }}>
            {artists.length} conversación{artists.length!==1?"es":""}
          </p>
        </div>
        <div style={{ overflowY:"auto", flex:1 }}>
          {loading ? (
            <p style={{ fontFamily:"system-ui", fontSize:"13px", color:css.textMute,
              padding:"24px", textAlign:"center" }}>Cargando...</p>
          ) : artists.length===0 ? (
            <div style={{ padding:"40px 20px", textAlign:"center" }}>
              <p style={{ fontSize:"28px", marginBottom:"8px" }}>💬</p>
              <p style={{ fontFamily:"system-ui", fontSize:"13px", color:css.textMute }}>
                Sin mensajes aún
              </p>
            </div>
          ) : artists.map(a => {
            const lastMsg = [...messages].reverse().find(m => m.artist_account_id===a.id);
            const isSelected = selectedId===a.id;
            return (
              <div key={a.id} onClick={() => setSelectedId(a.id)}
                style={{ padding:"12px 16px", cursor:"pointer", transition:"background .1s",
                  background: isSelected ? "#f0f4ff" : css.white,
                  borderBottom:`1px solid ${css.borderLight}`,
                  borderLeft: isSelected ? `3px solid ${css.accent}` : "3px solid transparent" }}
                onMouseEnter={e => { if(!isSelected)(e.currentTarget as HTMLElement).style.background=css.bg; }}
                onMouseLeave={e => { if(!isSelected)(e.currentTarget as HTMLElement).style.background=css.white; }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px", flex:1, minWidth:0 }}>
                    <ArtistAvatar name={a.name} avatar={a.avatar} size={38} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontFamily:"system-ui", fontSize:"13px",
                        fontWeight:600, color:css.text, marginBottom:"2px" }}>{a.name}</p>
                      {lastMsg && (
                        <p style={{ fontFamily:"system-ui", fontSize:"11px", color:css.textMute,
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {lastMsg.sender==="admin" ? "Tú: " : ""}{lastMsg.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end",
                    gap:"4px", flexShrink:0, marginLeft:"8px" }}>
                    {lastMsg && (
                      <span style={{ fontFamily:"system-ui", fontSize:"10px", color:css.textMute }}>
                        {fmtTime(lastMsg.created_at)}
                      </span>
                    )}
                    {a.unread > 0 && (
                      <span style={{ minWidth:"18px", height:"18px", borderRadius:"9999px",
                        background:css.accent, padding:"0 5px",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontFamily:"system-ui", fontSize:"10px", fontWeight:700, color:css.white }}>
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
          justifyContent:"center", flexDirection:"column", gap:"12px",
          background:"linear-gradient(to bottom, #f8fafc, #f9fafb)" }}>
          <SelloAvatar size={56} />
          <p style={{ fontFamily:"system-ui", fontSize:"13px", color:css.textMute }}>
            Selecciona una conversación
          </p>
        </div>
      ) : (
        <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
          {/* Header */}
          <div style={{ padding:"14px 20px", borderBottom:`1px solid ${css.border}`,
            display:"flex", alignItems:"center", gap:"12px", background:css.white }}>
            <ArtistAvatar name={selectedArtist?.name||""} avatar={selectedArtist?.avatar||""} size={38} />
            <div style={{ flex:1 }}>
              <p style={{ fontFamily:"system-ui", fontSize:"14px",
                fontWeight:600, color:css.text }}>{selectedArtist?.name}</p>
              <p style={{ fontFamily:"system-ui", fontSize:"11px", color:css.textMute }}>
                Portal de artistas
              </p>
            </div>
          </div>

          {/* Mensajes */}
          <div style={{ flex:1, overflowY:"auto", padding:"20px",
            display:"flex", flexDirection:"column", gap:"12px",
            background:"linear-gradient(to bottom, #f8fafc, #f9fafb)" }}>
            {thread.length===0 && (
              <div style={{ flex:1, display:"flex", alignItems:"center",
                justifyContent:"center", padding:"40px" }}>
                <p style={{ fontFamily:"system-ui", fontSize:"13px", color:css.textMute }}>
                  Sin mensajes aún. Escribe el primero.
                </p>
              </div>
            )}
            {thread.map((m, idx) => {
              const isAdmin = m.sender==="admin";
              const showDate = idx===0 ||
                new Date(m.created_at).toDateString() !== new Date(thread[idx-1].created_at).toDateString();
              return (
                <div key={m.id}>
                  {showDate && (
                    <div style={{ textAlign:"center", margin:"8px 0" }}>
                      <span style={{ fontFamily:"system-ui", fontSize:"10px", color:css.textMute,
                        background:"rgba(0,0,0,0.06)", padding:"3px 10px", borderRadius:"9999px" }}>
                        {new Date(m.created_at).toLocaleDateString("es",{weekday:"short",day:"numeric",month:"short"})}
                      </span>
                    </div>
                  )}
                  <div style={{ display:"flex", justifyContent:isAdmin?"flex-end":"flex-start",
                    alignItems:"flex-end", gap:"8px" }}>
                    {!isAdmin && <ArtistAvatar name={selectedArtist?.name||""} avatar={selectedArtist?.avatar||""} size={28} />}
                    <div style={{ maxWidth:"68%", display:"flex", flexDirection:"column",
                      alignItems:isAdmin?"flex-end":"flex-start", gap:"3px" }}>
                      <div style={{
                        padding:"10px 14px",
                        borderRadius:isAdmin?"18px 18px 4px 18px":"18px 18px 18px 4px",
                        background:isAdmin?css.accent:css.white,
                        border:isAdmin?"none":`1px solid ${css.border}`,
                        boxShadow:isAdmin?"0 2px 8px rgba(0,0,0,0.12)":"0 1px 4px rgba(0,0,0,0.06)",
                      }}>
                        <p style={{ fontFamily:"system-ui", fontSize:"13px", lineHeight:1.6,
                          color:isAdmin?css.white:css.text, margin:0 }}>
                          {m.message}
                        </p>
                      </div>
                      <p style={{ fontFamily:"system-ui", fontSize:"10px", color:css.textMute }}>
                        {fmtTime(m.created_at)}{isAdmin && " ✓"}
                      </p>
                    </div>
                    {isAdmin && <SelloAvatar size={28} />}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding:"14px 16px", borderTop:`1px solid ${css.border}`,
            background:css.white, display:"flex", gap:"10px", alignItems:"flex-end" }}>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendReply();} }}
              placeholder="Escribe una respuesta... (Enter para enviar)"
              rows={1}
              style={{ flex:1, padding:"10px 14px",
                border:`1.5px solid ${css.border}`, borderRadius:"12px",
                fontFamily:"system-ui", fontSize:"13px", color:css.text,
                resize:"none", outline:"none", background:"#f8fafc",
                lineHeight:1.5, transition:"border-color .15s" }}
              onFocus={e => e.currentTarget.style.borderColor=css.accent}
              onBlur={e => e.currentTarget.style.borderColor=css.border}
            />
            <button onClick={sendReply} disabled={sending||!reply.trim()}
              style={{ width:"40px", height:"40px", borderRadius:"50%", border:"none",
                background:reply.trim()?css.accent:css.borderLight,
                color:reply.trim()?css.white:css.textMute, fontSize:"16px",
                cursor:reply.trim()?"pointer":"default", flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all .2s", fontFamily:"system-ui" }}>
              {sending ? "…" : "↑"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
