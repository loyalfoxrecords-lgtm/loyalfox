import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function isAdmin() {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) return false;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    await jwtVerify(token, secret);
    return true;
  } catch { return false; }
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const { data } = await supabase
    .from("artist_contracts")
    .select("*")
    .order("created_at", { ascending:false });
  return NextResponse.json(data || []);
}

// Ahora recibe JSON con pdf_url ya subida desde el frontend
export async function POST(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const { artist_account_id, artist_name, title, description, pdf_url } = await req.json();

  if (!artist_account_id || !title || !pdf_url) {
    return NextResponse.json({ error:"Missing fields" }, { status:400 });
  }

  const { data, error } = await supabase.from("artist_contracts").insert({
    artist_account_id,
    artist_name,
    title,
    description,
    pdf_url,
    status: "pending",
  }).select().single();

  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  const { id } = await req.json();
  await supabase.from("artist_contracts").delete().eq("id", id);
  return NextResponse.json({ ok:true });
}
