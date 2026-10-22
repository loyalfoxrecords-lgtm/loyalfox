"use client";
import { c, base, card, cardHeader, cardTitle, lbl, btnLight, Lang } from "./theme";
import ReleasePipeline, { PipeContract, PipeSubmission } from "./ReleasePipeline";

export type Overview = {
  account: {
    full_name?: string; city?: string; url_spotify_artist?: string; url_soundcloud?: string; url_apple_artist?: string;
    avatar_url?: string; paypal_email?: string; bank_iban?: string; payment_method?: string;
  };
  contracts: PipeContract[];
  submissions: PipeSubmission[];
  unread: number;
};
type Royalty = { month: string; total_streams: number; artist_share: number; paid: boolean };
type TrackRow = { store: string; streams: number; month: string };

const THRESHOLD = 50;
const fmtN = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(Math.round(n));
const usd = (n: number) => `$${n.toFixed(2)}`;

function Delta({ cur, prev, lang }: { cur: number; prev: number | null; lang: Lang }) {
  if (prev === null || prev === 0) return <span style={{ ...base, fontSize: "12px", color: c.textMute }}>{lang === "en" ? "No previous month" : "Sin mes anterior"}</span>;
  const pct = ((cur - prev) / prev) * 100;
  const up = pct >= 0;
  return (
    <span style={{ ...base, fontSize: "12px", fontWeight: 600, color: up ? c.green : c.red }}>
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}% <span style={{ fontWeight: 400, color: c.textMute }}>{lang === "en" ? "vs previous month" : "vs mes anterior"}</span>
    </span>
  );
}

export default function ArtistHome({ lang, overview, royalties, tracks, onGo }: {
  lang: Lang; overview: Overview; royalties: Royalty[]; tracks: TrackRow[];
  onGo: (tab: "contracts" | "profile" | "chat" | "payments" | "smartlinks") => void;
}) {
  const L = (es: string, en: string) => (lang === "en" ? en : es);
  const a = overview.account || {};
  const contracts = overview.contracts || [];

  // ── estado ──
  const pendingContracts = contracts.filter(x => x.status === "pending").length;
  const profileDone = !!(a.full_name && a.city && (a.url_spotify_artist || a.url_soundcloud || a.url_apple_artist));
  const paymentDone = a.payment_method === "bank" ? !!a.bank_iban : !!a.paypal_email;
  const avatarDone = !!a.avatar_url;
  const hasContracts = contracts.length > 0;
  const signedAll = hasContracts && pendingContracts === 0;
  const infoSent = hasContracts && contracts.every(ct => overview.submissions.some(s => s.contract_id === ct.id));

  const todo: { key: string; text: string; cta: string; tab: "contracts" | "profile" | "chat" }[] = [];
  if (pendingContracts > 0) todo.push({ key: "ct", tab: "contracts",
    text: lang === "en" ? `${pendingContracts} contract${pendingContracts > 1 ? "s" : ""} waiting for your signature` : `${pendingContracts} contrato${pendingContracts > 1 ? "s" : ""} por firmar`,
    cta: L("Firmar", "Sign") });
  if (!profileDone) todo.push({ key: "pf", tab: "contracts", text: L("Tu perfil está incompleto (nombre, ciudad y enlaces)", "Your profile is incomplete (name, city and links)"), cta: L("Completar", "Complete") });
  if (overview.unread > 0) todo.push({ key: "ms", tab: "chat",
    text: lang === "en" ? `${overview.unread} unread message${overview.unread > 1 ? "s" : ""}` : `${overview.unread} mensaje${overview.unread > 1 ? "s" : ""} sin leer`, cta: L("Leer", "Read") });
  if (!paymentDone) todo.push({ key: "pm", tab: "profile", text: L("Aún no has indicado cómo quieres cobrar", "You haven't set how you want to get paid"), cta: L("Añadir", "Add") });

  // ── checklist de onboarding ──
  const checklist = [
    { key: "profile", done: profileDone, label: L("Completa tu perfil de artista", "Complete your artist profile"), tab: "contracts" as const },
    { key: "avatar", done: avatarDone, label: L("Sube tu foto de perfil", "Upload your profile picture"), tab: "profile" as const },
    { key: "payment", done: paymentDone, label: L("Añade tu método de pago", "Add your payment method"), tab: "profile" as const },
    { key: "sign", done: signedAll, label: hasContracts ? L("Firma tu contrato", "Sign your contract") : L("Recibirás tu contrato de LoyalFox", "LoyalFox will send you your contract"), tab: hasContracts ? ("contracts" as const) : null },
    { key: "info", done: infoSent, label: L("Envía la info de tu lanzamiento", "Send your release info"), tab: hasContracts ? ("contracts" as const) : null },
  ];
  const doneCount = checklist.filter(i => i.done).length;
  const pct = Math.round((doneCount / checklist.length) * 100);

  // ── métricas con contexto ──
  const sorted = [...royalties].sort((x, y) => y.month.localeCompare(x.month));
  const cur = sorted[0] || null;
  const prev = sorted[1] || null;
  const pending = royalties.filter(r => !r.paid).reduce((s, r) => s + Number(r.artist_share), 0);
  const last3 = sorted.slice(0, 3);
  const avg3 = last3.length ? last3.reduce((s, r) => s + Number(r.artist_share), 0) / last3.length : 0;

  const scope = cur ? tracks.filter(t => t.month === cur.month) : [];
  const byStore: Record<string, number> = {};
  (scope.length ? scope : tracks).forEach(t => { if (t.store) byStore[t.store] = (byStore[t.store] || 0) + t.streams; });
  const storeList = Object.entries(byStore).sort((x, y) => y[1] - x[1]);
  const totalStore = storeList.reduce((s, x) => s + x[1], 0);
  const best = storeList[0];

  const now = new Date();
  const nextIdx = [0, 3, 6, 9].find(m => m > now.getMonth()) ?? 0;
  const nextDate = new Date(nextIdx === 0 ? now.getFullYear() + 1 : now.getFullYear(), nextIdx, 1);
  const monthsToPayout = Math.max(1, (nextDate.getFullYear() - now.getFullYear()) * 12 + nextDate.getMonth() - now.getMonth());
  const projected = pending + avg3 * Math.max(0, monthsToPayout - 2); // los datos llegan con ~2 meses de retraso
  const nextLabel = nextDate.toLocaleString(lang === "en" ? "en" : "es", { month: "long", year: "numeric" });
  const missing = Math.max(0, THRESHOLD - pending);
  const monthsToMin = missing > 0 && avg3 > 0 ? Math.ceil(missing / avg3) : null;

  const metric = (title: string, value: string, sub: React.ReactNode) => (
    <div style={{ ...card, padding: "18px 20px" }}>
      <p style={lbl}>{title}</p>
      <p style={{ ...base, fontSize: "26px", fontWeight: 700, color: c.text, lineHeight: 1, margin: "8px 0 6px" }}>{value}</p>
      <div>{sub}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Pendiente */}
      <div style={card}>
        <div style={cardHeader}>
          <p style={cardTitle}>{L("Lo que tienes pendiente", "What needs your attention")}</p>
          {todo.length > 0 && <span style={{ ...base, fontSize: "11px", fontWeight: 700, color: c.white, background: c.red, borderRadius: "9999px", padding: "2px 8px" }}>{todo.length}</span>}
        </div>
        {todo.length === 0 ? (
          <p style={{ ...base, fontSize: "13px", color: c.green, padding: "20px", fontWeight: 500 }}>✓ {L("Todo al día. No tienes nada pendiente.", "All caught up. Nothing pending.")}</p>
        ) : todo.map((t, i) => (
          <div key={t.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
            padding: "14px 20px", borderTop: i ? `1px solid ${c.borderLight}` : "none" }}>
            <p style={{ ...base, fontSize: "13px", color: c.text, fontWeight: 500 }}>{t.text}</p>
            <button onClick={() => onGo(t.tab)} style={{ ...btnLight, flexShrink: 0 }}>{t.cta} →</button>
          </div>
        ))}
      </div>

      {/* Onboarding */}
      {pct < 100 && (
        <div style={card}>
          <div style={cardHeader}>
            <p style={cardTitle}>{L("Primeros pasos", "Getting started")}</p>
            <span style={{ ...base, fontSize: "12px", fontWeight: 600, color: c.text }}>{doneCount}/{checklist.length}</span>
          </div>
          <div style={{ padding: "16px 20px 6px" }}>
            <div style={{ height: "8px", background: c.borderLight, borderRadius: "4px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.max(pct, 4)}%`, background: c.green, borderRadius: "4px", transition: "width .4s" }} />
            </div>
            <p style={{ ...base, fontSize: "12px", color: c.textMute, marginTop: "6px" }}>{pct}% {L("completado", "complete")}</p>
          </div>
          {checklist.map((it, i) => (
            <div key={it.key} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 20px", borderTop: i ? `1px solid ${c.borderLight}` : "none" }}>
              <span style={{ width: "20px", height: "20px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: 700, background: it.done ? c.green : c.white, color: c.white, border: `1.5px solid ${it.done ? c.green : c.border}` }}>
                {it.done ? "✓" : ""}
              </span>
              <p style={{ ...base, fontSize: "13px", flex: 1, color: it.done ? c.textMute : c.text, textDecoration: it.done ? "line-through" : "none" }}>{it.label}</p>
              {!it.done && it.tab && <button onClick={() => onGo(it.tab!)} style={{ ...base, background: "none", border: "none", color: c.blue, fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>{L("Ir", "Go")} →</button>}
            </div>
          ))}
        </div>
      )}

      {/* Métricas con contexto */}
      {cur && (
        <div className="ad-grid3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
          {metric(L("Streams del último mes", "Streams last month"), fmtN(cur.total_streams),
            <Delta cur={cur.total_streams} prev={prev ? prev.total_streams : null} lang={lang} />)}
          {metric(L("Ingresos del último mes", "Earnings last month"), usd(Number(cur.artist_share)),
            <Delta cur={Number(cur.artist_share)} prev={prev ? Number(prev.artist_share) : null} lang={lang} />)}
          {metric(L("Mejor plataforma", "Top platform"), best ? best[0] : "—",
            <span style={{ ...base, fontSize: "12px", color: c.textMute }}>
              {best && totalStore > 0 ? `${((best[1] / totalStore) * 100).toFixed(0)}% ${L("de tus streams", "of your streams")}` : L("Sin datos", "No data")}
            </span>)}
        </div>
      )}

      {/* Próximo pago */}
      <div style={{ ...card, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
          <div>
            <p style={lbl}>{L("Próximo pago", "Next payment")} · <span style={{ textTransform: "capitalize" }}>{nextLabel}</span></p>
            <p style={{ ...base, fontSize: "28px", fontWeight: 700, color: pending >= THRESHOLD ? c.green : c.text, marginTop: "6px" }}>{usd(pending)}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={lbl}>{L("Proyección estimada", "Estimated projection")}</p>
            <p style={{ ...base, fontSize: "20px", fontWeight: 600, color: c.textSub, marginTop: "6px" }}>≈ {usd(projected)}</p>
          </div>
        </div>
        <div style={{ height: "8px", background: c.borderLight, borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: "4px", width: `${Math.max(Math.min((pending / THRESHOLD) * 100, 100), 3)}%`,
            background: pending >= THRESHOLD ? c.green : pending >= THRESHOLD / 2 ? c.yellow : c.red }} />
        </div>
        <p style={{ ...base, fontSize: "13px", marginTop: "10px", color: pending >= THRESHOLD ? c.green : c.yellow, fontWeight: 500 }}>
          {pending >= THRESHOLD
            ? L(`✓ Superas el mínimo de $${THRESHOLD}. Cobrarás en ${nextLabel}.`, `✓ You are above the $${THRESHOLD} minimum. You will be paid in ${nextLabel}.`)
            : L(`Te faltan ${usd(missing)} para llegar a los $${THRESHOLD}.`, `${usd(missing)} left to reach $${THRESHOLD}.`)}
          {monthsToMin !== null && (
            <span style={{ fontWeight: 400, color: c.textMute }}>
              {" "}{L(`Al ritmo actual (~${usd(avg3)}/mes), en ~${monthsToMin} ${monthsToMin === 1 ? "mes" : "meses"}.`, `At your current pace (~${usd(avg3)}/mo), in ~${monthsToMin} month${monthsToMin === 1 ? "" : "s"}.`)}
            </span>
          )}
        </p>
        <p style={{ ...base, fontSize: "11px", color: c.textMute, marginTop: "8px" }}>
          {L("La proyección es orientativa: usa la media de tus últimos 3 meses y tiene en cuenta el retraso de ~2 meses de las plataformas.",
             "The projection is indicative: it uses your last 3 months' average and accounts for the platforms' ~2 month delay.")}
        </p>
      </div>

      <ReleasePipeline lang={lang} contracts={overview.contracts} submissions={overview.submissions} />
    </div>
  );
}
