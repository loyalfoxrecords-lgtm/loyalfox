"use client";
import { useState, useEffect } from "react";
import { useLocale } from "@/lib/LocaleContext";
import Image from "next/image";

const LOGO = "https://i.ibb.co/KjqCYGmY/descarga-1.png";

export default function Navbar() {
  const { locale, setLocale, t } = useLocale();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href:"#catalog",   label: t.nav?.music      || "Música"     },
    { href:"#playlists", label: t.nav?.playlists   || "Playlists"  },
    { href:"#artists",   label: t.nav?.artists     || "Artistas"   },
    { href:"#streamers", label: t.nav?.streamers   || "Streamers"  },
    { href:"#about",     label: t.nav?.about       || "Sello"      },
    { href:"#contact",   label: t.nav?.contact     || "Contacto"   },
  ];

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

      {/* Logo */}
      <a href="/" style={{ display:"flex", alignItems:"center",
        gap:"10px", textDecoration:"none", flexShrink:0 }}>
        <Image src={LOGO} alt="LoyalFox" width={26} height={26}
          style={{ filter:"brightness(0) saturate(100%) invert(79%) sepia(40%) saturate(500%) hue-rotate(42deg) brightness(95%)", opacity:0.9 }} />
        <div style={{ display:"flex", flexDirection:"column", gap:"1px" }}>
          <span style={{ fontFamily:"var(--font-display)", fontSize:"16px",
            letterSpacing:"4px", color:"#f0f0f0", lineHeight:1 }}>
            LOYALFOX
          </span>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"7px",
            letterSpacing:"3px", color:"rgba(168,230,61,0.6)",
            textTransform:"uppercase" }}>
            RECORDS
          </span>
        </div>
      </a>

      {/* Links centro */}
      <div style={{ flex:1, display:"flex", justifyContent:"center",
        gap:"36px", alignItems:"center" }}>
        {links.map((l) => (
          <a key={l.href} href={l.href}
            style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
              letterSpacing:"2px", textTransform:"uppercase",
              color:"rgba(240,240,240,0.4)", textDecoration:"none",
              transition:"color .2s" }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#a8e63d"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "rgba(240,240,240,0.4)"}>
            {l.label}
          </a>
        ))}
      </div>

      {/* Botón enviar demo */}
      <a href="/send-demo"
        style={{ flexShrink:0,
          fontFamily:"var(--font-mono)", fontSize:"9px",
          letterSpacing:"2px", textTransform:"uppercase",
          padding:"9px 18px",
          background:"#a8e63d", color:"#080808",
          fontWeight:700, textDecoration:"none",
          transition:"all .2s" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background="#c5f560"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background="#a8e63d"; }}>
        Enviar demo
      </a>

      {/* Idioma */}
      <div style={{ display:"flex", gap:"4px", alignItems:"center", flexShrink:0 }}>
        {(["es","en","de"] as const).map((lang) => (
          <button key={lang} onClick={() => setLocale(lang)}
            style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
              letterSpacing:"2px", textTransform:"uppercase",
              background: locale === lang ? "rgba(168,230,61,0.12)" : "transparent",
              border: locale === lang ? "1px solid rgba(168,230,61,0.3)" : "1px solid transparent",
              color: locale === lang ? "#a8e63d" : "rgba(240,240,240,0.3)",
              cursor:"pointer", padding:"5px 8px",
              transition:"all .2s" }}>
            {lang}
          </button>
        ))}
      </div>
    </nav>
  );
}