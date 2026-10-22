"use client";
import { c, base, card, cardHeader, cardTitle, Lang } from "./theme";

export type PipeContract = { id: string; title: string; status: "pending" | "signed"; signed_at: string | null; created_at: string };
export type PipeSubmission = {
  contract_id: string; created_at?: string | null; title?: string | null;
  stage?: string | null; distribution_at?: string | null; release_date?: string | null; published_at?: string | null;
};

export function pipelineSteps(ct: PipeContract, sub: PipeSubmission | undefined, lang: Lang) {
  const L = (es: string, en: string) => (lang === "en" ? en : es);
  const stage = sub ? (sub.stage || "info") : null;
  const steps = [
    { key: "contract", label: L("Contrato", "Contract"), done: ct.status === "signed", date: ct.signed_at,
      hint: ct.status === "signed" ? "" : L("Pendiente de tu firma", "Waiting for your signature") },
    { key: "info", label: L("Info enviada", "Info sent"), done: !!sub, date: sub?.created_at || null,
      hint: sub ? "" : L("Falta enviar la info del lanzamiento", "Release info still to send") },
    { key: "distribution", label: L("En distribución", "In distribution"),
      done: stage === "distribution" || stage === "published", date: sub?.distribution_at || null,
      hint: sub?.release_date ? L("Salida prevista: ", "Planned release: ") + new Date(sub.release_date).toLocaleDateString(lang === "en" ? "en" : "es") : "" },
    { key: "published", label: L("Publicada", "Published"), done: stage === "published", date: sub?.published_at || null, hint: "" },
  ];
  const current = steps.findIndex(s => !s.done);
  return { steps, current };
}

export default function ReleasePipeline({ lang, contracts, submissions }: {
  lang: Lang; contracts: PipeContract[]; submissions: PipeSubmission[];
}) {
  const L = (es: string, en: string) => (lang === "en" ? en : es);
  const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString(lang === "en" ? "en" : "es", { day: "numeric", month: "short", year: "numeric" }) : "";

  return (
    <div style={card}>
      <div style={cardHeader}><p style={cardTitle}>{L("Tus lanzamientos", "Your releases")}</p></div>
      {contracts.length === 0 ? (
        <p style={{ ...base, fontSize: "13px", color: c.textMute, padding: "28px 20px", textAlign: "center" }}>
          {L("Cuando te enviemos un contrato, aquí verás el estado de cada canción.", "Once we send you a contract, you will see each song's status here.")}
        </p>
      ) : contracts.map((ct, idx) => {
        const sub = submissions.find(s => s.contract_id === ct.id);
        const { steps, current } = pipelineSteps(ct, sub, lang);
        const allDone = current === -1;
        return (
          <div key={ct.id} style={{ padding: "18px 20px", borderTop: idx ? `1px solid ${c.borderLight}` : "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
              <p style={{ ...base, fontSize: "14px", fontWeight: 600, color: c.text }}>{sub?.title || ct.title}</p>
              <span style={{ ...base, fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "9999px",
                color: allDone ? c.green : c.yellow, background: allDone ? c.greenBg : c.yellowBg,
                border: `1px solid ${allDone ? c.greenBorder : c.yellowBorder}` }}>
                {allDone ? L("Publicada", "Published") : steps[current].label}
              </span>
            </div>
            <div className="ad-pipe" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "8px" }}>
              {steps.map((s, i) => {
                const isCur = i === current;
                return (
                  <div key={s.key}>
                    <div style={{ height: "4px", borderRadius: "2px", marginBottom: "8px",
                      background: s.done ? c.green : isCur ? c.yellow : c.border }} />
                    <p style={{ ...base, fontSize: "12px", fontWeight: 600, color: s.done ? c.text : isCur ? c.yellow : c.textMute }}>
                      {s.done ? "✓ " : ""}{s.label}
                    </p>
                    <p style={{ ...base, fontSize: "11px", color: c.textMute, marginTop: "2px", lineHeight: 1.5 }}>
                      {s.done ? fmt(s.date) : s.hint}
                      {s.done && s.hint ? ` · ${s.hint}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
