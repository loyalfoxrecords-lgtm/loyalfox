"use client";
import Image from "next/image";

const LOGO = "https://i.ibb.co/KjqCYGmY/descarga-1.png";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{ background:"#050505",
      borderTop:"1px solid rgba(168,230,61,0.08)" }}>

      {/* Top — logo grande */}
      <div style={{ padding:"80px 56px 0",
        borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display:"flex", alignItems:"center",
          gap:"16px", marginBottom:"64px" }}>
          <Image src={LOGO} alt="LoyalFox" width={32} height={32}
            style={{ filter:"brightness(0) saturate(100%) invert(79%) sepia(40%) saturate(500%) hue-rotate(42deg) brightness(95%)", opacity:0.7 }} />
          <span style={{ fontFamily:"var(--font-display)", fontSize:"clamp(40px,6vw,80px)",
            letterSpacing:"-1px", color:"rgba(240,240,240,0.08)",
            lineHeight:1 }}>
            LOYALFOX RECORDS
          </span>
        </div>

        {/* Links */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr",
          gap:"64px", paddingBottom:"64px" }}>
          <div>
            <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
              lineHeight:2, color:"rgba(240,240,240,0.25)",
              maxWidth:"280px", marginBottom:"32px" }}>
              Sello de música electrónica independiente. House, deep, ambient, techno. Fundado en España, 2025.
            </p>
            <div style={{ display:"flex", gap:"16px" }}>
              {["Instagram","Spotify","SoundCloud"].map((s) => (
                <a key={s} href="#"
                  style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                    letterSpacing:"2px", textTransform:"uppercase",
                    color:"rgba(240,240,240,0.2)", textDecoration:"none",
                    transition:"color .2s" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#a8e63d"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(240,240,240,0.2)"}>
                  {s}
                </a>
              ))}
            </div>
          </div>

          {[
            {
              title:"Música",
              links:[
                { label:"Catálogo",  href:"#catalog"   },
                { label:"Playlists", href:"#playlists" },
                { label:"Artistas",  href:"/artists"   },
                { label:"Streamers", href:"/streamers" },
              ]
            },
            {
              title:"Sello",
              links:[
                { label:"Sobre nosotros", href:"#about"   },
                { label:"Noticias",       href:"#blog"    },
                { label:"Contacto",       href:"#contact" },
                { label:"Enviar demo",    href:"#contact" },
              ]
            },
            {
              title:"Portales",
              links:[
                { label:"Portal artistas",  href:"/artists-portal/login"  },
                { label:"Portal streamers", href:"/streamers-portal/login" },
              ]
            },
          ].map((col) => (
            <div key={col.title}>
              <p style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                letterSpacing:"3px", textTransform:"uppercase",
                color:"rgba(168,230,61,0.5)", marginBottom:"24px" }}>
                {col.title}
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                {col.links.map((l) => (
                  <a key={l.label} href={l.href}
                    style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
                      color:"rgba(240,240,240,0.3)", textDecoration:"none",
                      transition:"color .2s" }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#f0f0f0"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(240,240,240,0.3)"}>
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div style={{ padding:"24px 56px",
        display:"flex", justifyContent:"space-between",
        alignItems:"center", flexWrap:"wrap", gap:"12px" }}>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
          letterSpacing:"2px", color:"rgba(240,240,240,0.15)" }}>
          © {year} LOYALFOX RECORDS. TODOS LOS DERECHOS RESERVADOS.
        </p>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
          letterSpacing:"2px", color:"rgba(168,230,61,0.3)" }}>
          EST. 2025 · ESPAÑA
        </p>
      </div>
    </footer>
  );
}