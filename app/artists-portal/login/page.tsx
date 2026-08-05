"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ArtistLogin() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await fetch("/api/artists-portal/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) { router.push("/artists-portal"); }
    else { setError("Email o contraseña incorrectos"); setLoading(false); }
  };

  const inp: React.CSSProperties = {
    width:"100%", padding:"14px 16px", background:"#0e0e0e",
    border:"1px solid #1a1a1a", color:"#e8e8e8", fontSize:"14px",
    fontFamily:"inherit", outline:"none", marginBottom:"12px",
  };

  return (
    <div style={{ minHeight:"100vh", background:"#060606",
      display:"flex", alignItems:"center", justifyContent:"center",
      backgroundImage:"linear-gradient(rgba(57,255,20,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.02) 1px, transparent 1px)",
      backgroundSize:"60px 60px" }}>
      <div style={{ width:"100%", maxWidth:"400px", padding:"48px" }}>

        <div style={{ marginBottom:"48px", textAlign:"center" }}>
          <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"32px",
            letterSpacing:"4px", color:"#e8e8e8", marginBottom:"8px" }}>
            LOYAL<span style={{ color:"#39ff14" }}>FOX</span>
          </p>
          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
            letterSpacing:"3px", textTransform:"uppercase", color:"#555" }}>
            Portal de artistas
          </p>
          <div style={{ width:"40px", height:"1px", background:"#39ff14",
            margin:"16px auto 0", boxShadow:"0 0 8px #39ff14" }} />
        </div>

        <form onSubmit={handleSubmit}>
          <input type="email" placeholder="Tu email" value={email}
            onChange={(e) => setEmail(e.target.value)} style={inp} required
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(57,255,20,0.4)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1a1a1a")} />
          <input type="password" placeholder="Contraseña" value={password}
            onChange={(e) => setPassword(e.target.value)} style={inp} required
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(57,255,20,0.4)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1a1a1a")} />
          {error && (
            <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
              color:"#ff4444", marginBottom:"16px" }}>{error}</p>
          )}
          <button type="submit" disabled={loading}
            style={{ width:"100%", padding:"16px", background:"#39ff14", color:"#000",
              border:"none", fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
              letterSpacing:"3px", textTransform:"uppercase", fontWeight:700,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Accediendo..." : "Entrar"}
          </button>
        </form>

        <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
          color:"#333", textAlign:"center", marginTop:"24px", letterSpacing:"1px" }}>
          ¿Problemas para acceder? Contacta con el sello.
        </p>
      </div>
    </div>
  );
}