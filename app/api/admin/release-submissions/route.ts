import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

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
    .from("release_submissions")
    .select(`
      *,
      artist_contracts(title, pdf_url, status, signed_pdf_url),
      artist_accounts(name, artist_name, full_name, city, email,
        url_spotify_artist, url_soundcloud, url_apple_artist)
    `)
    .order("submitted_at", { ascending:false });

  return NextResponse.json(data || []);
}
