"use client";
import { useState, useEffect } from "react";
import { useLocale } from "@/lib/LocaleContext";
import { useIsMobile } from "@/lib/useIsMobile";
import Image from "next/image";

const LOGO = "https://i.ibb.co/KjqCYGmY/descarga-1.png";

export default function Navbar() {
  const { locale, setLocale, t } = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href:"/#catalog",   label: t.nav?.music    || "Música"    },
    { href:"/#playlists", label: t.nav?.playlists || "Playlists" },
    { href:"/#artists",   label: t.nav?.artists   || "Artistas"  },
    { href:"/#streamers", label: t.nav?.streamers || "Streamers" },
    { href:"/#about",     label: t.nav?.about     || "Sello"     },
    { href:"/#contact",   label: t.nav?.contact   || "Contacto"  },
  ];

  /* ── MÓVIL ── */
  if (isMobile) return (
    <>
      <nav style={{
        position:"fixed", top:0, left:0, right:0, zIndex:200,
        height:"60px",
        background: scrolled||menuOpen ? "rgba(8,8,8,0.98)" : "transparent",
        backdropFilter: scrolled||menuOpen ? "blur(20px)" : "none",
        borderBottom: scrolled||menuOpen ? "1px solid rgba(168,230,61,0.08)" : "none",
        transition:"all .3s",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"0 20px",
      }}>
        <a href="/" style={{ display:"flex", alignItems:"center",
          gap:"8px", textDecoration:"none" }}>
          <Image src={LOGO} alt="LoyalFox" width={22} height={22}
            style={{ filter:"brightness(0) saturate(100%) invert(79%) sepia(40%) saturate(500%) hue-rotate(42deg) brightness(95%)", opacity:0.9 }} />
          <span style={{ fontFamily:"var(--font-display)", fontSize:"14px",
            letterSpacing:"3px", color:"#f0f0f0" }}>LOYALFOX</span>
        </a>

        <button onClick={() => setMenuOpen(!menuOpen)}
          style={{ background:"none", border:"none", cursor:"pointer",
            padding:"8px", display:"flex", flexDirection:"column",
            gap:"5px", alignItems:"flex-end" }}>
          <span style={{ display:"block", width:"24px", height:"1.5px",
            background:"#f0f0f0", transition:"all .3s",
            transform:menuOpen?"rotate(45deg) translateY(6.5px)":"none" }} />
          <span style={{ display:"block", width:"16px", height:"1.5px",
            background:"#f0f0f0", transition:"all .3s",
            opacity:menuOpen?0:1 }} />
          <span style={{ display:"block", width:"24px", height:"1.5px",
            background:"#f0f0f0", transition:"all .3s",
            transform:menuOpen?"rotate(-45deg) translateY(-6.5px)":"none" }} />
        </button>
      </nav>

      {menuOpen && (
        <div style={{
          position:"fixed", top:"60px", left:0, right:0, bottom:0,
          background:"rgba(8,8,8,0.98)", zIndex:199,
          display:"flex", flexDirection:"column",
          padding:"40px 24px", overflowY:"auto",
        }}>
          {links.map((l) => (
            <a key={l.href} href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{ fontFamily:"var(--font-display)", fontSize:"36px",
                letterSpacing:"1px", color:"#f0f0f0", textDecoration:"none",
                padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.06)",
                transition:"color .2s" }}
              onTouchStart={(e) => (e.currentTarget as HTMLElement).style.color="#a8e63d"}
              onTouchEnd={(e) => (e.currentTarget as HTMLElement).style.color="#f0f0f0"}>
              {l.label}
            </a>
          ))}

          <a href="/send-demo" onClick={() => setMenuOpen(false)}
            style={{ marginTop:"32px", padding:"16px 24px",
              background:"#a8e63d", color:"#080808",
              fontFamily:"var(--font-mono)", fontSize:"11px",
              letterSpacing:"3px", textTransform:"uppercase",
              fontWeight:700, textDecoration:"none", textAlign:"center" }}>
            {t.hero?.cta2 || "Enviar demo"}
          </a>

          <div style={{ display:"flex", gap:"8px", marginTop:"24px", justifyContent:"center" }}>
            {(["es","en","de"] as const).map((lang) => (
              <button key={lang} onClick={() => setLocale(lang)}
                style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                  letterSpacing:"2px", textTransform:"uppercase",
                  background: locale===lang?"rgba(168,230,61,0.12)":"transparent",
                  border: locale===lang?"1px solid rgba(168,230,61,0.3)":"1px solid rgba(255,255,255,0.1)",
                  color: locale===lang?"#a8e63d":"rgba(240,240,240,0.4)",
                  cursor:"pointer", padding:"8px 16px" }}>
                {lang}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );

  /* ── DESKTOP ── */
  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:200,
      height:"68px",
      background: scrolled ? "rgba(8,8,8,0.97)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(168,230,61,0.08)" : "none",
      transition:"all .5s ease",
      display:"flex", alignItems:"center",
      padding:"0 48px", gap:"32px",
    }}>
      <a href="/" style={{ display:"flex", alignItems:"center",
        gap:"10px", textDecoration:"none", flexShrink:0 }}>
        <Image src={LOGO} alt="LoyalFox" width={26} height={26}
          style={{ filter:"brightness(0) saturate(100%) invert(79%) sepia(40%) saturate(500%) hue-rotate(42deg) brightness(95%)", opacity:0.9 }} />
        <div style={{ display:"flex", flexDirection:"column", gap:"1px" }}>
          <span style={{ fontFamily:"var(--font-display)", fontSize:"16px",
            letterSpacing:"4px", color:"#f0f0f0", lineHeight:1 }}>LOYALFOX</span>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"7px",
            letterSpacing:"3px", color:"rgba(168,230,61,0.6)", textTransform:"uppercase" }}>
            RECORDS
          </span>
        </div>
      </a>

      <div style={{ flex:1, display:"flex", justifyContent:"center", gap:"36px", alignItems:"center" }}>
        {links.map((l) => (
          <a key={l.href} href={l.href}
            style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
              letterSpacing:"2px", textTransform:"uppercase",
              color:"rgba(240,240,240,0.4)", textDecoration:"none", transition:"color .2s" }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color="#a8e63d"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color="rgba(240,240,240,0.4)"}>
            {l.label}
          </a>
        ))}
      </div>

      <a href="/send-demo"
        style={{ flexShrink:0, fontFamily:"var(--font-mono)", fontSize:"9px",
          letterSpacing:"2px", textTransform:"uppercase", padding:"9px 18px",
          background:"#a8e63d", color:"#080808", fontWeight:700,
          textDecoration:"none", transition:"all .2s" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background="#c5f560"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background="#a8e63d"; }}>
        {t.hero?.cta2 || "Enviar demo"}
      </a>

      <div style={{ display:"flex", gap:"4px", alignItems:"center", flexShrink:0 }}>
        {(["es","en","de"] as const).map((lang) => (
          <button key={lang} onClick={() => setLocale(lang)}
            style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
              letterSpacing:"2px", textTransform:"uppercase",
              background: locale===lang?"rgba(168,230,61,0.12)":"transparent",
              border: locale===lang?"1px solid rgba(168,230,61,0.3)":"1px solid transparent",
              color: locale===lang?"#a8e63d":"rgba(240,240,240,0.3)",
              cursor:"pointer", padding:"5px 8px", transition:"all .2s" }}>
            {lang}
          </button>
        ))}
      </div>
    </nav>
  );
}