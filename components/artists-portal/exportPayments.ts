import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Lang } from "./theme";

export type PayRow = {
  month: string;           // "2026-03" o "2026-03-01"
  streams: number;
  share: number;
  paid: boolean;
  paidAt: string | null;
};

const monthLabel = (m: string, lang: Lang) => {
  try {
    return new Date(m.slice(0, 7) + "-02").toLocaleString(lang === "en" ? "en" : "es", { month: "long", year: "numeric" });
  } catch { return m; }
};
const dateLabel = (d: string | null, lang: Lang) =>
  d ? new Date(d).toLocaleDateString(lang === "en" ? "en" : "es") : "";

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "artist";

// ── CSV (Excel en español: separador ; coma decimal, BOM UTF-8) ──
export function downloadPaymentsCsv(rows: PayRow[], lang: Lang, artistName: string) {
  const es = lang !== "en";
  const num = (n: number) => (es ? n.toFixed(4).replace(".", ",") : n.toFixed(4));
  const head = es
    ? ["Mes", "Streams", "Tu parte (USD)", "Estado", "Fecha de pago"]
    : ["Month", "Streams", "Your share (USD)", "Status", "Payment date"];
  const lines = rows.map(r => [
    monthLabel(r.month, lang), String(r.streams), num(r.share),
    r.paid ? (es ? "Pagado" : "Paid") : (es ? "Acumulando" : "Accumulating"),
    dateLabel(r.paidAt, lang),
  ]);
  const total = rows.reduce((a, r) => a + r.share, 0);
  const totalPaid = rows.filter(r => r.paid).reduce((a, r) => a + r.share, 0);
  lines.push([]);
  lines.push([es ? "Total generado" : "Total earned", "", num(total), "", ""]);
  lines.push([es ? "Total cobrado" : "Total paid", "", num(totalPaid), "", ""]);
  lines.push([es ? "Pendiente" : "Pending", "", num(total - totalPaid), "", ""]);

  const esc = (v: string) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = [head, ...lines].map(l => l.map(esc).join(";")).join("\r\n");
  save(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }), `loyalfox-payments-${slug(artistName)}.csv`);
}

// ── PDF ──
const latin1 = (s: string) => s.replace(/[^\x20-\x7E -ÿ]/g, "?");

export async function downloadPaymentsPdf(rows: PayRow[], lang: Lang, artistName: string) {
  const es = lang !== "en";
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = 595, H = 842, M = 48;
  const cols = [M, M + 150, M + 240, M + 350, M + 430];
  const head = es
    ? ["Mes", "Streams", "Tu parte (USD)", "Estado", "Fecha de pago"]
    : ["Month", "Streams", "Your share (USD)", "Status", "Payment date"];

  let page = doc.addPage([W, H]);
  let y = H - M;
  const text = (t: string, x: number, yy: number, size = 9, f = font, color = rgb(0.1, 0.1, 0.15)) =>
    page.drawText(latin1(t), { x, y: yy, size, font: f, color });

  const header = () => {
    cols.forEach((x, i) => text(head[i], x, y, 8, bold, rgb(0.45, 0.45, 0.5)));
    y -= 6;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.88) });
    y -= 16;
  };

  text("LoyalFox Records", M, y, 16, bold); y -= 20;
  text(es ? `Historial de pagos — ${artistName}` : `Payment history — ${artistName}`, M, y, 11); y -= 14;
  text((es ? "Generado el " : "Generated on ") + new Date().toLocaleDateString(es ? "es" : "en"), M, y, 8, font, rgb(0.5, 0.5, 0.55));
  y -= 28;
  header();

  for (const r of rows) {
    if (y < M + 90) { page = doc.addPage([W, H]); y = H - M; header(); }
    text(monthLabel(r.month, lang), cols[0], y);
    text(r.streams.toLocaleString(es ? "es" : "en"), cols[1], y);
    text(`$${r.share.toFixed(4)}`, cols[2], y);
    text(r.paid ? (es ? "Pagado" : "Paid") : (es ? "Acumulando" : "Accumulating"), cols[3], y);
    text(dateLabel(r.paidAt, lang) || "-", cols[4], y);
    y -= 16;
  }

  const total = rows.reduce((a, r) => a + r.share, 0);
  const paid = rows.filter(r => r.paid).reduce((a, r) => a + r.share, 0);
  if (y < M + 80) { page = doc.addPage([W, H]); y = H - M; }
  y -= 10;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.88) });
  y -= 18;
  text(es ? "Total generado" : "Total earned", cols[0], y, 9, bold); text(`$${total.toFixed(2)}`, cols[2], y, 9, bold); y -= 15;
  text(es ? "Total cobrado" : "Total paid", cols[0], y, 9, bold); text(`$${paid.toFixed(2)}`, cols[2], y, 9, bold); y -= 15;
  text(es ? "Pendiente" : "Pending", cols[0], y, 9, bold); text(`$${(total - paid).toFixed(2)}`, cols[2], y, 9, bold);

  const bytes = await doc.save();
  const copy = new Uint8Array(bytes);
  save(new Blob([copy], { type: "application/pdf" }), `loyalfox-payments-${slug(artistName)}.pdf`);
}
