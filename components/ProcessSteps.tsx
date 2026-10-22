"use client";
import { motion } from "framer-motion";
import { useLocale } from "@/lib/LocaleContext";

const COPY = {
  es: {
    eyebrow: "Cómo trabajamos", title: "DE TU DEMO\nA TU LANZAMIENTO",
    steps: [
      { t: "Envía tu demo", d: "Rellena el formulario con tus enlaces. Escuchamos todo lo que llega." },
      { t: "Te respondemos", d: "Si encaja con el sello, te escribimos con los siguientes pasos." },
      { t: "Firma digital", d: "Recibes tu cuenta de artista y firmas el contrato online, sin papeles." },
      { t: "Lanzamiento y seguimiento", d: "Distribuimos en todas las plataformas y sigues streams, pagos y estado desde tu panel." },
    ],
  },
  en: {
    eyebrow: "How we work", title: "FROM YOUR DEMO\nTO YOUR RELEASE",
    steps: [
      { t: "Send your demo", d: "Fill in the form with your links. We listen to everything that comes in." },
      { t: "We reply", d: "If it fits the label, we get back to you with the next steps." },
      { t: "Digital signature", d: "You get your artist account and sign the contract online, no paperwork." },
      { t: "Release & tracking", d: "We distribute to all platforms and you follow streams, payments and status in your dashboard." },
    ],
  },
  de: {
    eyebrow: "So arbeiten wir", title: "VOM DEMO\nZUM RELEASE",
    steps: [
      { t: "Demo senden", d: "Fülle das Formular mit deinen Links aus. Wir hören uns alles an." },
      { t: "Wir melden uns", d: "Wenn es zum Label passt, schreiben wir dir die nächsten Schritte." },
      { t: "Digitale Unterschrift", d: "Du bekommst dein Künstlerkonto und unterschreibst den Vertrag online, ohne Papier." },
      { t: "Release & Tracking", d: "Wir verteilen auf allen Plattformen und du verfolgst Streams, Zahlungen und Status im Dashboard." },
    ],
  },
} as const;

export default function ProcessSteps() {
  const { locale } = useLocale();
  const copy = COPY[(locale as keyof typeof COPY)] || COPY.es;
  const lines = copy.title.split("\n");

  return (
    <section id="process" style={{ background: "var(--black)", padding: "clamp(64px,9vw,120px) clamp(20px,5vw,56px)" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px" }}>
          <div style={{ width: "32px", height: "2px", background: "#a8e63d" }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "4px", textTransform: "uppercase", color: "#a8e63d" }}>
            {copy.eyebrow}
          </span>
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(40px,7vw,88px)", lineHeight: 0.9, letterSpacing: "-1px", color: "var(--white)", marginBottom: "clamp(36px,6vw,72px)" }}>
          {lines[0]}<br />
          <span style={{ color: "transparent", WebkitTextStroke: "1.5px rgba(240,240,240,0.15)" }}>{lines[1]}</span>
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: "2px" }}>
          {copy.steps.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              style={{ background: "#0d0d0d", padding: "32px 26px", borderTop: "2px solid #a8e63d", position: "relative" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "56px", lineHeight: 1, color: "rgba(168,230,61,0.25)", display: "block", marginBottom: "18px" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", letterSpacing: "1px", color: "var(--white)", marginBottom: "10px" }}>{s.t}</p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", lineHeight: 1.9, color: "rgba(240,240,240,0.4)" }}>{s.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
