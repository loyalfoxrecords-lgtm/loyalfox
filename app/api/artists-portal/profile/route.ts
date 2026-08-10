import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

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

  // Verificar contraseña actual usando crypto (igual que el login)
  const hashCurrent = crypto.createHash("sha256").update(current_password).digest("hex");

  const { data: account } = await supabase
    .from("artist_accounts")
    .select("id, password_hash")
    .eq("id", artist.id)
    .single();

  if (!account || account.password_hash !== hashCurrent) {
    return NextResponse.json({ error:"Wrong password" }, { status:400 });
  }

  // Guardar nueva contraseña
  const hashNew = crypto.createHash("sha256").update(new_password).digest("hex");

  await supabase.from("artist_accounts")
    .update({ password_hash: hashNew, must_change_password: false })
    .eq("id", artist.id);

  return NextResponse.json({ ok: true });
}

// Subir avatar
export async function PATCH(req: NextRequest) {
  const artist = await getArtist();
  if (!artist) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error:"No file" }, { status:400 });

  const ext    = file.name.split(".").pop();
  const path   = `avatar-${artist.id}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("artists")
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status:500 });

  const { data } = supabase.storage.from("artists").getPublicUrl(path);

  await supabase.from("artist_accounts")
    .update({ avatar_url: data.publicUrl })
    .eq("id", artist.id);

  return NextResponse.json({ ok: true, avatar_url: data.publicUrl });
}
