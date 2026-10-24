import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getArtist() {
  const token = (await cookies()).get("artist_token")?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.ARTISTS_JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return payload as any;
  } catch { return null; }
}

export async function GET() {
  const artist = await getArtist();
  if (!artist) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: account } = await supabase
    .from("artist_accounts")
    .select("id,name,artist_name,avatar_url,full_name,city,url_spotify_artist,url_soundcloud,url_apple_artist,royalty_percent,must_change_password")
    .eq("id", artist.id).single();
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: royalties } = await supabase
    .from("artist_royalties").select("*")
    .eq("artist_name", account.artist_name)
    .order("month", { ascending: false });

  // Mes tal y como está guardado en artist_royalties, para que los filtros del panel casen
  const monthKey: Record<string, string> = {};
  (royalties || []).forEach(r => { monthKey[String(r.month).slice(0, 7)] = r.month; });

  // Desglose por canción y plataforma desde las líneas importadas (sistema nuevo)
  const pct = (account.royalty_percent ?? 60) / 100;
  const agg: Record<string, { track_name: string; store: string; month: string; streams: number; revenue: number }> = {};
  const lineMonths = new Set<string>();
  let from = 0;
  for (;;) {
    const { data, error } = await supabase.from("royalty_lines")
      .select("title,store,month,quantity,net")
      .eq("artist_name", account.artist_name).range(from, from + 999);
    if (error || !data || !data.length) break;
    data.forEach(l => {
      const ym = String(l.month).slice(0, 7);
      lineMonths.add(ym);
      const month = monthKey[ym] || l.month;
      const track = l.title || "—";
      const store = l.store || "—";
      const k = `${track}|${store}|${ym}`;
      agg[k] ||= { track_name: track, store, month, streams: 0, revenue: 0 };
      agg[k].streams += Number(l.quantity) || 0;
      agg[k].revenue += (Number(l.net) || 0) * pct;
    });
    if (data.length < 1000) break;
    from += 1000;
  }
  const tracks: any[] = Object.values(agg).map((t, i) => ({ id: `l${i}`, ...t }));

  // Meses antiguos que aún solo existen en la tabla anterior
  try {
    const { data: legacy } = await supabase.from("artist_tracks_monthly").select("*").eq("artist_name", account.artist_name);
    (legacy || []).forEach((t: any) => {
      if (!lineMonths.has(String(t.month).slice(0, 7))) tracks.push(t);
    });
  } catch { /* tabla antigua opcional */ }

  return NextResponse.json({
    id: account.id, name: account.name, artist_name: account.artist_name,
    avatar_url: account.avatar_url || "", full_name: account.full_name || "", city: account.city || "",
    url_spotify_artist: account.url_spotify_artist || "", url_soundcloud: account.url_soundcloud || "", url_apple_artist: account.url_apple_artist || "",
    must_change_password: !!account.must_change_password,
    royalties: royalties || [], tracks,
  });
}
