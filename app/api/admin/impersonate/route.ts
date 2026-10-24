import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { createClient } from "@supabase/supabase-js";

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

// Crea una sesión de artista de SOLO LECTURA (1 hora) para ver su panel
export async function POST(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { artist_account_id } = await req.json();
  const { data: a } = await supabase.from("artist_accounts")
    .select("id,name,artist_name,email").eq("id", artist_account_id).single();
  if (!a) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const token = await new SignJWT({ id: a.id, name: a.name, artist_name: a.artist_name, email: a.email, imp: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(process.env.ARTISTS_JWT_SECRET!));

  const res = NextResponse.json({ ok: true });
  res.cookies.set("artist_token", token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 60 * 60,
  });
  return res;
}
