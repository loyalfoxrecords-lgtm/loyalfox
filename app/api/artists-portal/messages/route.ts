import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getArtist() {
  const token = (await cookies()).get("artist_token")?.value;
  if (!token) return null;
  try { return jwt.verify(token, process.env.ARTISTS_JWT_SECRET!) as any; }
  catch { return null; }
}

export async function GET() {
  const artist = await getArtist();
  if (!artist) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const { data } = await supabase
    .from("artist_messages")
    .select("*")
    .eq("artist_account_id", artist.id)
    .order("created_at", { ascending:true });

  await supabase.from("artist_messages")
    .update({ read:true })
    .eq("artist_account_id", artist.id)
    .eq("sender", "admin")
    .eq("read", false);

  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const artist = await getArtist();
  if (!artist) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const { message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error:"Empty" }, { status:400 });

  const { data, error } = await supabase.from("artist_messages").insert({
    artist_account_id: artist.id,
    artist_name: artist.artist_name,
    sender: "artist",
    message: message.trim(),
  }).select().single();

  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json(data);
}
