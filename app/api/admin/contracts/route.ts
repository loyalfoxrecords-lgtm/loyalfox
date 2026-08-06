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
  const { data } = await supabase
    .from("artist_contracts")
    .select("*")
    .order("created_at", { ascending:false });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const formData = await req.formData();
  const file     = formData.get("file") as File;
  const artist_account_id = formData.get("artist_account_id") as string;
  const artist_name       = formData.get("artist_name") as string;
  const title             = formData.get("title") as string;
  const description       = formData.get("description") as string;

  if (!file || !artist_account_id || !title) {
    return NextResponse.json({ error:"Missing fields" }, { status:400 });
  }

  const buffer   = Buffer.from(await file.arrayBuffer());
  const filename = `contract-${artist_account_id}-${Date.now()}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("contracts")
    .upload(filename, buffer, { contentType:"application/pdf", upsert:true });

  if (uploadError) return NextResponse.json({ error:uploadError.message }, { status:500 });

  const { data: urlData } = supabase.storage.from("contracts").getPublicUrl(filename);

  const { data, error } = await supabase.from("artist_contracts").insert({
    artist_account_id,
    artist_name,
    title,
    description,
    pdf_url: urlData.publicUrl,
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
