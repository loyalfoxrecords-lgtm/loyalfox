import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function getArtist() {
  const token = (await cookies()).get("artist_token")?.value;
  if (!token) return null;
  try { return jwt.verify(token, process.env.ARTISTS_JWT_SECRET!) as any; }
  catch { return null; }
}

export async function POST(req: NextRequest) {
  const artist = await getArtist();
  if (!artist) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const { contract_id, signature_data } = await req.json();
  if (!contract_id || !signature_data) return NextResponse.json({ error:"Missing data" }, { status:400 });

  // Verificar que el contrato pertenece al artista
  const { data:contract } = await supabase
    .from("artist_contracts")
    .select("*")
    .eq("id", contract_id)
    .eq("artist_account_id", artist.id)
    .single();

  if (!contract) return NextResponse.json({ error:"Contract not found" }, { status:404 });
  if (contract.status === "signed") return NextResponse.json({ error:"Already signed" }, { status:400 });

  // Subir imagen de la firma a Supabase Storage
  const base64Data = signature_data.replace(/^data:image\/png;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const filename = `sig-${contract_id}-${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from("signatures")
    .upload(filename, buffer, { contentType:"image/png", upsert:true });

  if (uploadError) return NextResponse.json({ error:uploadError.message }, { status:500 });

  const { data: urlData } = supabase.storage.from("signatures").getPublicUrl(filename);

  // Actualizar contrato como firmado
  const { error: updateError } = await supabase
    .from("artist_contracts")
    .update({
      status: "signed",
      signature_url: urlData.publicUrl,
      signed_at: new Date().toISOString(),
    })
    .eq("id", contract_id);

  if (updateError) return NextResponse.json({ error:updateError.message }, { status:500 });

  return NextResponse.json({ ok:true, signature_url:urlData.publicUrl });
}
