"use client";
import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useLocale } from "@/lib/LocaleContext";
import Navbar from "./Navbar";
import Footer from "./Footer";

const BENEFIT_COLORS = [
  "#a8e63d","#ff0050","#2563eb","#a8e63d","#ff9500",
  "#7c3aed","#1DB954","#a8e63d","#a8e63d",
];
const BENEFIT_ICONS = ["◎","▶","◧","✦","◉","◈","▤","↗","♪"];
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1600&q=80",
  "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800&q=80",
  "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80",
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80",
  "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
  "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&q=80",
  "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&q=80",
  "https://images.unsplash.com/photo-1614680376408-81e91ffe3db7?w=800&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
  "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&q=80",
];

export default function SendDemo() {
  const { t } = useLocale();
  const sd = t.sendDemo;
  const [form, setForm] = useState({
    name:"", artist:"", email:"", genre:"", links:"", message:""
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [images, setImages]   = useState<Record<string,string>>({});
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target:heroRef, offset:["start start","end start"] });
  const heroY = useTransform(scrollYProgress, [0,1], ["0%","30%"]);
  const heroO = useTransform(scrollYProgress, [0,0.6], [1,0]);

  useEffect(() => {
    supabase.from("send_demo_images").select("id, url").then(({ data }) => {
      if (!data) return;
      const map: Record<string,string> = {};
      data.forEach(row => { map[row.id] = row.url; });
      setImages(map);
    });
  }, []);

  const getImg = (key: string, fallbackIndex: number) =>
    images[key] || FALLBACK_IMAGES[fallbackIndex];

 const handleSubmit = async () => {
  if (!form.name || !form.email || !form.links) {
    alert("Rellena al menos tu nombre, email y un enlace a tu música"); return;
  }
  setSending(true);
  const res = await fetch("/api/send-demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  if (res.ok) {
    setSent(true);
  } else {
    alert("Error al enviar. Inténtalo de nuevo.");
  }
  setSending(false);
};

  const inputStyle: React.CSSProperties = {
    width:"100%", padding:"14px 16px",
    background:"rgba(255,255,255,0.04)",
    border:"1px solid rgba(255,255,255,0.1)",
    color:"#f0f0f0", fontSize:"13px",
    fontFamily:"var(--font-mono)", outline:"none",
    boxSizing:"border-box", transition:"border-color .2s",
  };
  const labelStyle: React.CSSProperties = {
    display:"block", fontFamily:"var(--font-mono)",
    fontSize:"9px", letterSpacing:"2px", textTransform:"uppercase",
    color:"rgba(240,240,240,0.4)", marginBottom:"10px",
  };

  return (
    <div style={{ background:"#080808", minHeight:"100vh" }}>
      <Navbar />

      {/* ─── HERO ─── */}
      <section ref={heroRef} style={{ position:"relative", height:"100vh",
        overflow:"hidden", display:"flex", alignItems:"center" }}>

        <motion.div style={{
          position:"absolute", inset:"-10%",
          backgroundImage:`url(${getImg("hero", 0)})`,
          backgroundSize:"cover", backgroundPosition:"center",
          y: heroY,
        }} />
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to right, rgba(8,8,8,0.97) 40%, rgba(8,8,8,0.5) 100%)" }} />
        <div style={{ position:"absolute", inset:0,
          background:"linear-gradient(to top, rgba(8,8,8,1) 0%, transparent 60%)" }} />

        <motion.div
          initial={{ scaleY:0 }} animate={{ scaleY:1 }}
          transition={{ duration:1.2, delay:0.3, ease:[0.22,1,0.36,1] }}
          style={{ position:"absolute", left:"56px", top:"15%", bottom:"15%",
            width:"2px", background:"linear-gradient(to bottom, transparent, #a8e63d, transparent)",
            transformOrigin:"top", zIndex:5 }} />

        <motion.div style={{ position:"relative", zIndex:10,
          padding:"0 80px", opacity:heroO }}>
          <motion.div
            initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
            transition={{ duration:0.6, delay:0.2 }}
            style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"32px" }}>
            <div style={{ width:"40px", height:"2px", background:"#a8e63d" }} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
              letterSpacing:"4px", textTransform:"uppercase", color:"#a8e63d" }}>
              {sd.heroEyebrow}
            </span>
          </motion.div>

          <div style={{ overflow:"hidden", marginBottom:"24px" }}>
            <motion.h1
              initial={{ y:"100%" }} animate={{ y:0 }}
              transition={{ duration:0.9, delay:0.3, ease:[0.22,1,0.36,1] }}
              style={{ fontFamily:"var(--font-display)",
                fontSize:"clamp(56px,10vw,130px)", lineHeight:0.88,
                letterSpacing:"-2px", color:"#f0f0f0" }}>
              {sd.heroTitle1}<br />
              <span style={{ color:"#a8e63d" }}>{sd.heroTitle2}</span>{" "}
              <span style={{ color:"transparent",
                WebkitTextStroke:"2px rgba(240,240,240,0.2)" }}>
                {sd.heroTitle3}
              </span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.7, delay:0.7 }}
            style={{ fontFamily:"var(--font-mono)", fontSize:"14px",
              lineHeight:2, maxWidth:"520px", marginBottom:"40px",
              color:"rgba(240,240,240,0.5)" }}>
            {sd.heroSub}
          </motion.p>

          <motion.a href="#demo-form"
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.7, delay:0.9 }}
            style={{ display:"inline-flex", alignItems:"center", gap:"12px",
              padding:"16px 36px", background:"#a8e63d", color:"#080808",
              fontFamily:"var(--font-mono)", fontSize:"11px",
              letterSpacing:"3px", textTransform:"uppercase",
              textDecoration:"none", fontWeight:700, transition:"all .2s" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background="#f0f0f0"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background="#a8e63d"; }}>
            {sd.heroCta} <span>↓</span>
          </motion.a>
        </motion.div>

        <motion.div
          initial={{ opacity:0 }} animate={{ opacity:1 }}
          transition={{ delay:1.4 }}
          style={{ position:"absolute", bottom:"32px", right:"48px", zIndex:10 }}>
          <motion.div
            animate={{ y:[0,8,0] }}
            transition={{ duration:1.5, repeat:Infinity }}
            style={{ width:"1px", height:"48px",
              background:"linear-gradient(to bottom, rgba(168,230,61,0.5), transparent)" }} />
        </motion.div>
      </section>

      {/* ─── INTRO ─── */}
      <section style={{ padding:"120px 56px 80px" }}>
        <motion.div
          initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ duration:0.8 }}
          style={{ maxWidth:"800px", margin:"0 auto", textAlign:"center" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
            gap:"16px", marginBottom:"32px" }}>
            <div style={{ width:"40px", height:"2px", background:"#a8e63d" }} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
              letterSpacing:"4px", textTransform:"uppercase", color:"#a8e63d" }}>
              {sd.whyEyebrow}
            </span>
            <div style={{ width:"40px", height:"2px", background:"#a8e63d" }} />
          </div>
          <h2 style={{ fontFamily:"var(--font-display)",
            fontSize:"clamp(40px,6vw,80px)", lineHeight:0.9,
            letterSpacing:"-1px", color:"#f0f0f0", marginBottom:"32px" }}>
            {sd.whyTitle1}<br />
            <span style={{ color:"#a8e63d" }}>{sd.whyTitle2}</span>
          </h2>
          <p style={{ fontFamily:"var(--font-mono)", fontSize:"13px",
            lineHeight:2, color:"rgba(240,240,240,0.45)",
            maxWidth:"600px", margin:"0 auto" }}>
            {sd.whySub}
          </p>
        </motion.div>
      </section>

      {/* ─── BENEFICIOS ─── */}
      {sd.benefits.map((b, i) => {
        const isEven  = i % 2 === 0;
        const color   = BENEFIT_COLORS[i];
        const icon    = BENEFIT_ICONS[i];
        const imgKey  = `benefit_0${i+1}`;
        const imgUrl  = getImg(imgKey, i+1);
        return (
          <section key={b.number} style={{ padding:"0 56px", marginBottom:"2px" }}>
            <motion.div
              initial={{ opacity:0, y:32 }}
              whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true, margin:"-80px" }}
              transition={{ duration:0.8, ease:[0.22,1,0.36,1] }}
              style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
                gap:"2px", background:"#111",
                border:"1px solid rgba(255,255,255,0.05)" }}>

              {/* Texto */}
              <div style={{
                order: isEven ? 1 : 2,
                padding:"80px 64px",
                display:"flex", flexDirection:"column", justifyContent:"center",
                borderRight: isEven ? "1px solid rgba(255,255,255,0.05)" : "none",
                borderLeft: !isEven ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}>
                <div style={{ display:"flex", alignItems:"center",
                  gap:"16px", marginBottom:"24px" }}>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                    letterSpacing:"3px", color }}>{b.number}</span>
                  <div style={{ width:"32px", height:"1px", background:color }} />
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                    letterSpacing:"2px", textTransform:"uppercase",
                    color:"rgba(240,240,240,0.3)" }}>{b.subtitle}</span>
                </div>
                <h3 style={{ fontFamily:"var(--font-display)",
                  fontSize:"clamp(36px,4vw,64px)", lineHeight:0.9,
                  letterSpacing:"-0.5px", color:"#f0f0f0", marginBottom:"24px" }}>
                  {b.title.toUpperCase()}
                </h3>
                <p style={{ fontFamily:"var(--font-mono)", fontSize:"13px",
                  lineHeight:2, color:"rgba(240,240,240,0.45)", maxWidth:"400px" }}>
                  {b.description}
                </p>
                <div style={{ marginTop:"32px", display:"flex",
                  alignItems:"center", gap:"12px" }}>
                  <div style={{ width:"32px", height:"32px", borderRadius:"50%",
                    background:`${color}22`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"16px", color }}>
                    {icon}
                  </div>
                  <div style={{ flex:1, height:"1px",
                    background:`linear-gradient(to right, ${color}44, transparent)` }} />
                </div>
              </div>

              {/* Imagen */}
              <div style={{ order: isEven ? 2 : 1,
                position:"relative", aspectRatio:"4/3", overflow:"hidden" }}>
                <motion.div
                  whileInView={{ scale:1 }} initial={{ scale:1.08 }}
                  viewport={{ once:true }}
                  transition={{ duration:1.2, ease:[0.22,1,0.36,1] }}
                  style={{ position:"absolute", inset:0,
                    backgroundImage:`url(${imgUrl})`,
                    backgroundSize:"cover", backgroundPosition:"center" }} />
                <div style={{ position:"absolute", inset:0,
                  background:`linear-gradient(${isEven?"to left":"to right"}, rgba(17,17,17,0.6), transparent)` }} />
                <div style={{ position:"absolute", bottom:"20px", right:"24px",
                  fontFamily:"var(--font-display)", fontSize:"100px",
                  color:"rgba(255,255,255,0.05)", lineHeight:1, userSelect:"none" }}>
                  {b.number}
                </div>
              </div>
            </motion.div>
          </section>
        );
      })}

      {/* ─── STATS ─── */}
      <section style={{ padding:"120px 56px",
        background:"#0d0d0d", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <motion.div
          initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ duration:0.8 }}
          style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"2px" }}>
          {sd.stats.map((s,i) => (
            <motion.div key={i}
              initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
              viewport={{ once:true }} transition={{ duration:0.6, delay:i*0.1 }}
              style={{ padding:"48px 40px", background:"#111",
                border:"1px solid rgba(255,255,255,0.05)", textAlign:"center" }}>
              <p style={{ fontFamily:"var(--font-display)",
                fontSize:"clamp(48px,6vw,80px)", lineHeight:1,
                color:"#a8e63d", marginBottom:"12px" }}>
                {s.value}
              </p>
              <p style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                letterSpacing:"3px", textTransform:"uppercase",
                color:"rgba(240,240,240,0.35)" }}>
                {s.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ─── FORMULARIO ─── */}
      <section id="demo-form" style={{ padding:"120px 56px",
        borderTop:"1px solid rgba(255,255,255,0.05)" }}>
        <motion.div
          initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ duration:0.8 }}
          style={{ maxWidth:"720px", margin:"0 auto" }}>

          <div style={{ display:"flex", alignItems:"center",
            gap:"16px", marginBottom:"32px" }}>
            <div style={{ width:"40px", height:"2px", background:"#a8e63d" }} />
            <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
              letterSpacing:"4px", textTransform:"uppercase", color:"#a8e63d" }}>
              {sd.heroCta}
            </span>
          </div>

          <h2 style={{ fontFamily:"var(--font-display)",
            fontSize:"clamp(48px,7vw,96px)", lineHeight:0.88,
            letterSpacing:"-1px", color:"#f0f0f0", marginBottom:"16px" }}>
            {sd.formTitle1}<br />
            <span style={{ color:"#a8e63d" }}>{sd.formTitle2}</span>
          </h2>
          <p style={{ fontFamily:"var(--font-mono)", fontSize:"12px",
            lineHeight:2, color:"rgba(240,240,240,0.4)", marginBottom:"56px" }}>
            {sd.formSub}
          </p>

          {sent ? (
            <motion.div
              initial={{ opacity:0, scale:0.95 }}
              animate={{ opacity:1, scale:1 }}
              style={{ padding:"64px 48px", textAlign:"center",
                border:"1px solid rgba(168,230,61,0.3)",
                background:"rgba(168,230,61,0.05)" }}>
              <p style={{ fontFamily:"var(--font-display)", fontSize:"48px",
                color:"#a8e63d", marginBottom:"16px" }}>✓</p>
              <p style={{ fontFamily:"var(--font-display)", fontSize:"32px",
                color:"#f0f0f0", marginBottom:"12px" }}>{sd.formSent}</p>
              <p style={{ fontFamily:"var(--font-mono)", fontSize:"12px",
                color:"rgba(240,240,240,0.4)", lineHeight:2 }}>{sd.formSentSub}</p>
            </motion.div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                {[
                  { label:sd.formName,   key:"name",   ph:"Tu nombre completo",  type:"text"  },
                  { label:sd.formArtist, key:"artist", ph:"Tu nombre artístico", type:"text"  },
                ].map(f => (
                  <div key={f.key}>
                    <label style={labelStyle}>{f.label}</label>
                    <input type={f.type} placeholder={f.ph}
                      value={(form as any)[f.key]}
                      onChange={e => setForm({...form,[f.key]:e.target.value})}
                      style={inputStyle}
                      onFocus={e => e.currentTarget.style.borderColor="#a8e63d"}
                      onBlur={e => e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"} />
                  </div>
                ))}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px" }}>
                <div>
                  <label style={labelStyle}>{sd.formEmail}</label>
                  <input type="email" placeholder="tu@email.com"
                    value={form.email}
                    onChange={e => setForm({...form,email:e.target.value})}
                    style={inputStyle}
                    onFocus={e => e.currentTarget.style.borderColor="#a8e63d"}
                    onBlur={e => e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"} />
                </div>
                <div>
                  <label style={labelStyle}>{sd.formGenre}</label>
                  <select value={form.genre}
                    onChange={e => setForm({...form,genre:e.target.value})}
                    style={{...inputStyle, appearance:"none" as any,
                      color:form.genre?"#f0f0f0":"rgba(240,240,240,0.3)"}}>
                    <option value="" disabled style={{ background:"#111" }}>
                      {sd.genres[0]}...
                    </option>
                    {sd.genres.map(g => (
                      <option key={g} value={g} style={{ background:"#111" }}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>{sd.formLinks}</label>
                <input type="url" placeholder="https://soundcloud.com/..."
                  value={form.links}
                  onChange={e => setForm({...form,links:e.target.value})}
                  style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderColor="#a8e63d"}
                  onBlur={e => e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"} />
              </div>

              <div>
                <label style={labelStyle}>{sd.formMessage}</label>
                <textarea placeholder={sd.formMessagePh}
                  value={form.message}
                  onChange={e => setForm({...form,message:e.target.value})}
                  style={{...inputStyle, minHeight:"140px", resize:"vertical" as any}}
                  onFocus={e => e.currentTarget.style.borderColor="#a8e63d"}
                  onBlur={e => e.currentTarget.style.borderColor="rgba(255,255,255,0.1)"} />
              </div>

              <div style={{ paddingTop:"8px" }}>
                <button onClick={handleSubmit} disabled={sending}
                  style={{ width:"100%", padding:"18px",
                    background:sending?"rgba(168,230,61,0.5)":"#a8e63d",
                    border:"none", color:"#080808",
                    fontFamily:"var(--font-mono)", fontSize:"11px",
                    letterSpacing:"3px", textTransform:"uppercase",
                    fontWeight:700, cursor:sending?"not-allowed":"pointer",
                    transition:"all .2s" }}
                  onMouseEnter={e => { if(!sending)(e.currentTarget as HTMLElement).style.background="#f0f0f0"; }}
                  onMouseLeave={e => { if(!sending)(e.currentTarget as HTMLElement).style.background="#a8e63d"; }}>
                  {sending ? sd.formSending : sd.formBtn}
                </button>
                <p style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                  color:"rgba(240,240,240,0.25)", textAlign:"center",
                  marginTop:"16px", lineHeight:1.8 }}>
                  {sd.formDisclaimer}
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}