import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function isAdmin() {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) return false;
  try { jwt.verify(token, process.env.JWT_SECRET!); return true; }
  catch { return false; }
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  // Traer todos los mensajes agrupados por artista
  const { data } = await supabase
    .from("artist_messages")
    .select("*")
    .order("created_at", { ascending:true });

  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const { artist_account_id, artist_name, message } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error:"Empty" }, { status:400 });

  const { data, error } = await supabase.from("artist_messages").insert({
    artist_account_id,
    artist_name,
    sender: "admin",
    message: message.trim(),
  }).select().single();

  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const { artist_account_id } = await req.json();
  await supabase.from("artist_messages")
    .update({ read:true })
    .eq("artist_account_id", artist_account_id)
    .eq("sender", "artist");

  return NextResponse.json({ ok:true });
}
