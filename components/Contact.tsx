"use client";
import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useIsMobile } from "@/lib/useIsMobile";
import { useLocale } from "@/lib/LocaleContext";

export default function Contact() {
  const { t } = useLocale();
  const [form, setForm]     = useState({ name:"", email:"", message:"" });
  const [status, setStatus] = useState<"idle"|"sending"|"ok"|"error">("idle");
  const isMobile = useIsMobile();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target:ref, offset:["start end","center center"] });
  const titleY = useTransform(scrollYProgress, [0,1], [60,0]);
  const titleO = useTransform(scrollYProgress, [0,0.4], [0,1]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    await new Promise(r => setTimeout(r, 1200));
    setStatus("ok");
  };

  const inputStyle = {
    width:"100%", padding:"0 0 14px",
    background:"transparent", border:"none",
    borderBottom:"1px solid rgba(255,255,255,0.1)",
    color:"#f0f0f0", fontSize:"15px",
    fontFamily:"var(--font-mono)", outline:"none",
    letterSpacing:"0.5px", transition:"border-color .2s",
  } as React.CSSProperties;

  const labelStyle = {
    fontFamily:"var(--font-mono)", fontSize:"9px",
    letterSpacing:"3px", textTransform:"uppercase" as const,
    color:"rgba(168,230,61,0.6)", display:"block", marginBottom:"12px",
  };

  const contactInfo = [
    { label:"Email general",  value:"info@loyalfoxrecords.com"  },
    { label:"Demos",          value:"demos@loyalfoxrecords.com" },
    { label:"Instagram",      value:"@loyalfoxrecords"          },
    { label:t.contact?.fieldMotivo||"Localización", value:"España" },
  ];

  const formFields = [
    { id:"name",  label:t.contact?.fieldName||"Nombre",  type:"text",  placeholder:t.contact?.fieldNamePh||"Tu nombre artístico" },
    { id:"email", label:t.contact?.fieldEmail||"Email",  type:"email", placeholder:"tu@email.com" },
  ];

  /* ── MÓVIL ── */
  if (isMobile) return (
    <section id="contact" style={{ background:"var(--black)" }}>
      {/* Bloque verde */}
      <div style={{ background:"#a8e63d", padding:"48px 20px" }}>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
          letterSpacing:"3px", textTransform:"uppercase",
          color:"rgba(8,8,8,0.5)", display:"block", marginBottom:"16px" }}>
          {t.contact?.eyebrow||"Contacto"}
        </span>
        <h2 style={{ fontFamily:"var(--font-display)",
          fontSize:"clamp(48px,14vw,72px)", lineHeight:0.88,
          letterSpacing:"-1px", color:"#080808", marginBottom:"16px" }}>
          {t.contact?.title?.split("\n").map((line,i) => (
            <span key={i}>{line}{i===0&&<br/>}{i===1&&<br/>}</span>
          ))||<>ENVÍA<br/>TU<br/>DEMO</>}
        </h2>
        <p style={{ fontFamily:"var(--font-mono)", fontSize:"12px",
          lineHeight:1.8, color:"rgba(8,8,8,0.6)" }}>
          {t.contact?.intro||"¿Tienes música que encaja con nuestra visión? Escríbenos y escuchamos todo lo que llega."}
        </p>
      </div>

      {/* Info */}
      <div style={{ padding:"40px 20px", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
        {contactInfo.map(item => (
          <div key={item.label} style={{ paddingBottom:"20px", marginBottom:"20px",
            borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
              letterSpacing:"3px", textTransform:"uppercase",
              color:"rgba(168,230,61,0.6)", marginBottom:"6px" }}>{item.label}</p>
            <p style={{ fontFamily:"var(--font-display)", fontSize:"16px",
              letterSpacing:"1px", color:"var(--white)" }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Formulario móvil */}
      <div style={{ padding:"40px 20px" }}>
        {status==="ok" ? (
          <div style={{ padding:"40px 0" }}>
            <div style={{ width:"40px", height:"40px", borderRadius:"50%",
              background:"#a8e63d", display:"flex", alignItems:"center",
              justifyContent:"center", marginBottom:"16px" }}>
              <span style={{ fontSize:"18px", color:"#080808" }}>✓</span>
            </div>
            <p style={{ fontFamily:"var(--font-display)", fontSize:"28px",
              letterSpacing:"1px", color:"var(--white)", marginBottom:"8px" }}>
              {t.contact?.sent||"✓ Enviado"}
            </p>
            <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
              lineHeight:1.8, color:"rgba(240,240,240,0.4)" }}>
              Te contestaremos en los próximos días.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"32px" }}>
            {formFields.map(field => (
              <div key={field.id}>
                <label style={labelStyle}>{field.label}</label>
                <input type={field.type} placeholder={field.placeholder}
                  value={form[field.id as keyof typeof form]}
                  onChange={e => setForm({...form,[field.id]:e.target.value})}
                  required style={inputStyle}
                  onFocus={e => e.currentTarget.style.borderBottomColor="#a8e63d"}
                  onBlur={e => e.currentTarget.style.borderBottomColor="rgba(255,255,255,0.1)"} />
              </div>
            ))}
            <div>
              <label style={labelStyle}>{t.contact?.fieldMsg||"Mensaje"}</label>
              <textarea placeholder={t.contact?.fieldMsgPh||"Cuéntanos sobre tu música..."}
                value={form.message} onChange={e => setForm({...form,message:e.target.value})}
                required rows={4}
                style={{ ...inputStyle, resize:"none" }}
                onFocus={e => e.currentTarget.style.borderBottomColor="#a8e63d"}
                onBlur={e => e.currentTarget.style.borderBottomColor="rgba(255,255,255,0.1)"} />
            </div>
            <button type="submit" disabled={status==="sending"}
              style={{ padding:"16px", background:"#a8e63d", color:"#080808",
                border:"none", cursor:status==="sending"?"not-allowed":"pointer",
                opacity:status==="sending"?0.7:1, fontWeight:700,
                fontFamily:"var(--font-mono)", fontSize:"11px",
                letterSpacing:"3px", textTransform:"uppercase" }}>
              {status==="sending"
                ? t.contact?.sending||"Enviando..."
                : t.contact?.send||"Enviar mensaje →"}
            </button>
          </form>
        )}
      </div>
    </section>
  );

  /* ── DESKTOP ── */
  return (
    <section ref={ref} id="contact" style={{ background:"var(--black)", position:"relative", overflow:"hidden" }}>
      {/* Bloque verde */}
      <div style={{ background:"#a8e63d", padding:"80px 56px",
        display:"grid", gridTemplateColumns:"1fr 1fr", gap:"80px", alignItems:"center" }}>
        <motion.div style={{ y:titleY, opacity:titleO }}>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
            letterSpacing:"4px", textTransform:"uppercase",
            color:"rgba(8,8,8,0.5)", display:"block", marginBottom:"20px" }}>
            07 — {t.contact?.eyebrow||"Contacto"}
          </span>
          <h2 style={{ fontFamily:"var(--font-display)",
            fontSize:"clamp(56px,7vw,100px)", lineHeight:0.88,
            letterSpacing:"-1px", color:"#080808" }}>
            {t.contact?.title?.split("\n").map((line,i) => (
              <span key={i} style={{ display:"block" }}>{line}</span>
            ))||<>ENVÍA<br/>TU<br/>DEMO</>}
          </h2>
        </motion.div>
        <motion.p initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }} transition={{ duration:0.7, delay:0.2 }}
          style={{ fontFamily:"var(--font-mono)", fontSize:"13px",
            lineHeight:2, color:"rgba(8,8,8,0.6)", maxWidth:"400px" }}>
          {t.contact?.intro||"¿Tienes música que encaja con nuestra visión? House, deep, ambient, techno. Escríbenos y escuchamos todo lo que llega."}
        </motion.p>
      </div>

      {/* Cuerpo */}
      <div style={{ padding:"100px 56px", display:"grid",
        gridTemplateColumns:"1fr 1fr", gap:"100px", alignItems:"start" }}>

        {/* Info */}
        <motion.div initial={{ opacity:0, x:-30 }} whileInView={{ opacity:1, x:0 }}
          viewport={{ once:true }} transition={{ duration:0.8 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:"40px" }}>
            {contactInfo.map(item => (
              <div key={item.label} style={{ paddingBottom:"24px",
                borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                <p style={{ fontFamily:"var(--font-mono)", fontSize:"9px",
                  letterSpacing:"3px", textTransform:"uppercase",
                  color:"rgba(168,230,61,0.6)", marginBottom:"8px" }}>{item.label}</p>
                <p style={{ fontFamily:"var(--font-display)", fontSize:"20px",
                  letterSpacing:"1px", color:"var(--white)" }}>{item.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Formulario */}
        <motion.div initial={{ opacity:0, x:30 }} whileInView={{ opacity:1, x:0 }}
          viewport={{ once:true }} transition={{ duration:0.8, delay:0.1 }}>
          {status==="ok" ? (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              style={{ padding:"60px 0" }}>
              <div style={{ width:"48px", height:"48px", borderRadius:"50%",
                background:"#a8e63d", display:"flex", alignItems:"center",
                justifyContent:"center", marginBottom:"24px" }}>
                <span style={{ fontSize:"22px", color:"#080808" }}>✓</span>
              </div>
              <p style={{ fontFamily:"var(--font-display)", fontSize:"36px",
                letterSpacing:"1px", color:"var(--white)", marginBottom:"12px" }}>
                {t.contact?.sent||"✓ Enviado"}
              </p>
              <p style={{ fontFamily:"var(--font-mono)", fontSize:"11px",
                lineHeight:1.8, color:"rgba(240,240,240,0.4)" }}>
                Te contestaremos en los próximos días. Gracias por tu interés.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"40px" }}>
              {formFields.map(field => (
                <div key={field.id}>
                  <label style={labelStyle}>{field.label}</label>
                  <input type={field.type} placeholder={field.placeholder}
                    value={form[field.id as keyof typeof form]}
                    onChange={e => setForm({...form,[field.id]:e.target.value})}
                    required style={inputStyle}
                    onFocus={e => e.currentTarget.style.borderBottomColor="#a8e63d"}
                    onBlur={e => e.currentTarget.style.borderBottomColor="rgba(255,255,255,0.1)"} />
                </div>
              ))}
              <div>
                <label style={labelStyle}>{t.contact?.fieldMsg||"Mensaje"}</label>
                <textarea placeholder={t.contact?.fieldMsgPh||"Cuéntanos sobre tu música, tu estilo, tus referencias..."}
                  value={form.message} onChange={e => setForm({...form,message:e.target.value})}
                  required rows={5}
                  style={{ ...inputStyle, resize:"none" }}
                  onFocus={e => e.currentTarget.style.borderBottomColor="#a8e63d"}
                  onBlur={e => e.currentTarget.style.borderBottomColor="rgba(255,255,255,0.1)"} />
              </div>
              <button type="submit" disabled={status==="sending"}
                style={{ fontFamily:"var(--font-mono)", fontSize:"10px",
                  letterSpacing:"3px", textTransform:"uppercase",
                  padding:"18px 48px", background:"#a8e63d", color:"#080808",
                  border:"none", cursor:status==="sending"?"not-allowed":"pointer",
                  opacity:status==="sending"?0.7:1, fontWeight:700,
                  alignSelf:"flex-start", transition:"all .3s" }}
                onMouseEnter={e => { if(status!=="sending"){ (e.currentTarget as HTMLElement).style.background="#c5f560"; (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; }}}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background="#a8e63d"; (e.currentTarget as HTMLElement).style.transform="none"; }}>
                {status==="sending"
                  ? t.contact?.sending||"Enviando..."
                  : t.contact?.send||"Enviar mensaje →"}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}