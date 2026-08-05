import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

const secret = new TextEncoder().encode(process.env.CREATORS_JWT_SECRET!);

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("email", email.toLowerCase())
    .eq("active", true)
    .single();

  if (!creator) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const hash = crypto.createHash("sha256").update(password).digest("hex");
  if (hash !== creator.password_hash) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const token = await new SignJWT({ id: creator.id, name: creator.name, email: creator.email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(secret);

  const res = NextResponse.json({ ok: true, name: creator.name });
  res.cookies.set("creator_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });
  return res;
}