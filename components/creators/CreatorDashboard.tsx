"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Royalty = {
  id: string; month: string; total_streams: number;
  gross_revenue: number; creator_share: number;
  paid: boolean; paid_at: string | null; notes: string;
};

const fmtMonth = (m: string) => {
  const d = new Date(m);
  return d.toLocaleString("es", { month:"long", year:"numeric" });
};
const fmtUSD = (n: number) => `$${Number(n).toFixed(2)}`;
const fmt = (n: number) => n >= 1000 ? `${(n/1000).toFixed(1)}K` : String(n);

export default function CreatorDashboard() {
  const router = useRouter();
  const [name, setName]         = useState("");
  const [royalties, setRoyalties] = useState<Royalty[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/creators/me")
      .then((r) => { if (!r.ok) router.push("/creators/login"); return r.json(); })
      .then((data) => {
        setName(data.name);
        setRoyalties(data.royalties || []);
        setLoading(false);
      })
      .catch(() => router.push("/creators/login"));
  }, [router]);

  const logout = async () => {
    await fetch("/api/creators/logout", { method:"POST" });
    router.push("/creators/login");
  };

  const totalEarned  = royalties.reduce((a, r) => a + Number(r.creator_share), 0);
  const totalPending = royalties.filter((r) => !r.paid).reduce((a, r) => a + Number(r.creator_share), 0);
  const totalPaid    = royalties.filter((r) => r.paid).reduce((a, r) => a + Number(r.creator_share), 0);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#060606" }}>
      <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px", color:"#555", letterSpacing:"4px" }}>CARGANDO...</p>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#060606", color:"#e8e8e8" }}>

      {/* Nav */}
      <nav style={{ padding:"20px 48px", borderBottom:"1px solid #1a1a1a",
        display:"flex", justifyContent:"space-between", alignItems:"center",
        background:"rgba(6,6,6,0.95)" }}>
        <div>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"20px",
            letterSpacing:"4px" }}>
            LOYAL<span style={{ color:"#39ff14" }}>FOX</span>
          </span>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
            color:"#555", marginLeft:"16px", letterSpacing:"2px" }}>
            Portal de creadores
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"20px" }}>
          <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px", color:"#555" }}>
            {name}
          </span>
          <button onClick={logout}
            style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
              letterSpacing:"2px", textTransform:"uppercase", padding:"8px 16px",
              background:"transparent", border:"1px solid #222", color:"#555", cursor:"pointer" }}>
            Salir
          </button>
        </div>
      </nav>

      <div style={{ padding:"48px" }}>

        {/* Header */}
        <div style={{ marginBottom:"48px" }}>
          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"10px",
            letterSpacing:"3px", textTransform:"uppercase", color:"#39ff14", marginBottom:"8px" }}>
            Bienvenido
          </p>
          <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"48px",
            letterSpacing:"2px", marginBottom:"4px" }}>{name}</h1>
          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px", color:"#555" }}>
            Panel de regalías — LoyalFox Records
          </p>
        </div>

        {/* KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"2px", marginBottom:"48px" }}>
          {[
            { label:"Total generado", value: fmtUSD(totalEarned), sub:"Tu 50% acumulado" },
            { label:"Pendiente de cobro", value: fmtUSD(totalPending), sub:"Aún no pagado", accent:true },
            { label:"Total cobrado", value: fmtUSD(totalPaid), sub:"Ya transferido" },
          ].map((k, i) => (
            <div key={i} style={{ padding:"28px 32px", background:"#0e0e0e",
              borderLeft:`2px solid ${k.accent ? "#39ff14" : "#1a1a1a"}` }}>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                letterSpacing:"3px", textTransform:"uppercase",
                color: k.accent ? "#39ff14" : "#555", marginBottom:"10px" }}>{k.label}</p>
              <p style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"40px",
                lineHeight:1, color:"#e8e8e8" }}>{k.value}</p>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                color:"#333", marginTop:"6px" }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Royalties table */}
        <div>
          <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:"24px",
            letterSpacing:"2px", marginBottom:"20px" }}>
            Historial de regalías
          </h2>

          {royalties.length === 0 ? (
            <div style={{ padding:"60px", textAlign:"center", background:"#0e0e0e",
              border:"1px solid #1a1a1a" }}>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
                color:"#333", letterSpacing:"2px" }}>
                Aún no hay datos de regalías
              </p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
              {/* Header row */}
              <div style={{ display:"grid",
                gridTemplateColumns:"1fr 120px 120px 120px 100px",
                gap:"16px", padding:"10px 20px" }}>
                {["Mes","Reproducciones","Ingresos brutos","Tu parte (50%)","Estado"].map((h) => (
                  <span key={h} style={{ fontFamily:"'Share Tech Mono',monospace",
                    fontSize:"9px", letterSpacing:"2px", textTransform:"uppercase", color:"#333" }}>
                    {h}
                  </span>
                ))}
              </div>

              {royalties.map((r) => (
                <div key={r.id}
                  style={{ display:"grid",
                    gridTemplateColumns:"1fr 120px 120px 120px 100px",
                    gap:"16px", padding:"16px 20px",
                    background:"#0e0e0e", alignItems:"center" }}>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace",
                    fontSize:"13px", color:"#e8e8e8", textTransform:"capitalize" }}>
                    {fmtMonth(r.month)}
                  </span>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace",
                    fontSize:"12px", color:"#555" }}>
                    {fmt(r.total_streams)}
                  </span>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace",
                    fontSize:"12px", color:"#555" }}>
                    {fmtUSD(r.gross_revenue)}
                  </span>
                  <span style={{ fontFamily:"'Share Tech Mono',monospace",
                    fontSize:"13px", color:"#39ff14", fontWeight:700 }}>
                    {fmtUSD(r.creator_share)}
                  </span>
                  <span style={{
                    fontFamily:"'Share Tech Mono',monospace", fontSize:"9px",
                    letterSpacing:"1px", textTransform:"uppercase",
                    padding:"4px 10px", textAlign:"center",
                    background: r.paid ? "rgba(29,185,84,0.1)" : "rgba(255,92,26,0.1)",
                    color: r.paid ? "#1DB954" : "#ff5c1a",
                    border: `1px solid ${r.paid ? "#1DB95444" : "#ff5c1a44"}`,
                  }}>
                    {r.paid ? "Pagado" : "Pendiente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div style={{ marginTop:"48px", padding:"20px 24px",
          borderLeft:"2px solid rgba(57,255,20,0.2)", background:"rgba(57,255,20,0.03)" }}>
          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:"11px",
            color:"#555", lineHeight:1.8 }}>
            Los pagos se procesan mensualmente. Si tienes alguna duda sobre tus regalías
            contacta con nosotros en{" "}
            <span style={{ color:"#39ff14" }}>info@loyalfoxrecords.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}