import React from "react";

export const css = {
  bg:          "#f9fafb",
  white:       "#ffffff",
  border:      "#e5e7eb",
  borderLight: "#f3f4f6",
  text:        "#111827",
  textSub:     "#6b7280",
  textMute:    "#9ca3af",
  accent:      "#111827",
  accentBg:    "#f3f4f6",
  green:       "#16a34a",
  greenBg:     "#f0fdf4",
  greenBorder: "#bbf7d0",
  red:         "#dc2626",
  redBg:       "#fef2f2",
  redBorder:   "#fecaca",
  yellow:      "#d97706",
  yellowBg:    "#fffbeb",
  yellowBorder:"#fde68a",
  blue:        "#2563eb",
  blueBg:      "#eff6ff",
  blueBorder:  "#bfdbfe",
  purple:      "#7c3aed",
  purpleBg:    "#f5f3ff",
  purpleBorder:"#ddd6fe",
};

const base: React.CSSProperties = {
  fontFamily: "system-ui, -apple-system, sans-serif",
};

export const hs = {
  // Títulos de sección
  title: {
    ...base,
    fontSize: "18px",
    fontWeight: 600,
    color: css.text,
    marginBottom: "4px",
  } as React.CSSProperties,

  subtitle: {
    ...base,
    fontSize: "13px",
    color: css.textMute,
    marginBottom: "24px",
  } as React.CSSProperties,

  // Card contenedor
  card: {
    background: css.white,
    border: `1px solid ${css.border}`,
    borderRadius: "8px",
    overflow: "hidden",
  } as React.CSSProperties,

  // Header de card
  cardHeader: {
    padding: "16px 20px",
    borderBottom: `1px solid ${css.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  } as React.CSSProperties,

  cardTitle: {
    ...base,
    fontSize: "13px",
    fontWeight: 600,
    color: css.text,
  } as React.CSSProperties,

  // Formularios
  form: {
    background: css.white,
    border: `1px solid ${css.border}`,
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "24px",
    display: "flex",
    gap: "12px",
  } as React.CSSProperties,

  formLabel: {
    ...base,
    fontSize: "12px",
    fontWeight: 500,
    color: css.textSub,
    marginBottom: "4px",
    display: "block",
  } as React.CSSProperties,

  input: {
    ...base,
    padding: "7px 10px",
    border: `1px solid ${css.border}`,
    borderRadius: "6px",
    fontSize: "13px",
    color: css.text,
    background: css.white,
    outline: "none",
    width: "100%",
    transition: "border-color .15s",
  } as React.CSSProperties,

  // Tabla
  tableHeader: {
    ...base,
    fontSize: "11px",
    fontWeight: 500,
    color: css.textMute,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    padding: "10px 16px",
    background: css.bg,
    borderBottom: `1px solid ${css.border}`,
  } as React.CSSProperties,

  row: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderBottom: `1px solid ${css.border}`,
    background: css.white,
    transition: "background .1s",
  } as React.CSSProperties,

  rowName: {
    ...base,
    fontSize: "13px",
    fontWeight: 500,
    color: css.text,
    margin: 0,
  } as React.CSSProperties,

  rowSub: {
    ...base,
    fontSize: "12px",
    color: css.textMute,
    margin: 0,
  } as React.CSSProperties,

  // Botones
  btnGreen: {
    ...base,
    padding: "7px 14px",
    borderRadius: "6px",
    border: "none",
    background: css.text,
    color: "#fff",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "opacity .15s",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  btnSmall: {
    ...base,
    padding: "5px 10px",
    borderRadius: "5px",
    border: `1px solid ${css.border}`,
    background: css.white,
    color: css.textSub,
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all .15s",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  btnDanger: {
    ...base,
    padding: "5px 10px",
    borderRadius: "5px",
    border: `1px solid ${css.redBorder}`,
    background: css.redBg,
    color: css.red,
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  } as React.CSSProperties,

  // Badges
  badgeGreen: {
    ...base,
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: 500,
    color: css.green,
    background: css.greenBg,
    border: `1px solid ${css.greenBorder}`,
  } as React.CSSProperties,

  badgeRed: {
    ...base,
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: 500,
    color: css.red,
    background: css.redBg,
    border: `1px solid ${css.redBorder}`,
  } as React.CSSProperties,

  badgeYellow: {
    ...base,
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: 500,
    color: css.yellow,
    background: css.yellowBg,
    border: `1px solid ${css.yellowBorder}`,
  } as React.CSSProperties,

  badgeBlue: {
    ...base,
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: 500,
    color: css.blue,
    background: css.blueBg,
    border: `1px solid ${css.blueBorder}`,
  } as React.CSSProperties,

  badgePurple: {
    ...base,
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: 500,
    color: css.purple,
    background: css.purpleBg,
    border: `1px solid ${css.purpleBorder}`,
  } as React.CSSProperties,

  badgeGray: {
    ...base,
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: "9999px",
    fontSize: "11px",
    fontWeight: 500,
    color: css.textSub,
    background: css.accentBg,
    border: `1px solid ${css.border}`,
  } as React.CSSProperties,

  // Sección
  section: {
    background: css.white,
    border: `1px solid ${css.border}`,
    borderRadius: "8px",
    overflow: "hidden",
    marginBottom: "24px",
  } as React.CSSProperties,

  sectionHeader: {
    padding: "14px 20px",
    borderBottom: `1px solid ${css.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: css.white,
  } as React.CSSProperties,

  // Separador
  divider: {
    height: "1px",
    background: css.border,
    margin: "0",
  } as React.CSSProperties,
};