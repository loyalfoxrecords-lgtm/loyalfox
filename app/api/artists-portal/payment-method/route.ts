import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";
import { isValidEmail, isValidIban, normalizeIban, maskIban } from "@/lib/payment";

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

export async function GET() {
  const artist = await getArtist();
  if (!artist) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await supabase
    .from("artist_accounts")
    .select("paypal_email,bank_iban,payment_method")
    .eq("id", artist.id).single();
  return NextResponse.json(data || { paypal_email: "", bank_iban: "", payment_method: "paypal" });
}

export async function POST(req: NextRequest) {
  const artist = await getArtist();
  if (!artist) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const method = body.payment_method === "bank" ? "bank" : "paypal";
  const paypal = String(body.paypal_email || "").trim();
  const iban = normalizeIban(String(body.bank_iban || ""));

  if (method === "paypal" && !isValidEmail(paypal))
    return NextResponse.json({ error: "invalid_paypal" }, { status: 400 });
  if (method === "bank" && !isValidIban(iban))
    return NextResponse.json({ error: "invalid_iban" }, { status: 400 });

  const update: Record<string, string> = { payment_method: method };
  if (method === "paypal") update.paypal_email = paypal;
  if (method === "bank") update.bank_iban = iban;

  const { error } = await supabase.from("artist_accounts").update(update).eq("id", artist.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aviso al sello (sin exponer el IBAN completo)
  if (process.env.RESEND_API_KEY) {
    try {
      const detail = method === "paypal" ? `PayPal: ${paypal}` : `IBAN: ${maskIban(iban)}`;
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: process.env.RESEND_FROM || "LoyalFox Records <noreply@loyalfoxrecords.com>",
          to: ["contact@loyalfoxrecords.com"],
          subject: `Método de pago actualizado — ${artist.artist_name}`,
          text: `${artist.artist_name} ha actualizado su método de pago.\n${detail}`,
        }),
      });
    } catch { /* el aviso no debe bloquear el guardado */ }
  }

  return NextResponse.json({ ok: true });
}
