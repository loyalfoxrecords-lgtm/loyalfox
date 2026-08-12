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

export async function GET(req: NextRequest) {
  const artist = await getArtist();
  if (!artist) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const contract_id = req.nextUrl.searchParams.get("contract_id");
  if (!contract_id) return NextResponse.json({ error:"Missing contract_id" }, { status:400 });

  const { data } = await supabase
    .from("release_submissions")
    .select("*")
    .eq("contract_id", contract_id)
    .eq("artist_account_id", artist.id)
    .single();

  return NextResponse.json(data || null);
}

export async function POST(req: NextRequest) {
  const artist = await getArtist();
  if (!artist) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const { contract_id, track_title, genre, notes } = await req.json();
  if (!contract_id) return NextResponse.json({ error:"Missing contract_id" }, { status:400 });

  // Upsert — actualizar si existe, crear si no
  const { data: existing } = await supabase
    .from("release_submissions")
    .select("id")
    .eq("contract_id", contract_id)
    .eq("artist_account_id", artist.id)
    .single();

  if (existing) {
    await supabase.from("release_submissions")
      .update({ track_title, genre, notes, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("release_submissions")
      .insert({ contract_id, artist_account_id: artist.id, track_title, genre, notes });
  }

  return NextResponse.json({ ok: true });
}
