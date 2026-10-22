import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";

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

export async function GET() {
  const artist = await getArtist();
  if (!artist) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: account } = await supabase
    .from("artist_accounts")
    .select("id,name,artist_name,full_name,city,url_spotify_artist,url_soundcloud,url_apple_artist,avatar_url,paypal_email,bank_iban,payment_method,must_change_password")
    .eq("id", artist.id)
    .single();

  const { data: contracts } = await supabase
    .from("artist_contracts")
    .select("id,title,status,signed_at,created_at")
    .eq("artist_account_id", artist.id)
    .order("created_at", { ascending: false });

  const ids = (contracts || []).map(c => c.id);
  let submissions: any[] = [];
  if (ids.length) {
    const { data } = await supabase.from("release_submissions").select("*").in("contract_id", ids);
    submissions = data || [];
  }

  const { count } = await supabase
    .from("artist_messages")
    .select("id", { count: "exact", head: true })
    .eq("artist_account_id", artist.id)
    .eq("sender", "admin")
    .eq("read", false);

  return NextResponse.json({
    account: account || {},
    contracts: contracts || [],
    submissions,
    unread: count || 0,
  });
}
