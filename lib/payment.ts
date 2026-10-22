export function normalizeIban(v: string) {
  return (v || "").replace(/\s+/g, "").toUpperCase();
}

export function isValidIban(v: string) {
  const s = normalizeIban(v);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
  const rearr = s.slice(4) + s.slice(0, 4);
  let rem = 0;
  for (const ch of rearr) {
    const code = ch >= "A" && ch <= "Z" ? String(ch.charCodeAt(0) - 55) : ch;
    for (const d of code) rem = (rem * 10 + Number(d)) % 97;
  }
  return rem === 1;
}

export function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((v || "").trim());
}

export function formatIban(v: string) {
  return normalizeIban(v).replace(/(.{4})/g, "$1 ").trim();
}

export function maskIban(v: string) {
  const s = normalizeIban(v);
  if (s.length < 8) return s ? "••••" : "";
  return `${s.slice(0, 4)} •••• •••• ${s.slice(-4)}`;
}
