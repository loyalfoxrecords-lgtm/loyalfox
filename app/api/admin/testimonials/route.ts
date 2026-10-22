import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function isAdmin() {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!));
    return true;
  } catch { return false; }
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await supabase.from("testimonials").select("*")
    .order("sort_order", { ascending: true }).order("created_at", { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  if (!b.name || !b.quote) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const row = {
    name: b.name, role: b.role || "", quote: b.quote,
    image_url: b.image_url || "", track_url: b.track_url || "",
    published: b.published !== false, sort_order: Number(b.sort_order) || 0,
  };
  const q = b.id
    ? supabase.from("testimonials").update(row).eq("id", b.id)
    : supabase.from("testimonials").insert(row);
  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await supabase.from("testimonials").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
