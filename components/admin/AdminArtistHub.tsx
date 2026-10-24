"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { css, hs } from "./styles";

const THRESHOLD = 50;
const f: React.CSSProperties = { fontFamily: "system-ui, -apple-system, sans-serif" };
const usd = (n: number) => `$${n.toFixed(2)}`;
const ym = (m: string) => String(m).slice(0, 7);
const monthLabel = (m: string) => { try { return new Date(ym(m) + "-02").toLocaleString("es", { month: "short", year: "numeric" }); } catch { return m; } };
const maskIban = (v: string) => { const s = (v || "").replace(/\s+/g, ""); return s.length < 8 ? s : `${s.slice(0, 4)} •••• ${s.slice(-4)}`; };

type Account = {
  id: string; name: string; artist_name: string; email: string; active: boolean;
  royalty_percent: number | null; is_own_artist: boolean; payment_method: string;
  paypal_email: string; bank_iban: string; avatar_url?: string; full_name?: string; city?: string;
  url_spotify_artist?: string; url_soundcloud?: string; url_apple_artist?: string;
  last_seen_at?: string | null;
};
type Royalty = { id: string; artist_name: string; month: string; total_streams: number; gross_revenue: number; artist_share: number; paid: boolean; paid_at: string | null };
type Contract = { id: string; artist_account_id: string; title: string; status: "pending" | "signed"; signed_at: string | null; created_at: string; pdf_url: string; signed_pdf_url: string | null };
type Track = { id: string; name: string; artist: string; slug?: string; image_url?: string | null };
type LineLite = { artist_name: string | null; title: string; net: number };
type Sub = { contract_id: string; stage?: string | null; release_date?: string | null };

async function all<T>(table: string, cols = "*"): Promise<T[]> {
  const out: T[] = []; let from = 0;
  for (;;) {
    const { data, error } = await supabase.from(table).select(cols).range(from, from + 999);
    if (error) return out;
    if (!data?.length) break;
    out.push(...(data as T[]));
    if (data.length < 1000) break;
    from += 1000;
  }
  return out;
}

const ago = (d?: string | null) => {
  if (!d) return "Nunca";
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 5) return "Ahora mismo";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60); if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24); if (days < 30) return `hace ${days} ${days === 1 ? "día" : "días"}`;
  const mo = Math.floor(days / 30); return `hace ${mo} ${mo === 1 ? "mes" : "meses"}`;
};
const seenTone = (d?: string | null): "green" | "yellow" | "red" | "grey" => {
  if (!d) return "red";
  const days = (Date.now() - new Date(d).getTime()) / 86400000;
  return days < 14 ? "green" : days < 60 ? "yellow" : "red";
};

const methodOf = (a: Account) => a.payment_method === "bank" ? "IBAN" : a.payment_method === "both" ? "PayPal + IBAN" : "PayPal";
const destOf = (a: Account) => a.payment_method === "bank" ? a.bank_iban : a.payment_method === "both" ? [a.paypal_email, a.bank_iban].filter(Boolean).join("  ·  ") : a.paypal_email;

function Chip({ text, tone }: { text: string; tone: "green" | "yellow" | "red" | "grey" | "blue" }) {
  const m = { green: [css.green, css.greenBg, css.greenBorder], yellow: [css.yellow, css.yellowBg, css.yellowBorder], red: [css.red, css.redBg, css.redBorder], blue: [css.blue, css.blueBg, css.blueBorder], grey: [css.textSub, css.bg, css.border] }[tone];
  return <span style={{ ...f, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 9999, color: m[0], background: m[1], border: `1px solid ${m[2]}`, whiteSpace: "nowrap" }}>{text}</span>;
}

function Avatar({ a, size = 32 }: { a: Account; size?: number }) {
  return a.avatar_url
    ? <img src={a.avatar_url} alt="" width={size} height={size} style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    : <div style={{ ...f, width: size, height: size, borderRadius: "50%", background: css.accentBg, color: css.text, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: size * 0.4, flexShrink: 0 }}>{a.artist_name[0]?.toUpperCase()}</div>;
}

type Row = {
  a: Account; tracks: Track[]; generated: number; paid: number; pending: number; unpaid: Royalty[];
  contracts: Contract[]; signed: number; ready: boolean; hasMethod: boolean;
};

function Drawer({ row, royalties, lines, subs, onClose, onPaid, onNavigate }: {
  row: Row; royalties: Royalty[]; lines: LineLite[]; subs: Sub[]; onClose: () => void; onPaid: () => void; onNavigate: (t: string) => void;
}) {
  const { a } = row;
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const months = royalties.filter(r => r.artist_name === a.artist_name).sort((x, y) => String(y.month).localeCompare(String(x.month)));
  const byTitle: Record<string, number> = {};
  lines.filter(l => l.artist_name === a.artist_name).forEach(l => { const k = l.title.toLowerCase(); byTitle[k] = (byTitle[k] || 0) + Number(l.net); });
  const pct = (a.royalty_percent ?? 60) / 100;

  const pay = async () => {
    if (!confirm(`¿Marcar como pagados ${usd(row.pending)} a ${a.artist_name}?\nSe le avisará por email.`)) return;
    setBusy(true);
    await supabase.from("artist_royalties").update({ paid: true, paid_at: new Date().toISOString() }).in("id", row.unpaid.map(u => u.id));
    await fetch("/api/notify-payment", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: a.email, name: a.name, artist_name: a.artist_name, amount: row.pending, method: a.payment_method, paypal: a.paypal_email, iban: a.bank_iban }) }).catch(() => {});
    setBusy(false); onPaid();
  };
  const viewAs = async () => {
    const r = await fetch("/api/admin/impersonate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ artist_account_id: a.id }) });
    if (r.ok) window.open("/artists-portal", "_blank"); else alert("No se pudo abrir su panel");
  };
  const copy = async () => { try { await navigator.clipboard.writeText(a.payment_method === "bank" ? a.bank_iban : a.paypal_email || a.bank_iban); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* sin permiso */ } };
  const section = (t: string) => <p style={{ ...f, fontSize: 11, fontWeight: 600, color: css.textMute, textTransform: "uppercase", letterSpacing: "0.05em", margin: "22px 0 10px" }}>{t}</p>;
  const stat = (l: string, v: string, c: string = css.text) => (
    <div style={{ padding: "12px 14px", background: css.bg, borderRadius: 8, flex: 1, minWidth: 90 }}>
      <p style={{ ...f, fontSize: 11, color: css.textMute }}>{l}</p><p style={{ ...f, fontSize: 18, fontWeight: 700, color: c, marginTop: 2 }}>{v}</p>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} />
      <div style={{ position: "relative", width: "min(580px,100vw)", background: css.white, height: "100%", overflowY: "auto", padding: "20px 22px 40px", boxShadow: "-8px 0 30px rgba(0,0,0,0.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar a={a} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ ...f, fontSize: 18, fontWeight: 700, color: css.text }}>{a.artist_name}</p>
            <p style={{ ...f, fontSize: 12, color: css.textMute }}>{a.full_name || a.name} · {a.email}{a.city ? ` · ${a.city}` : ""}</p>
          </div>
          <button onClick={onClose} style={{ ...f, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: css.textMute }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          <Chip text={`Última conexión: ${ago(a.last_seen_at)}`} tone={seenTone(a.last_seen_at)} />
          {[["Spotify", a.url_spotify_artist], ["SoundCloud", a.url_soundcloud], ["Apple Music", a.url_apple_artist]].filter(x => x[1]).map(x => (
            <a key={x[0]} href={x[1]} target="_blank" rel="noreferrer" style={{ ...f, fontSize: 12, color: css.blue, textDecoration: "none" }}>{x[0]} ↗</a>
          ))}
        </div>

        {section("Dinero")}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {stat("Ha generado (su parte)", usd(row.generated))}
          {stat("Ya cobrado", usd(row.paid), css.green)}
          {stat("Falta por pagar", usd(row.pending), row.ready ? css.yellow : css.text)}
        </div>
        <p style={{ ...f, fontSize: 12, color: css.textMute, marginTop: 8 }}>
          {a.is_own_artist ? "Artista propio: todo el bruto es del sello." : `Recibe el ${Math.round(pct * 100)}% de lo que genera. ${row.ready ? "Supera el mínimo: listo para pagar." : `Faltan ${usd(Math.max(0, THRESHOLD - row.pending))} para el mínimo de $${THRESHOLD}.`}`}
        </p>

        {!a.is_own_artist && (<>
          {section("Cómo se le paga")}
          <div style={{ padding: "12px 14px", border: `1px solid ${row.hasMethod ? css.border : css.redBorder}`, background: row.hasMethod ? css.white : css.redBg, borderRadius: 8, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <p style={{ ...f, fontSize: 13, fontWeight: 600, color: row.hasMethod ? css.text : css.red }}>{row.hasMethod ? methodOf(a) : "⚠ Sin método de pago"}</p>
              <p style={{ ...f, fontSize: 12, color: css.textSub, wordBreak: "break-all" }}>{destOf(a) || "El artista debe añadirlo en su perfil"}</p>
            </div>
            {row.hasMethod && <button style={hs.btnSmall} onClick={copy}>{copied ? "✓ Copiado" : "Copiar"}</button>}
          </div>
          <button disabled={busy || row.pending <= 0} onClick={pay}
            style={{ ...hs.btnGreen, marginTop: 10, opacity: busy || row.pending <= 0 ? 0.5 : 1 }}>
            {busy ? "…" : `Marcar ${usd(row.pending)} como pagado`}
          </button>
        </>)}

        {section(`Canciones (${row.tracks.length})`)}
        {row.tracks.length === 0 && <p style={{ ...f, fontSize: 13, color: css.textMute }}>Aún no tiene canciones en el catálogo.</p>}
        {row.tracks.map(t => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${css.borderLight}` }}>
            {t.image_url ? <img src={t.image_url} alt="" width={36} height={36} style={{ borderRadius: 6, objectFit: "cover" }} /> : <div style={{ width: 36, height: 36, borderRadius: 6, background: css.accentBg }} />}
            <p style={{ ...f, flex: 1, fontSize: 13, fontWeight: 500, color: css.text }}>{t.name}</p>
            {byTitle[t.name.toLowerCase()] !== undefined && <span style={{ ...f, fontSize: 12, color: css.green, fontWeight: 600 }}>{usd(byTitle[t.name.toLowerCase()] * (a.is_own_artist ? 1 : pct))}</span>}
          </div>
        ))}
        {Object.keys(byTitle).length > 0 && <p style={{ ...f, fontSize: 11, color: css.textMute, marginTop: 6 }}>El importe por canción es la parte del artista, calculada desde las importaciones de Regalías.</p>}

        {section(`Contratos (${row.signed}/${row.contracts.length} firmados)`)}
        {row.contracts.length === 0 && <p style={{ ...f, fontSize: 13, color: css.textMute }}>Sin contratos. Súbelo desde la pestaña Contratos.</p>}
        {row.contracts.map(c => {
          const sub = subs.find(s => s.contract_id === c.id);
          const stage = !sub ? "Sin info de lanzamiento" : sub.stage === "published" ? "Publicada" : sub.stage === "distribution" ? "En distribución" : "Info recibida";
          return (
            <div key={c.id} style={{ padding: "10px 0", borderBottom: `1px solid ${css.borderLight}`, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <p style={{ ...f, fontSize: 13, fontWeight: 500, color: css.text }}>{c.title}</p>
                <p style={{ ...f, fontSize: 11, color: css.textMute }}>{c.status === "signed" && c.signed_at ? `Firmado el ${new Date(c.signed_at).toLocaleDateString("es")}` : "Pendiente de firma"} · {stage}</p>
              </div>
              <Chip text={c.status === "signed" ? "Firmado" : "Pendiente"} tone={c.status === "signed" ? "green" : "yellow"} />
              <a href={c.signed_pdf_url || c.pdf_url} target="_blank" rel="noreferrer" style={{ ...f, fontSize: 12, color: css.blue, textDecoration: "none" }}>PDF ↗</a>
            </div>
          );
        })}

        {section("Mes a mes")}
        {months.length === 0 && <p style={{ ...f, fontSize: 13, color: css.textMute }}>Sin regalías todavía.</p>}
        {months.slice(0, 8).map(m => (
          <div key={m.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${css.borderLight}`, ...f, fontSize: 13 }}>
            <span style={{ textTransform: "capitalize", color: css.text }}>{monthLabel(m.month)}</span>
            <span><b>{usd(Number(m.artist_share))}</b> <span style={{ marginLeft: 8 }}><Chip text={m.paid ? "Pagado" : "Pendiente"} tone={m.paid ? "green" : "yellow"} /></span></span>
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
          <button style={{ ...hs.btnSmall, background: css.accent, color: "#fff", border: `1px solid ${css.accent}` }} onClick={viewAs}>Ver su panel</button>
          <button style={hs.btnSmall} onClick={() => onNavigate("messages")}>Escribirle</button>
          <button style={hs.btnSmall} onClick={() => onNavigate("contracts")}>Contratos</button>
          <button style={hs.btnSmall} onClick={() => onNavigate("artist-accounts")}>Editar cuenta</button>
        </div>
      </div>
    </div>
  );
}

type Filter = "all" | "ready" | "nomethod" | "contract" | "own" | "never";

export default function AdminArtistHub({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [royalties, setRoyalties] = useState<Royalty[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [lines, setLines] = useState<LineLite[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [acc, roy, ct, tr, ln] = await Promise.all([
      all<Account>("artist_accounts"), all<Royalty>("artist_royalties"), all<Contract>("artist_contracts"),
      all<Track>("tracks", "id,name,artist,slug,image_url"), all<LineLite>("royalty_lines", "artist_name,title,net"),
    ]);
    setAccounts(acc); setRoyalties(roy); setContracts(ct); setTracks(tr); setLines(ln);
    try { const r = await fetch("/api/admin/release-submissions"); if (r.ok) setSubs((await r.json()).submissions || []); } catch { /* opcional */ }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows: Row[] = useMemo(() => accounts.filter(a => a.active !== false).map(a => {
    const rs = royalties.filter(r => r.artist_name === a.artist_name);
    const unpaid = rs.filter(r => !r.paid);
    const cs = contracts.filter(c => c.artist_account_id === a.id);
    const pending = unpaid.reduce((s, r) => s + Number(r.artist_share), 0);
    return {
      a, unpaid, pending,
      tracks: tracks.filter(t => (t.artist || "").toLowerCase() === a.artist_name.toLowerCase()),
      generated: a.is_own_artist ? rs.reduce((s, r) => s + Number(r.gross_revenue), 0) : rs.reduce((s, r) => s + Number(r.artist_share), 0),
      paid: rs.filter(r => r.paid).reduce((s, r) => s + Number(r.artist_share), 0),
      contracts: cs, signed: cs.filter(c => c.status === "signed").length,
      ready: !a.is_own_artist && pending >= THRESHOLD,
      hasMethod: !!destOf(a),
    };
  }).sort((x, y) => y.pending - x.pending), [accounts, royalties, contracts, tracks]);

  const ext = rows.filter(r => !r.a.is_own_artist);
  const owed = ext.reduce((s, r) => s + r.pending, 0);
  const ready = ext.filter(r => r.ready);
  const readyTotal = ready.reduce((s, r) => s + r.pending, 0);
  const paidTotal = ext.reduce((s, r) => s + r.paid, 0);
  const byMethod = ready.reduce((acc: Record<string, number>, r) => { const k = r.hasMethod ? methodOf(r.a) : "Sin método"; acc[k] = (acc[k] || 0) + r.pending; return acc; }, {});
  const pendingContracts = contracts.filter(c => c.status === "pending").length;
  const noContract = rows.filter(r => !r.a.is_own_artist && r.contracts.length === 0).length;

  const shown = rows.filter(r => {
    if (q && !`${r.a.artist_name} ${r.a.name} ${r.a.email}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (filter === "ready") return r.ready;
    if (filter === "nomethod") return !r.a.is_own_artist && !r.hasMethod && r.pending > 0;
    if (filter === "contract") return !r.a.is_own_artist && (r.contracts.length === 0 || r.signed < r.contracts.length);
    if (filter === "own") return r.a.is_own_artist;
    if (filter === "never") return !r.a.last_seen_at;
    return true;
  });
  const counts = {
    all: rows.length, ready: ready.length,
    nomethod: rows.filter(r => !r.a.is_own_artist && !r.hasMethod && r.pending > 0).length,
    contract: rows.filter(r => !r.a.is_own_artist && (r.contracts.length === 0 || r.signed < r.contracts.length)).length,
    own: rows.filter(r => r.a.is_own_artist).length,
    never: rows.filter(r => !r.a.last_seen_at).length,
  };
  const openRow = rows.find(r => r.a.id === open);

  const now = new Date();
  const nextIdx = [0, 3, 6, 9].find(m => m > now.getMonth()) ?? 0;
  const next = new Date(nextIdx === 0 ? now.getFullYear() + 1 : now.getFullYear(), nextIdx, 1).toLocaleString("es", { month: "long", year: "numeric" });

  const kpi = (label: string, value: string, sub: string, color: string = css.text, onClick?: () => void) => (
    <div onClick={onClick} style={{ ...hs.card, padding: "16px 18px", cursor: onClick ? "pointer" : "default" }}>
      <p style={{ ...f, fontSize: 11, color: css.textMute, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
      <p style={{ ...f, fontSize: 26, fontWeight: 700, color, margin: "6px 0 2px" }}>{value}</p>
      <p style={{ ...f, fontSize: 12, color: css.textMute }}>{sub}</p>
    </div>
  );
  const th: React.CSSProperties = { ...f, padding: "9px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: css.textMute, background: css.bg, borderBottom: `1px solid ${css.border}`, textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { ...f, padding: "11px 14px", fontSize: 13, color: css.text, borderBottom: `1px solid ${css.borderLight}`, verticalAlign: "middle" };

  if (loading) return <p style={{ ...f, fontSize: 13, color: css.textMute }}>Cargando…</p>;

  return (
    <div style={{ maxWidth: 1200 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 16 }}>
        {kpi("Te falta por pagar", usd(owed), `a ${ext.filter(r => r.pending > 0).length} artistas`, owed > 0 ? css.text : css.textMute)}
        {kpi("Listo para pagar ya", usd(readyTotal), `${ready.length} artista(s) con ≥ $${THRESHOLD}`, ready.length ? css.yellow : css.textMute, () => setFilter("ready"))}
        {kpi("Ya pagado", usd(paidTotal), "Histórico a artistas", css.green)}
        {kpi("Contratos por firmar", String(pendingContracts), noContract ? `${noContract} artista(s) sin contrato` : "Todos al día", pendingContracts ? css.yellow : css.text, () => setFilter("contract"))}
      </div>

      <div style={{ ...hs.card, padding: "14px 18px", marginBottom: 16 }}>
        <p style={{ ...f, fontSize: 13, fontWeight: 600, color: css.text, marginBottom: 6 }}>
          Próximo ciclo de pagos: <span style={{ textTransform: "capitalize" }}>{next}</span>
        </p>
        {ready.length === 0 ? <p style={{ ...f, fontSize: 13, color: css.textMute }}>Nadie supera todavía los ${THRESHOLD}.</p> : (
          <p style={{ ...f, fontSize: 13, color: css.textSub, lineHeight: 1.8 }}>
            Pagarías <b>{usd(readyTotal)}</b> a {ready.length} artista(s):{" "}
            {Object.entries(byMethod).map(([k, v], i) => <span key={k}>{i > 0 && " · "}{k} <b style={{ color: k === "Sin método" ? css.red : css.text }}>{usd(v)}</b></span>)}
            {" "}<span style={{ color: css.blue, cursor: "pointer" }} onClick={() => onNavigate("royalties")}>Ir a Pagos →</span>
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
        {([["all", "Todos"], ["ready", "Para pagar"], ["nomethod", "Sin método de pago"], ["contract", "Contrato pendiente"], ["own", "Propios"], ["never", "Nunca han entrado"]] as [Filter, string][]).map(([id, l]) => (
          <button key={id} onClick={() => setFilter(id)} style={{ ...f, fontSize: 12, fontWeight: 500, padding: "6px 12px", borderRadius: 9999, cursor: "pointer",
            border: `1px solid ${filter === id ? css.accent : css.border}`, background: filter === id ? css.accent : css.white, color: filter === id ? "#fff" : css.textSub }}>
            {l} <span style={{ opacity: 0.7 }}>{counts[id]}</span>
          </button>
        ))}
        <input placeholder="Buscar artista…" value={q} onChange={e => setQ(e.target.value)} style={{ ...hs.input, width: 200, marginLeft: "auto" }} />
      </div>

      <div style={hs.card}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 960 }}>
            <thead><tr>
              <th style={th}>Artista</th><th style={th}>Canciones</th><th style={th}>Ha generado</th><th style={th}>Falta por pagar</th><th style={th}>Cómo cobra</th><th style={th}>Contrato</th><th style={th}>Última conexión</th>
            </tr></thead>
            <tbody>
              {shown.map(r => (
                <tr key={r.a.id} onClick={() => setOpen(r.a.id)} style={{ cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = css.bg)} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar a={r.a} />
                      <div><p style={{ fontWeight: 600 }}>{r.a.artist_name}</p><p style={{ fontSize: 11, color: css.textMute }}>{r.a.is_own_artist ? "Artista propio" : `${r.a.royalty_percent ?? 60}% para el artista`}</p></div>
                    </div>
                  </td>
                  <td style={td}>{r.tracks.length}</td>
                  <td style={td}><b>{usd(r.generated)}</b></td>
                  <td style={td}>
                    {r.a.is_own_artist ? <span style={{ color: css.textMute }}>—</span> : (
                      <div style={{ minWidth: 120 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <b style={{ color: r.ready ? css.yellow : css.text }}>{usd(r.pending)}</b>
                          {r.ready && <Chip text="Listo" tone="yellow" />}
                        </div>
                        <div style={{ height: 4, background: css.borderLight, borderRadius: 2, marginTop: 5 }}>
                          <div style={{ height: "100%", width: `${Math.min(100, (r.pending / THRESHOLD) * 100)}%`, background: r.ready ? css.yellow : css.border, borderRadius: 2 }} />
                        </div>
                      </div>
                    )}
                  </td>
                  <td style={td}>
                    {r.a.is_own_artist ? <span style={{ color: css.textMute }}>—</span> : r.hasMethod
                      ? <div><p style={{ fontSize: 12, fontWeight: 600 }}>{methodOf(r.a)}</p><p style={{ fontSize: 11, color: css.textMute }}>{r.a.payment_method === "bank" ? maskIban(r.a.bank_iban) : r.a.paypal_email || maskIban(r.a.bank_iban)}</p></div>
                      : <Chip text="Sin método" tone="red" />}
                  </td>
                  <td style={td}>
                    {r.contracts.length === 0 ? <Chip text="Sin contrato" tone="grey" />
                      : r.signed === r.contracts.length ? <Chip text={`✓ ${r.signed} firmado${r.signed > 1 ? "s" : ""}`} tone="green" />
                      : <Chip text={`${r.contracts.length - r.signed} por firmar`} tone="yellow" />}
                  </td>
                  <td style={td}><Chip text={ago(r.a.last_seen_at)} tone={seenTone(r.a.last_seen_at)} /></td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={7} style={{ ...td, textAlign: "center", color: css.textMute, padding: 40 }}>Ningún artista con este filtro.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {openRow && <Drawer row={openRow} royalties={royalties} lines={lines} subs={subs} onClose={() => setOpen(null)} onPaid={load} onNavigate={t => { setOpen(null); onNavigate(t); }} />}
    </div>
  );
}
