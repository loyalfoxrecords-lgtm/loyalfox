import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

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

  const { data:contract } = await supabase
    .from("artist_contracts")
    .select("*")
    .eq("id", contract_id)
    .eq("artist_account_id", artist.id)
    .single();

  if (!contract) return NextResponse.json({ error:"Not found" }, { status:404 });
  if (contract.status === "signed") return NextResponse.json({ error:"Already signed" }, { status:400 });

  // 1. Preparar imagen de firma
  const base64Data  = signature_data.replace(/^data:image\/png;base64,/, "");
  const sigBuffer   = Buffer.from(base64Data, "base64");
  const sigFilename = `sig-${contract_id}-${Date.now()}.png`;

  await supabase.storage.from("signatures")
    .upload(sigFilename, sigBuffer, { contentType:"image/png", upsert:true });
  const { data: sigUrlData } = supabase.storage.from("signatures").getPublicUrl(sigFilename);

  // 2. Descargar PDF original
  const pdfRes   = await fetch(contract.pdf_url);
  const pdfBytes = await pdfRes.arrayBuffer();

  // 3. Incrustar firma en el PDF
  const pdfDoc   = await PDFDocument.load(pdfBytes);
  const sigImage = await pdfDoc.embedPng(sigBuffer);
  const pages    = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const { width } = lastPage.getSize();

  lastPage.drawImage(sigImage, {
    x: width - 220, y: 60, width: 180, height: 60,
  });

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const signedDate = new Date().toLocaleDateString("es", {
    day:"numeric", month:"long", year:"numeric",
  });

  lastPage.drawLine({
    start: { x: width - 220, y: 135 },
    end:   { x: width - 40,  y: 135 },
    thickness: 0.5,
    color: rgb(0.7, 0.7, 0.7),
  });

  lastPage.drawText(`Firmado por: ${artist.artist_name}`, {
    x: width - 220, y: 130, size: 9, font, color: rgb(0.3, 0.3, 0.3),
  });
  lastPage.drawText(`Fecha: ${signedDate}`, {
    x: width - 220, y: 118, size: 9, font, color: rgb(0.3, 0.3, 0.3),
  });
  lastPage.drawText(`LoyalFox Records`, {
    x: width - 220, y: 106, size: 9, font, color: rgb(0.3, 0.3, 0.3),
  });

  // 4. Guardar PDF firmado
  const signedPdfBytes = await pdfDoc.save();
  const pdfFilename    = `signed-${contract_id}-${Date.now()}.pdf`;

  await supabase.storage.from("contracts")
    .upload(pdfFilename, signedPdfBytes, { contentType:"application/pdf", upsert:true });
  const { data: signedPdfUrlData } = supabase.storage.from("contracts").getPublicUrl(pdfFilename);

  // 5. Actualizar contrato
  await supabase.from("artist_contracts").update({
    status:         "signed",
    signature_url:  sigUrlData.publicUrl,
    signed_pdf_url: signedPdfUrlData.publicUrl,
    signed_at:      new Date().toISOString(),
  }).eq("id", contract_id);

  return NextResponse.json({
    ok:             true,
    signature_url:  sigUrlData.publicUrl,
    signed_pdf_url: signedPdfUrlData.publicUrl,
  });
}
