import type React from "react";

export const c = {
  bg:"#f9fafb", white:"#ffffff", border:"#e5e7eb", borderLight:"#f3f4f6",
  text:"#111827", textSub:"#6b7280", textMute:"#9ca3af", accent:"#111827",
  accentBg:"#f3f4f6",
  green:"#16a34a", greenBg:"#f0fdf4", greenBorder:"#bbf7d0",
  blue:"#2563eb", blueBg:"#eff6ff", blueBorder:"#bfdbfe",
  red:"#dc2626", redBg:"#fef2f2", redBorder:"#fecaca",
  yellow:"#d97706", yellowBg:"#fffbeb", yellowBorder:"#fde68a",
  purple:"#7c3aed",
};

export type Lang = "es" | "en";

export const base: React.CSSProperties = { fontFamily:"system-ui, -apple-system, sans-serif" };

export const card: React.CSSProperties = {
  background:c.white, border:`1px solid ${c.border}`, borderRadius:"8px", overflow:"hidden",
};
export const cardHeader: React.CSSProperties = {
  padding:"14px 20px", borderBottom:`1px solid ${c.border}`,
  display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px",
};
export const cardTitle: React.CSSProperties = { ...base, fontSize:"13px", fontWeight:600, color:c.text };
export const lbl: React.CSSProperties = {
  ...base, fontSize:"11px", fontWeight:500, color:c.textMute,
  textTransform:"uppercase", letterSpacing:"0.04em",
};
export const btnDark: React.CSSProperties = {
  ...base, padding:"9px 18px", borderRadius:"6px", border:"none",
  background:c.accent, color:c.white, fontSize:"13px", fontWeight:600, cursor:"pointer",
};
export const btnLight: React.CSSProperties = {
  ...base, padding:"8px 14px", borderRadius:"6px", border:`1px solid ${c.border}`,
  background:c.white, color:c.text, fontSize:"13px", fontWeight:500, cursor:"pointer",
};
export const input: React.CSSProperties = {
  width:"100%", padding:"9px 12px", border:`1px solid ${c.border}`, borderRadius:"6px",
  fontFamily:"system-ui", fontSize:"14px", color:c.text, outline:"none", boxSizing:"border-box",
};
