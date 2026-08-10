import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

export async function POST(req: NextRequest) {
  if (!await isAdmin()) return NextResponse.json({ error:"Unauthorized" }, { status:401 });

  const { contract_id } = await req.json();

  // Obtener contrato
  const { data: contract } = await supabase
    .from("artist_contracts")
    .select("*")
    .eq("id", contract_id)
    .single();

  if (!contract) return NextResponse.json({ error:"Not found" }, { status:404 });
  if (!contract.signature_url) return NextResponse.json({ error:"No signature" }, { status:400 });

  // Obtener nombre real del artista
  const { data: account } = await supabase
    .from("artist_accounts")
    .select("name, artist_name")
    .eq("id", contract.artist_account_id)
    .single();

  const displayName = account?.name
    ? `${account.name} (${account.artist_name || contract.artist_name})`
    : contract.artist_name;

  // Descargar imagen de firma
  const sigRes    = await fetch(contract.signature_url);
  const sigBytes  = await sigRes.arrayBuffer();
  const sigBuffer = Buffer.from(sigBytes);

  // Descargar PDF original
  const pdfRes   = await fetch(contract.pdf_url);
  const pdfBytes = await pdfRes.arrayBuffer();

  // Incrustar firma en PDF
  const pdfDoc   = await PDFDocument.load(pdfBytes);
  const sigImage = await pdfDoc.embedPng(sigBuffer);
  const pages    = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { width } = lastPage.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const signedDate = contract.signed_at
    ? new Date(contract.signed_at).toLocaleDateString("es", { day:"numeric", month:"long", year:"numeric" })
    : new Date().toLocaleDateString("es", { day:"numeric", month:"long", year:"numeric" });

  lastPage.drawLine({
    start: { x: width - 240, y: 145 },
    end:   { x: width - 30,  y: 145 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });

  lastPage.drawImage(sigImage, {
    x: width - 240, y: 70, width: 200, height: 65,
  });

  lastPage.drawText(`Firmado por: ${displayName}`, {
    x: width - 240, y: 56, size: 8, font, color: rgb(0.2, 0.2, 0.2),
  });
  lastPage.drawText(`Fecha: ${signedDate}`, {
    x: width - 240, y: 44, size: 8, font, color: rgb(0.2, 0.2, 0.2),
  });
  lastPage.drawText(`LoyalFox Records — Contrato firmado digitalmente`, {
    x: width - 240, y: 32, size: 7, font, color: rgb(0.5, 0.5, 0.5),
  });

  // Guardar PDF firmado
  const signedPdfBytes = await pdfDoc.save();
  const pdfFilename    = `signed-${contract_id}-${Date.now()}.pdf`;

  await supabase.storage.from("contracts")
    .upload(pdfFilename, signedPdfBytes, { contentType:"application/pdf", upsert:true });
  const { data: urlData } = supabase.storage.from("contracts").getPublicUrl(pdfFilename);

  await supabase.from("artist_contracts")
    .update({ signed_pdf_url: urlData.publicUrl })
    .eq("id", contract_id);

  return NextResponse.json({ ok:true, signed_pdf_url: urlData.publicUrl });
}
