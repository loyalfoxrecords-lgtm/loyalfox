"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass }),
    });
    if (res.ok) {
      router.push("/admin");
    } else {
      setError("Credenciales incorrectas");
      setLoading(false);
    }
  };

  const input: React.CSSProperties = {
    width: "100%", padding: "14px 16px",
    background: "#0e0e0e", border: "1px solid #202020",
    color: "#e8e8e8", fontSize: "14px", fontFamily: "inherit",
    outline: "none", marginBottom: "12px",
  };

  return (
    <div style={{ minHeight:"100vh", background:"#060606", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ width:"100%", maxWidth:"380px", padding:"48px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"48px" }}>
          <img src="/logo.jpg" alt="LF" style={{ width:"36px", height:"36px", objectFit:"contain", filter:"drop-shadow(0 0 6px rgba(57,255,20,0.5))" }} />
          <span style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:"20px", letterSpacing:"4px", color:"#e8e8e8" }}>
            LOYAL<span style={{ color:"#39ff14" }}>FOX</span>
          </span>
        </div>

        <p style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:"10px", letterSpacing:"3px",
          textTransform:"uppercase", color:"#555", marginBottom:"32px" }}>
          Panel de administración
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text" placeholder="Usuario" value={user}
            onChange={(e) => setUser(e.target.value)}
            style={input}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(57,255,20,0.4)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#202020")}
          />
          <input
            type="password" placeholder="Contraseña" value={pass}
            onChange={(e) => setPass(e.target.value)}
            style={input}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(57,255,20,0.4)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#202020")}
          />
          {error && (
            <p style={{ fontFamily:"'Share Tech Mono', monospace", fontSize:"11px",
              color:"#ff4444", marginBottom:"16px" }}>{error}</p>
          )}
          <button type="submit" disabled={loading}
            style={{ width:"100%", padding:"16px", background:"#39ff14", color:"#000",
              border:"none", fontFamily:"'Share Tech Mono', monospace", fontSize:"11px",
              letterSpacing:"3px", textTransform:"uppercase", fontWeight:700,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Accediendo..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}