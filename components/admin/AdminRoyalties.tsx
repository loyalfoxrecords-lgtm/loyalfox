"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/lib/supabase";
import { css, hs } from "./styles";
import {
  norm, parseRow, resolveLines, suggest, pairKey, sha256,
  RawLine, ResolvedLine, Account as RAccount,
} from "@/lib/royalties";

const THRESHOLD = 50;
const f: React.CSSProperties = { fontFamily: "system-ui, -apple-system, sans-serif" };
const usd = (n: number) => `$${n.toFixed(2)}`;
const usd4 = (n: number) => `$${n.toFixed(4)}`;
const ymLabel = (m: string) => { try { return new Date(m.slice(0, 7) + "-02").toLocaleString("es", { month: "short", year: "numeric" }); } catch { return m; } };

type Account = RAccount & {
  id: string; name: string; email: string; active: boolean; payment_method: string;
  paypal_email: string; bank_iban: string; royalty_percent: number; is_own_artist: boolean;
};
type Royalty = { id: string; artist_name: string; month: string; total_streams: number; gross_revenue: number; artist_share: number; paid: boolean; paid_at: string | null };
type Line = { artist_name: string | null; artist_raw: string; isrc: string; title: string; store: string; month: string; net: number };
type ImportRow = { id: string; filename: string; rows: number; total: number; created_at: string };
type Change = { artist: string; month: string; before: number; after: number; paid: boolean };

async function fetchAll<T>(table: string, cols: string, order?: string): Promise<T[]> {
  const out: T[] = []; let from = 0;
  for (;;) {
    let q = supabase.from(table).select(cols);
    if (order) q = q.order(order, { ascending: false });
    const { data, error } = await q.range(from, from + 999);
    if (error) throw error;
    if (!data || !data.length) break;
    out.push(...(data as T[]));
    if (data.length < 1000) break;
    from += 1000;
  }
  return out;
}

const kpi = (label: string, value: string, sub?: string, color: string = css.text) => (
  <div key={label} style={{ ...hs.card, padding: "16px 18px" }}>
    <p style={{ ...f, fontSize: "11px", color: css.textMute, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
    <p style={{ ...f, fontSize: "24px", fontWeight: 700, color, margin: "6px 0 2px" }}>{value}</p>
    {sub && <p style={{ ...f, fontSize: "11px", color: css.textMute }}>{sub}</p>}
  </div>
);

const th: React.CSSProperties = { ...f, padding: "9px 14px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: css.textMute, borderBottom: `1px solid ${css.border}`, textTransform: "uppercase", letterSpacing: "0.04em", background: css.bg };
const td: React.CSSProperties = { ...f, padding: "10px 14px", fontSize: "13px", color: css.text, borderBottom: `1px solid ${css.borderLight}` };

function AccountSelect({ value, onChange, accounts, placeholder }: { value: string; onChange: (v: string) => void; accounts: Account[]; placeholder: string }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{ ...hs.input, width: "190px", appearance: "none" as any }}>
      <option value="">{placeholder}</option>
      {accounts.map(a => <option key={a.id} value={a.artist_name}>{a.artist_name}</option>)}
    </select>
  );
}

// ───────────────────────── RESUMEN ─────────────────────────
function Summary({ accounts, royalties, lines }: { accounts: Account[]; royalties: Royalty[]; lines: Line[] }) {
  const own = new Set(accounts.filter(a => a.is_own_artist).map(a => a.artist_name));
  const ext = royalties.filter(r => !own.has(r.artist_name));
  const gross = royalties.reduce((s, r) => s + Number(r.gross_revenue), 0);
  const toArtists = ext.reduce((s, r) => s + Number(r.artist_share), 0);
  const label = gross - toArtists;
  const owed = ext.filter(r => !r.paid).reduce((s, r) => s + Number(r.artist_share), 0);
  const paid = ext.filter(r => r.paid).reduce((s, r) => s + Number(r.artist_share), 0);
  const unassigned = lines.filter(l => !l.artist_name).reduce((s, l) => s + Number(l.net), 0);

  const byMonth: Record<string, { month: string; Artistas: number; Sello: number }> = {};
  royalties.forEach(r => {
    const m = String(r.month).slice(0, 7);
    byMonth[m] ||= { month: m, Artistas: 0, Sello: 0 };
    const share = own.has(r.artist_name) ? 0 : Number(r.artist_share);
    byMonth[m].Artistas += share;
    byMonth[m].Sello += Number(r.gross_revenue) - share;
  });
  const chart = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)).map(x => ({ ...x, label: ymLabel(x.month) }));

  const top = Object.entries(royalties.reduce((acc: Record<string, number>, r) => { acc[r.artist_name] = (acc[r.artist_name] || 0) + Number(r.gross_revenue); return acc; }, {}))
    .sort((a, b) => b[1] - a[1]).slice(0, 6);
  const stores = Object.entries(lines.reduce((acc: Record<string, number>, l) => { if (l.store) acc[l.store] = (acc[l.store] || 0) + Number(l.net); return acc; }, {}))
    .sort((a, b) => b[1] - a[1]).slice(0, 6);

  const noMethod = accounts.filter(a => !a.is_own_artist && a.active).filter(a => {
    const pend = royalties.filter(r => r.artist_name === a.artist_name && !r.paid).reduce((s, r) => s + Number(r.artist_share), 0);
    const has = a.payment_method === "bank" ? !!a.bank_iban : a.payment_method === "both" ? (!!a.bank_iban || !!a.paypal_email) : !!a.paypal_email;
    return pend >= THRESHOLD && !has;
  });

  const alerts: string[] = [];
  if (unassigned > 0.005) alerts.push(`${usd(unassigned)} de regalías sin asignar a ningún artista (pestaña "Sin asignar").`);
  if (noMethod.length) alerts.push(`${noMethod.map(a => a.artist_name).join(", ")}: superan $${THRESHOLD} pero no tienen método de pago.`);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {alerts.length > 0 && (
        <div style={{ padding: "12px 16px", borderRadius: "8px", background: css.yellowBg, border: `1px solid ${css.yellowBorder}` }}>
          {alerts.map((a, i) => <p key={i} style={{ ...f, fontSize: "13px", color: css.yellow }}>⚠ {a}</p>)}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "12px" }}>
        {kpi("Ingresos brutos", usd(gross), "Todo lo que ha generado el catálogo")}
        {kpi("Margen del sello", usd(label), gross ? `${((label / gross) * 100).toFixed(0)}% del bruto` : "", css.green)}
        {kpi("Pagado a artistas", usd(paid), "", css.text)}
        {kpi("Debes a artistas", usd(owed), "Pendiente de pago", owed >= THRESHOLD ? css.yellow : css.text)}
        {kpi("Sin asignar", usd(unassigned), "Dinero sin artista", unassigned > 0.005 ? css.red : css.text)}
      </div>

      <div style={hs.card}>
        <div style={hs.cardHeader}><p style={hs.cardTitle}>Ingresos por mes: artistas vs sello</p></div>
        <div style={{ padding: "16px", height: 260 }}>
          {chart.length === 0 ? <p style={{ ...f, fontSize: "13px", color: css.textMute, textAlign: "center", padding: "60px 0" }}>Importa tu primer CSV para ver datos.</p> : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: css.textMute }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: css.textMute }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip formatter={(v: any) => usd(Number(v))} />
                <Legend />
                <Bar dataKey="Artistas" stackId="a" fill={css.blue} />
                <Bar dataKey="Sello" stackId="a" fill={css.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "16px" }}>
        <div style={hs.card}>
          <div style={hs.cardHeader}><p style={hs.cardTitle}>Top artistas (bruto)</p></div>
          {top.map(([n, v]) => <div key={n} style={{ ...td, display: "flex", justifyContent: "space-between" }}><span>{n}</span><b>{usd(v)}</b></div>)}
          {top.length === 0 && <p style={{ ...td, color: css.textMute }}>Sin datos</p>}
        </div>
        <div style={hs.card}>
          <div style={hs.cardHeader}><p style={hs.cardTitle}>Por plataforma (importaciones nuevas)</p></div>
          {stores.map(([n, v]) => <div key={n} style={{ ...td, display: "flex", justifyContent: "space-between" }}><span>{n}</span><b>{usd(v)}</b></div>)}
          {stores.length === 0 && <p style={{ ...td, color: css.textMute }}>Aparecerá al importar con el nuevo sistema</p>}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── IMPORTAR ─────────────────────────
type Group = { key: string; label: string; net: number; count: number; isrc?: string; raw?: string; suggestion: string | null };

function ImportTab({ accounts, royalties, aliases, isrcMap, lineSums, onDone }: {
  accounts: Account[]; royalties: Royalty[]; aliases: Record<string, string>; isrcMap: Record<string, string>;
  lineSums: Record<string, number>; onDone: () => void;
}) {
  const [file, setFile] = useState<{ name: string; hash: string; total: number; rows: number; skipped: number } | null>(null);
  const [resolved, setResolved] = useState<ResolvedLine[]>([]);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [changes, setChanges] = useState<Change[] | null>(null);

  const onFile = async (fl: File) => {
    setMsg(null); setChanges(null); setDecisions({}); setAck(false);
    const text = await fl.text();
    const hash = await sha256(text);
    const parsed = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), { header: true, skipEmptyLines: true });
    const raw: RawLine[] = []; let skipped = 0;
    parsed.data.forEach(r => { const l = parseRow(r); if (l) raw.push(l); else skipped++; });
    if (!raw.length) { setMsg({ ok: false, text: "No se reconoce el formato: faltan las columnas Artist, Month y Recipient Net Royalty." }); return; }
    setResolved(resolveLines(raw, accounts, aliases, isrcMap));
    setFile({ name: fl.name, hash, total: raw.reduce((s, l) => s + l.net, 0), rows: raw.length, skipped });
  };

  // aplica decisiones manuales a lo no resuelto
  const effective = useMemo(() => resolved.map(l => {
    if (l.artist_name) return l;
    const k = l.artist_raw ? norm(l.artist_raw) : `isrc:${l.isrc}`;
    const d = decisions[k];
    return d ? { ...l, artist_name: d, via: "alias" as const } : l;
  }), [resolved, decisions]);

  const groups: Group[] = useMemo(() => {
    const m: Record<string, Group> = {};
    resolved.filter(l => !l.artist_name).forEach(l => {
      const k = l.artist_raw ? norm(l.artist_raw) : `isrc:${l.isrc}`;
      m[k] ||= { key: k, label: l.artist_raw || `(sin artista) ${l.title || l.isrc || "?"}`, net: 0, count: 0, isrc: l.artist_raw ? undefined : l.isrc, raw: l.artist_raw || undefined, suggestion: l.artist_raw ? suggest(l.artist_raw, accounts) : null };
      m[k].net += l.net; m[k].count++;
    });
    return Object.values(m).sort((a, b) => b.net - a.net);
  }, [resolved, accounts]);

  const matched = effective.filter(l => l.artist_name);
  const unassignedNet = effective.filter(l => !l.artist_name).reduce((s, l) => s + l.net, 0);
  const viaIsrc = matched.filter(l => l.via === "isrc").reduce((s, l) => s + l.net, 0);

  const impacts = useMemo(() => {
    const fileSum: Record<string, number> = {};
    matched.forEach(l => { const k = pairKey(l.artist_name!, l.month); fileSum[k] = (fileSum[k] || 0) + l.net; });
    return Object.entries(fileSum).map(([k, add]) => {
      const [artist, ym] = k.split("||");
      const row = royalties.find(r => r.artist_name === artist && String(r.month).slice(0, 7) === ym);
      const acc = accounts.find(a => a.artist_name === artist);
      const pct = (acc?.royalty_percent ?? 60) / 100;
      const dbLines = lineSums[k] || 0;
      const legacy = !!row && Number(row.gross_revenue) > 0 && Math.abs(Number(row.gross_revenue) - dbLines) > 0.001;
      const afterGross = dbLines + add;
      const paidChange = !!row?.paid && Math.abs(afterGross * pct - Number(row.artist_share)) > 0.00005;
      return { artist, ym, add, before: row ? Number(row.gross_revenue) : 0, after: afterGross, legacy, paidChange };
    }).sort((a, b) => a.ym.localeCompare(b.ym) || a.artist.localeCompare(b.artist));
  }, [matched, royalties, accounts, lineSums]);

  const legacyCount = impacts.filter(i => i.legacy).length;
  const paidCount = impacts.filter(i => i.paidChange).length;
  const canCommit = !!file && matched.length > 0 && (legacyCount === 0 || ack) && !busy;

  const commit = async () => {
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      const post = async (body: any) => {
        const r = await fetch("/api/admin/royalties/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw Object.assign(new Error(d.error || "error"), { data: d });
        return d;
      };
      const init = await post({ phase: "init", filename: file.name, hash: file.hash, rows: file.rows, total: file.total });
      const send = effective.map(l => ({ artist_raw: l.artist_raw, artist_name: l.artist_name, isrc: l.isrc, title: l.title, store: l.store, country: l.country, month: l.month, quantity: l.quantity, net: l.net }));
      for (let i = 0; i < send.length; i += 1500) await post({ phase: "lines", import_id: init.import_id, lines: send.slice(i, i + 1500) });
      const newAliases = groups.filter(g => g.raw && decisions[g.key]).map(g => ({ alias_norm: g.key, artist_name: decisions[g.key] }));
      const fin = await post({ phase: "finish", import_id: init.import_id, aliases: newAliases });
      setChanges(fin.changes);
      setMsg({ ok: true, text: `Importadas ${send.length} líneas (${usd(file.total)}).` });
      setFile(null); setResolved([]);
      onDone();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message === "duplicate" ? `Este archivo ya se importó antes (${e.data?.filename}). No se ha duplicado nada.` : `Error: ${e.message}. Si la importación quedó a medias, deshazla desde Historial.` });
    }
    setBusy(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={hs.card}>
        <div style={hs.cardHeader}><p style={hs.cardTitle}>Importar CSV de Label Engine</p></div>
        <div style={{ padding: "20px" }}>
          <label style={{ ...f, display: "inline-block", padding: "9px 16px", border: `1px dashed ${css.border}`, borderRadius: "8px", cursor: "pointer", fontSize: "13px", color: css.textSub, background: css.bg }}>
            {file ? `✓ ${file.name}` : "Seleccionar archivo CSV"}
            <input type="file" accept=".csv" style={{ display: "none" }} onChange={e => { const fl = e.target.files?.[0]; if (fl) onFile(fl); e.target.value = ""; }} />
          </label>
          <p style={{ ...f, fontSize: "12px", color: css.textMute, marginTop: "10px", lineHeight: 1.6 }}>
            El mes se lee de cada fila (un CSV puede traer varios meses). Verás una vista previa antes de guardar nada, y cada importación se puede deshacer.
          </p>
          {msg && <p style={{ ...f, fontSize: "13px", marginTop: "10px", color: msg.ok ? css.green : css.red }}>{msg.text}</p>}
        </div>
      </div>

      {file && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "12px" }}>
            {kpi("Total del archivo", usd(file.total), `${file.rows} líneas`)}
            {kpi("Asignado a artistas", usd(file.total - unassignedNet), viaIsrc > 0 ? `${usd(viaIsrc)} resueltos por ISRC` : "", css.green)}
            {kpi("Sin asignar", usd(unassignedNet), `${groups.length} nombres/ISRC por revisar`, unassignedNet > 0.005 ? css.red : css.text)}
          </div>

          {groups.length > 0 && (
            <div style={hs.card}>
              <div style={hs.cardHeader}><p style={hs.cardTitle}>Revisar: no coinciden con ninguna cuenta</p></div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><th style={th}>Aparece en el CSV como</th><th style={th}>Líneas</th><th style={th}>Importe</th><th style={th}>Asignar a</th></tr></thead>
                  <tbody>
                    {groups.map(g => (
                      <tr key={g.key}>
                        <td style={td}>{g.label}{g.suggestion && !decisions[g.key] && <span style={{ color: css.blue, fontSize: "11px", marginLeft: "8px", cursor: "pointer" }} onClick={() => setDecisions(d => ({ ...d, [g.key]: g.suggestion! }))}>¿{g.suggestion}?</span>}</td>
                        <td style={td}>{g.count}</td>
                        <td style={td}><b>{usd4(g.net)}</b></td>
                        <td style={td}><AccountSelect value={decisions[g.key] || ""} onChange={v => setDecisions(d => ({ ...d, [g.key]: v }))} accounts={accounts} placeholder="Dejar sin asignar" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ ...f, fontSize: "11px", color: css.textMute, padding: "10px 14px" }}>Lo que asignes aquí se recuerda (alias) para futuros CSV. Lo que dejes sin asignar queda guardado y podrás asignarlo después.</p>
            </div>
          )}

          <div style={hs.card}>
            <div style={hs.cardHeader}><p style={hs.cardTitle}>Qué cambiará ({impacts.length} artista-mes)</p></div>
            <div style={{ overflowX: "auto", maxHeight: 340, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={th}>Artista</th><th style={th}>Mes</th><th style={th}>Antes (bruto)</th><th style={th}>Después</th><th style={th}></th></tr></thead>
                <tbody>
                  {impacts.map(i => (
                    <tr key={i.artist + i.ym}>
                      <td style={td}>{i.artist}</td><td style={td}>{ymLabel(i.ym)}</td>
                      <td style={td}>{usd4(i.before)}</td><td style={td}><b>{usd4(i.after)}</b></td>
                      <td style={{ ...td, fontSize: "11px", color: css.yellow }}>{i.legacy ? "datos antiguos: se sustituyen" : ""}{i.paidChange ? " · mes ya pagado cambia" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(legacyCount > 0 || paidCount > 0) && (
            <div style={{ padding: "12px 16px", borderRadius: "8px", background: css.yellowBg, border: `1px solid ${css.yellowBorder}` }}>
              {legacyCount > 0 && (
                <label style={{ ...f, fontSize: "13px", color: css.yellow, display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} style={{ marginTop: 3 }} />
                  {legacyCount} mes(es) tienen datos de la importación antigua. Al guardar se recalculan solo con los CSV importados por este sistema. Si el CSV antiguo no está aquí, importa también ese archivo antes, o el importe de ese mes puede bajar.
                </label>
              )}
              {paidCount > 0 && <p style={{ ...f, fontSize: "13px", color: css.yellow, marginTop: legacyCount ? 8 : 0 }}>⚠ {paidCount} mes(es) ya marcados como pagados cambiarán de importe. Revisa si hay que compensarlo.</p>}
            </div>
          )}

          <div><button disabled={!canCommit} onClick={commit} style={{ ...hs.btnGreen, opacity: canCommit ? 1 : 0.5 }}>{busy ? "Guardando…" : `Guardar importación (${usd(file.total)})`}</button></div>
        </>
      )}

      {changes && (
        <div style={hs.card}>
          <div style={hs.cardHeader}><p style={hs.cardTitle}>Resultado</p></div>
          <div style={{ overflowX: "auto", maxHeight: 300, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Artista</th><th style={th}>Mes</th><th style={th}>Su parte antes</th><th style={th}>Ahora</th></tr></thead>
              <tbody>{changes.map(c => (
                <tr key={c.artist + c.month}><td style={td}>{c.artist}</td><td style={td}>{ymLabel(c.month)}</td><td style={td}>{usd4(c.before)}</td>
                  <td style={td}><b>{usd4(c.after)}</b>{c.paid && Math.abs(c.after - c.before) > 0.00005 && <span style={{ color: css.yellow, fontSize: 11, marginLeft: 8 }}>ya pagado</span>}</td></tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── PAGOS ─────────────────────────
function PayTab({ accounts, royalties, onDone }: { accounts: Account[]; royalties: Royalty[]; onDone: () => void }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const rows = accounts.filter(a => !a.is_own_artist && a.active).map(a => {
    const unpaid = royalties.filter(r => r.artist_name === a.artist_name && !r.paid);
    const pending = unpaid.reduce((s, r) => s + Number(r.artist_share), 0);
    const dest = a.payment_method === "bank" ? a.bank_iban : a.payment_method === "both" ? [a.paypal_email, a.bank_iban].filter(Boolean).join(" / ") : a.paypal_email;
    return { a, unpaid, pending, dest, ready: pending >= THRESHOLD };
  }).filter(r => r.pending > 0).sort((x, y) => y.pending - x.pending);

  const ready = rows.filter(r => r.ready);
  const active = new Set(accounts.filter(a => a.active).map(a => a.artist_name));
  const own = new Set(accounts.filter(a => a.is_own_artist).map(a => a.artist_name));
  const orphans = royalties.filter(r => !r.paid && !own.has(r.artist_name) && !active.has(r.artist_name) && Number(r.artist_share) > 0);
  const toggle = (n: string) => setSel(s => { const c = new Set(s); c.has(n) ? c.delete(n) : c.add(n); return c; });
  const chosen = ready.filter(r => sel.has(r.a.artist_name));
  const total = chosen.reduce((s, r) => s + r.pending, 0);

  const csv = () => {
    const lines = [["Artista", "Email", "Método", "Destino", "Importe USD"], ...chosen.map(r => [r.a.artist_name, r.a.email, r.a.payment_method, r.dest, r.pending.toFixed(2).replace(".", ",")])];
    const body = lines.map(l => l.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + body], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = `lote-pagos-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const markPaid = async () => {
    if (!chosen.length || !confirm(`¿Marcar como pagados ${chosen.length} artista(s)? Total ${usd(total)}.\nSe enviará el aviso por email a cada uno.`)) return;
    setBusy(true);
    for (const r of chosen) {
      await supabase.from("artist_royalties").update({ paid: true, paid_at: new Date().toISOString() }).in("id", r.unpaid.map(u => u.id));
      await fetch("/api/notify-payment", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: r.a.email, name: r.a.name, artist_name: r.a.artist_name, amount: r.pending, method: r.a.payment_method, paypal: r.a.paypal_email, iban: r.a.bank_iban }) }).catch(() => {});
    }
    setSel(new Set()); setBusy(false); onDone();
  };

  const now = new Date();
  const nextIdx = [0, 3, 6, 9].find(m => m > now.getMonth()) ?? 0;
  const next = new Date(nextIdx === 0 ? now.getFullYear() + 1 : now.getFullYear(), nextIdx, 1).toLocaleString("es", { month: "long", year: "numeric" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <p style={{ ...f, fontSize: "13px", color: css.textMute }}>Próximo ciclo de pagos: <b style={{ textTransform: "capitalize" }}>{next}</b> · mínimo ${THRESHOLD}</p>
      <div style={hs.card}>
        <div style={hs.cardHeader}>
          <p style={hs.cardTitle}>Listos para pagar ({ready.length})</p>
          <div style={{ display: "flex", gap: "8px" }}>
            <button style={hs.btnSmall} onClick={() => setSel(new Set(ready.filter(r => r.dest).map(r => r.a.artist_name)))}>Seleccionar todos</button>
            <button style={hs.btnSmall} disabled={!chosen.length} onClick={csv}>⬇ Lote CSV</button>
            <button style={{ ...hs.btnGreen, opacity: chosen.length && !busy ? 1 : 0.5 }} disabled={!chosen.length || busy} onClick={markPaid}>Marcar pagados ({usd(total)})</button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={th}></th><th style={th}>Artista</th><th style={th}>Método</th><th style={th}>Destino</th><th style={th}>Importe</th></tr></thead>
            <tbody>
              {ready.map(r => (
                <tr key={r.a.id}>
                  <td style={td}><input type="checkbox" disabled={!r.dest} checked={sel.has(r.a.artist_name)} onChange={() => toggle(r.a.artist_name)} /></td>
                  <td style={td}>{r.a.artist_name}</td>
                  <td style={td}>{r.a.payment_method === "bank" ? "IBAN" : r.a.payment_method === "both" ? "PayPal+IBAN" : "PayPal"}</td>
                  <td style={{ ...td, color: r.dest ? css.text : css.red }}>{r.dest || "⚠ sin método de pago"}</td>
                  <td style={td}><b>{usd(r.pending)}</b></td>
                </tr>
              ))}
              {ready.length === 0 && <tr><td colSpan={5} style={{ ...td, textAlign: "center", color: css.textMute, padding: 30 }}>Nadie supera ${THRESHOLD} todavía.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div style={hs.card}>
        <div style={hs.cardHeader}><p style={hs.cardTitle}>Acumulando ({rows.length - ready.length})</p></div>
        {rows.filter(r => !r.ready).map(r => (
          <div key={r.a.id} style={{ ...td, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ flex: 1 }}>{r.a.artist_name}</span>
            <div style={{ width: 120, height: 6, background: css.borderLight, borderRadius: 3 }}><div style={{ width: `${(r.pending / THRESHOLD) * 100}%`, height: "100%", background: css.yellow, borderRadius: 3 }} /></div>
            <b style={{ width: 80, textAlign: "right" }}>{usd(r.pending)}</b>
          </div>
        ))}
      </div>
      {orphans.length > 0 && (
        <div style={hs.card}>
          <div style={hs.cardHeader}><p style={hs.cardTitle}>Sin cuenta activa ({orphans.length})</p></div>
          <p style={{ ...td, color: css.textMute }}>Estas regalías pertenecen a un nombre que no coincide con ninguna cuenta activa. Cuentan en el resumen pero no se pueden pagar desde aquí. Suelen venir de importaciones antiguas.</p>
          {orphans.map(r => (
            <div key={r.id} style={{ ...td, display: "flex", gap: 12 }}>
              <span style={{ flex: 1 }}>{r.artist_name} · {String(r.month).slice(0, 7)}</span>
              <b>{usd(Number(r.artist_share))}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────── SIN ASIGNAR ─────────────────────────
function Unassigned({ lines, accounts, onDone }: { lines: Line[]; accounts: Account[]; onDone: () => void }) {
  const [pick, setPick] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const groups = useMemo(() => {
    const m: Record<string, { key: string; label: string; raw?: string; isrc?: string; net: number; count: number }> = {};
    lines.filter(l => !l.artist_name).forEach(l => {
      const key = l.artist_raw ? norm(l.artist_raw) : `isrc:${l.isrc}`;
      m[key] ||= { key, label: l.artist_raw || `(sin artista) ${l.title || l.isrc}`, raw: l.artist_raw || undefined, isrc: l.artist_raw ? undefined : l.isrc, net: 0, count: 0 };
      m[key].net += Number(l.net); m[key].count++;
    });
    return Object.values(m).sort((a, b) => b.net - a.net);
  }, [lines]);

  const assign = async (g: (typeof groups)[number]) => {
    const artist = pick[g.key]; if (!artist) return;
    setBusy(g.key);
    const r = await fetch("/api/admin/royalties/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phase: "assign", artist_name: artist, raw: g.raw, isrc: g.isrc }) });
    if (!r.ok) alert("No se pudo asignar");
    setBusy(null); onDone();
  };

  return (
    <div style={hs.card}>
      <div style={hs.cardHeader}><p style={hs.cardTitle}>Regalías sin asignar ({groups.length})</p></div>
      {groups.length === 0 ? <p style={{ ...td, textAlign: "center", color: css.green, padding: 30 }}>✓ Todo el dinero está asignado.</p> : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={th}>CSV</th><th style={th}>Líneas</th><th style={th}>Importe</th><th style={th}>Asignar a</th><th style={th}></th></tr></thead>
            <tbody>{groups.map(g => (
              <tr key={g.key}><td style={td}>{g.label}</td><td style={td}>{g.count}</td><td style={td}><b>{usd4(g.net)}</b></td>
                <td style={td}><AccountSelect value={pick[g.key] || ""} onChange={v => setPick(p => ({ ...p, [g.key]: v }))} accounts={accounts} placeholder="Elegir artista" /></td>
                <td style={td}><button style={{ ...hs.btnGreen, opacity: pick[g.key] ? 1 : 0.5 }} disabled={!pick[g.key] || busy === g.key} onClick={() => assign(g)}>{busy === g.key ? "…" : "Asignar"}</button></td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── HISTORIAL ─────────────────────────
function History({ imports, onDone }: { imports: ImportRow[]; onDone: () => void }) {
  const undo = async (i: ImportRow) => {
    if (!confirm(`¿Deshacer la importación "${i.filename}" (${usd(Number(i.total))})?\nSe quitan sus líneas y se recalculan las regalías afectadas.`)) return;
    const r = await fetch("/api/admin/royalties/import", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ import_id: i.id }) });
    if (!r.ok) alert("Error al deshacer");
    onDone();
  };
  return (
    <div style={hs.card}>
      <div style={hs.cardHeader}><p style={hs.cardTitle}>Importaciones ({imports.length})</p></div>
      {imports.length === 0 && <p style={{ ...td, textAlign: "center", color: css.textMute, padding: 30 }}>Aún no hay importaciones.</p>}
      {imports.map(i => (
        <div key={i.id} style={{ ...td, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}><b>{i.filename}</b><p style={{ fontSize: 11, color: css.textMute }}>{new Date(i.created_at).toLocaleString("es")} · {i.rows} líneas</p></div>
          <b>{usd(Number(i.total))}</b>
          <button style={hs.btnDanger} onClick={() => undo(i)}>Deshacer</button>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────── PRINCIPAL ─────────────────────────
type SubTab = "summary" | "import" | "pay" | "unassigned" | "history";

export default function AdminRoyalties() {
  const [tab, setTab] = useState<SubTab>("summary");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [royalties, setRoyalties] = useState<Royalty[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [imports, setImports] = useState<ImportRow[]>([]);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [setupError, setSetupError] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [acc, roy, ln, imp, al] = await Promise.all([
        fetchAll<Account>("artist_accounts", "*"),
        fetchAll<Royalty>("artist_royalties", "*", "month"),
        fetchAll<Line>("royalty_lines", "artist_name,artist_raw,isrc,title,store,month,net"),
        fetchAll<ImportRow>("royalty_imports", "id,filename,rows,total,created_at", "created_at"),
        fetchAll<{ alias_norm: string; artist_name: string }>("artist_aliases", "alias_norm,artist_name"),
      ]);
      setAccounts(acc); setRoyalties(roy); setLines(ln); setImports(imp);
      setAliases(Object.fromEntries(al.map(a => [a.alias_norm, a.artist_name])));
      setSetupError(false);
    } catch { setSetupError(true); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const lineSums = useMemo(() => {
    const m: Record<string, number> = {};
    lines.forEach(l => { if (l.artist_name) { const k = pairKey(l.artist_name, l.month); m[k] = (m[k] || 0) + Number(l.net); } });
    return m;
  }, [lines]);
  const isrcMap = useMemo(() => {
    const m: Record<string, string> = {};
    lines.forEach(l => { if (l.artist_name && l.isrc) m[l.isrc] = l.artist_name; });
    return m;
  }, [lines]);
  const unassignedCount = useMemo(() => new Set(lines.filter(l => !l.artist_name).map(l => l.artist_raw ? norm(l.artist_raw) : l.isrc)).size, [lines]);

  const tabs: { id: SubTab; label: string; badge?: number }[] = [
    { id: "summary", label: "Resumen" }, { id: "import", label: "Importar" }, { id: "pay", label: "Pagos" },
    { id: "unassigned", label: "Sin asignar", badge: unassignedCount }, { id: "history", label: "Historial" },
  ];

  if (loading) return <p style={{ ...f, color: css.textMute, fontSize: 13 }}>Cargando…</p>;
  if (setupError) return (
    <div style={{ ...hs.card, padding: 24, maxWidth: 560 }}>
      <p style={{ ...f, fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Falta preparar la base de datos</p>
      <p style={{ ...f, fontSize: 13, color: css.textSub, lineHeight: 1.7 }}>Ejecuta el archivo <code>supabase.sql</code> del paquete en el SQL Editor de Supabase y recarga esta página.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: 1100 }}>
      <p style={hs.subtitle}>Importa, concilia y paga las regalías. Todo queda registrado y se puede deshacer.</p>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${css.border}`, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ ...f, padding: "10px 14px", fontSize: 13, fontWeight: 500, background: "transparent", border: "none", cursor: "pointer", whiteSpace: "nowrap",
            color: tab === t.id ? css.text : css.textMute, borderBottom: tab === t.id ? `2px solid ${css.text}` : "2px solid transparent", marginBottom: -1 }}>
            {t.label}{t.badge ? <span style={{ marginLeft: 6, background: css.red, color: "#fff", borderRadius: 9, padding: "1px 6px", fontSize: 10 }}>{t.badge}</span> : null}
          </button>
        ))}
      </div>
      {tab === "summary" && <Summary accounts={accounts} royalties={royalties} lines={lines} />}
      {tab === "import" && <ImportTab accounts={accounts} royalties={royalties} aliases={aliases} isrcMap={isrcMap} lineSums={lineSums} onDone={load} />}
      {tab === "pay" && <PayTab accounts={accounts} royalties={royalties} onDone={load} />}
      {tab === "unassigned" && <Unassigned lines={lines} accounts={accounts} onDone={load} />}
      {tab === "history" && <History imports={imports} onDone={load} />}
    </div>
  );
}
