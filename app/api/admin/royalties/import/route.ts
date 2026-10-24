import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";
import { norm } from "@/lib/royalties";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function isAdmin() {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) return false;
  try { await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!)); return true; }
  catch { return false; }
}

type Pair = { artist: string; ym: string };

// Recalcula artist_royalties desde las líneas para los pares (artista, mes) indicados.
// Conserva paid / paid_at / notas; solo cambia importes.
async function recompute(pairs: Pair[]) {
  const changes: { artist: string; month: string; before: number; after: number; paid: boolean }[] = [];
  const artists = Array.from(new Set(pairs.map(p => p.artist)));
  if (!artists.length) return changes;

  const { data: accounts } = await supabase.from("artist_accounts").select("artist_name,royalty_percent").in("artist_name", artists);
  const pct: Record<string, number> = {};
  (accounts || []).forEach(a => { pct[a.artist_name] = (a.royalty_percent ?? 60) / 100; });

  const { data: existing } = await supabase.from("artist_royalties").select("*").in("artist_name", artists);

  for (const p of pairs) {
    const start = `${p.ym}-01`;
    // suma de todas las líneas de ese artista y mes (paginado)
    let gross = 0, streams = 0, from = 0;
    for (;;) {
      const { data } = await supabase.from("royalty_lines").select("net,quantity")
        .eq("artist_name", p.artist).eq("month", start).range(from, from + 999);
      if (!data || !data.length) break;
      data.forEach(l => { gross += Number(l.net); streams += Number(l.quantity); });
      if (data.length < 1000) break;
      from += 1000;
    }
    const share = gross * (pct[p.artist] ?? 0.6);
    const row = (existing || []).find(r => r.artist_name === p.artist && String(r.month).slice(0, 7) === p.ym);
    const before = row ? Number(row.artist_share) : 0;

    if (row) {
      if (gross === 0 && !row.paid) await supabase.from("artist_royalties").delete().eq("id", row.id);
      else await supabase.from("artist_royalties").update({ total_streams: streams, gross_revenue: gross, artist_share: share }).eq("id", row.id);
    } else if (gross !== 0) {
      await supabase.from("artist_royalties").insert({ artist_name: p.artist, month: start, total_streams: streams, gross_revenue: gross, artist_share: share });
    }
    changes.push({ artist: p.artist, month: p.ym, before, after: share, paid: !!row?.paid });
  }
  return changes;
}

async function pairsOfImport(importId: string): Promise<Pair[]> {
  const set = new Map<string, Pair>();
  let from = 0;
  for (;;) {
    const { data } = await supabase.from("royalty_lines").select("artist_name,month")
      .eq("import_id", importId).not("artist_name", "is", null).range(from, from + 999);
    if (!data || !data.length) break;
    data.forEach(l => { const ym = String(l.month).slice(0, 7); set.set(`${l.artist_name}|${ym}`, { artist: l.artist_name!, ym }); });
    if (data.length < 1000) break;
    from += 1000;
  }
  return Array.from(set.values());
}

export async function POST(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();

  if (b.phase === "init") {
    const { data: dup } = await supabase.from("royalty_imports").select("id,filename,created_at").eq("file_hash", b.hash).maybeSingle();
    if (dup) return NextResponse.json({ error: "duplicate", filename: dup.filename, created_at: dup.created_at }, { status: 409 });
    const { data, error } = await supabase.from("royalty_imports")
      .insert({ filename: b.filename, file_hash: b.hash, rows: b.rows, total: b.total }).select("id").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ import_id: data.id });
  }

  if (b.phase === "lines") {
    const rows = (b.lines as any[]).map(l => ({
      import_id: b.import_id, artist_raw: l.artist_raw, artist_name: l.artist_name, isrc: l.isrc, title: l.title,
      store: l.store, country: l.country, month: l.month, quantity: l.quantity, net: l.net,
    }));
    const { error } = await supabase.from("royalty_lines").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (b.phase === "finish") {
    const aliases = (b.aliases || []) as { alias_norm: string; artist_name: string }[];
    if (aliases.length) await supabase.from("artist_aliases").upsert(aliases, { onConflict: "alias_norm" });
    const changes = await recompute(await pairsOfImport(b.import_id));
    return NextResponse.json({ ok: true, changes });
  }

  // Asignar dinero sin asignar: por nombre del CSV o por ISRC (filas sin artista)
  if (b.phase === "assign") {
    const { artist_name, raw, isrc } = b as { artist_name: string; raw?: string; isrc?: string };
    if (!artist_name || (!raw && !isrc)) return NextResponse.json({ error: "Missing" }, { status: 400 });
    if (raw) await supabase.from("artist_aliases").upsert({ alias_norm: norm(raw), artist_name }, { onConflict: "alias_norm" });

    const ids: string[] = []; const pairs = new Map<string, Pair>();
    let from = 0;
    for (;;) {
      let q = supabase.from("royalty_lines").select("id,artist_raw,isrc,month").is("artist_name", null);
      if (isrc) q = q.eq("isrc", isrc).eq("artist_raw", "");
      const { data } = await q.range(from, from + 999);
      if (!data || !data.length) break;
      data.forEach(l => {
        if (raw && norm(l.artist_raw) !== norm(raw)) return;
        ids.push(l.id); const ym = String(l.month).slice(0, 7); pairs.set(ym, { artist: artist_name, ym });
      });
      if (data.length < 1000) break;
      from += 1000;
    }
    for (let i = 0; i < ids.length; i += 200)
      await supabase.from("royalty_lines").update({ artist_name }).in("id", ids.slice(i, i + 200));
    const changes = await recompute(Array.from(pairs.values()));
    return NextResponse.json({ ok: true, assigned: ids.length, changes });
  }

  return NextResponse.json({ error: "Unknown phase" }, { status: 400 });
}

// Deshacer una importación completa
export async function DELETE(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { import_id } = await req.json();
  const pairs = await pairsOfImport(import_id);
  await supabase.from("royalty_imports").delete().eq("id", import_id); // borra líneas en cascada
  const changes = await recompute(pairs);
  return NextResponse.json({ ok: true, changes });
}
