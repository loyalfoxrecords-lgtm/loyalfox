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

// GET ?artist_account_id=...  (sin parámetro: todos)
export async function GET(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const artistId = req.nextUrl.searchParams.get("artist_account_id");

  let contractsQ = supabase.from("artist_contracts").select("id,artist_account_id,artist_name,title,status,signed_at,created_at");
  if (artistId) contractsQ = contractsQ.eq("artist_account_id", artistId);
  const { data: contracts } = await contractsQ.order("created_at", { ascending: false });

  const ids = (contracts || []).map(c => c.id);
  let submissions: any[] = [];
  if (ids.length) {
    const { data } = await supabase.from("release_submissions").select("*").in("contract_id", ids);
    submissions = data || [];
  }
  return NextResponse.json({ contracts: contracts || [], submissions });
}

// PATCH { contract_id, stage?, distribution_at?, release_date?, published_at? }
export async function PATCH(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { contract_id } = body;
  if (!contract_id) return NextResponse.json({ error: "Missing contract_id" }, { status: 400 });

  const patch: Record<string, any> = {};
  if (["info", "distribution", "published"].includes(body.stage)) patch.stage = body.stage;
  for (const k of ["distribution_at", "release_date", "published_at"]) {
    if (k in body) patch[k] = body[k] || null;
  }
  // Al cambiar de fase se rellena la fecha si falta
  const now = new Date().toISOString();
  if (patch.stage === "distribution" && !("distribution_at" in body)) patch.distribution_at = now;
  if (patch.stage === "published" && !("published_at" in body)) patch.published_at = now;

  const { data: existing } = await supabase
    .from("release_submissions").select("id").eq("contract_id", contract_id).maybeSingle();

  if (existing) {
    const { error } = await supabase.from("release_submissions").update(patch).eq("contract_id", contract_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { data: ct } = await supabase
      .from("artist_contracts").select("artist_account_id").eq("id", contract_id).single();
    const { error } = await supabase.from("release_submissions")
      .insert({ contract_id, artist_account_id: ct?.artist_account_id, ...patch });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
