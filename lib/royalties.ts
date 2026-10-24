// Lógica pura de importación: normalización, resolución de artistas y agregación

export const norm = (s: string) =>
  (s || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, " ").trim();

export const toMonth = (v: string) => {
  const m = /^(\d{4})-(\d{2})/.exec((v || "").trim());
  return m ? `${m[1]}-${m[2]}-01` : null;
};

export type RawLine = {
  artist_raw: string; isrc: string; title: string; store: string; country: string;
  month: string; quantity: number; net: number;
};
export type ResolvedLine = RawLine & { artist_name: string | null; via: "exact" | "alias" | "isrc" | null };
export type Account = { artist_name: string; royalty_percent?: number | null; is_own_artist?: boolean };

export function parseRow(r: Record<string, string>): RawLine | null {
  const month = toMonth(r["Month"]);
  if (!month) return null;
  return {
    artist_raw: (r["Artist"] || "").trim(),
    isrc: (r["ISRC"] || "").trim(),
    title: (r["Title"] || "").trim(),
    store: (r["Store"] || "").trim(),
    country: (r["Country"] || "").trim(),
    month,
    quantity: parseInt(r["Quantity"] || "0", 10) || 0,
    net: parseFloat(r["Recipient Net Royalty ($ USD)"] || "0") || 0,
  };
}

export function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

export function suggest(name: string, accounts: Account[]) {
  const n = norm(name);
  if (!n) return null;
  let best: { a: Account; d: number } | null = null;
  for (const a of accounts) {
    const d = levenshtein(n, norm(a.artist_name));
    if (d <= Math.max(2, Math.floor(n.length / 4)) && (!best || d < best.d)) best = { a, d };
  }
  return best ? best.a.artist_name : null;
}

export function resolveLines(
  lines: RawLine[], accounts: Account[], aliases: Record<string, string>, isrcMap: Record<string, string>,
): ResolvedLine[] {
  const byNorm: Record<string, string> = {};
  accounts.forEach(a => { byNorm[norm(a.artist_name)] = a.artist_name; });
  // ISRC -> artista, aprendido de las filas con artista de este mismo archivo
  const local: Record<string, string> = { ...isrcMap };
  lines.forEach(l => {
    if (!l.isrc || !l.artist_raw) return;
    const n = norm(l.artist_raw);
    const resolved = aliases[n] || byNorm[n];
    if (resolved) local[l.isrc] = resolved;
  });
  return lines.map(l => {
    const n = norm(l.artist_raw);
    if (n) {
      if (aliases[n]) return { ...l, artist_name: aliases[n], via: "alias" as const };
      if (byNorm[n]) return { ...l, artist_name: byNorm[n], via: "exact" as const };
      return { ...l, artist_name: null, via: null };
    }
    if (l.isrc && local[l.isrc]) return { ...l, artist_name: local[l.isrc], via: "isrc" as const };
    return { ...l, artist_name: null, via: null };
  });
}

export const pairKey = (artist: string, month: string) => `${artist}||${month.slice(0, 7)}`;

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
