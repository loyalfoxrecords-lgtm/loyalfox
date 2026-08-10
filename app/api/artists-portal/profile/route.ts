import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

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

// Cambiar contraseña
export async function POST(req: NextRequest) {
  const artist = await getArtist();
  if (!artist) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const { current_password, new_password } = await req.json();
  if (!current_password || !new_password) return NextResponse.json({ error:"Missing fields" }, { status:400 });
  if (new_password.length < 6) return NextResponse.json({ error:"Password too short" }, { status:400 });

  const hashCurrent = crypto.createHash("sha256").update(current_password).digest("hex");

  const { data: account } = await supabase
    .from("artist_accounts")
    .select("id, password_hash")
    .eq("id", artist.id)
    .single();

  if (!account || account.password_hash !== hashCurrent) {
    return NextResponse.json({ error:"Wrong password" }, { status:400 });
  }

  const hashNew = crypto.createHash("sha256").update(new_password).digest("hex");

  const { error } = await supabase.from("artist_accounts")
    .update({ password_hash: hashNew })
    .eq("id", artist.id);

  if (error) return NextResponse.json({ error: error.message }, { status:500 });

  return NextResponse.json({ ok: true });
}

// Guardar URL de avatar (la subida se hace desde el frontend directamente a Supabase)
export async function PATCH(req: NextRequest) {
  const artist = await getArtist();
  if (!artist) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const { avatar_url } = await req.json();
  if (!avatar_url) return NextResponse.json({ error:"No avatar_url" }, { status:400 });

  const { error } = await supabase.from("artist_accounts")
    .update({ avatar_url })
    .eq("id", artist.id);

  if (error) return NextResponse.json({ error: error.message }, { status:500 });

  return NextResponse.json({ ok: true, avatar_url });
}
