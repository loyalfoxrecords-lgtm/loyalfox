import { NextRequest, NextResponse } from "next/server";
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
  if (!artist) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const { data } = await supabase
    .from("artist_accounts")
    .select("full_name, artist_name, city, url_spotify_artist, url_soundcloud, url_apple_artist")
    .eq("id", artist.id)
    .single();

  return NextResponse.json(data || {});
}

export async function POST(req: NextRequest) {
  const artist = await getArtist();
  if (!artist) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const body = await req.json();
  const { full_name, city, url_spotify_artist, url_soundcloud, url_apple_artist } = body;

  const { error } = await supabase.from("artist_accounts")
    .update({ full_name, city, url_spotify_artist, url_soundcloud, url_apple_artist })
    .eq("id", artist.id);

  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json({ ok: true });
}
