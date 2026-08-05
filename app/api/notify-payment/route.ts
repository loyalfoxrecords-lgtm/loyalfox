import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, name, artist_name, amount, method, paypal, iban } = await req.json();

  // Por ahora solo log — conecta Resend o similar cuando tengas el dominio
  console.log(`PAGO NOTIFICADO:
    Artista: ${name} (${artist_name})
    Email:   ${email}
    Importe: $${amount.toFixed(2)}
    Método:  ${method}
    PayPal:  ${paypal || "—"}
    IBAN:    ${iban || "—"}
  `);

  // TODO: cuando tengas dominio, conecta Resend:
  // import { Resend } from "resend";
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: "pagos@loyalfoxrecords.com",
  //   to: email,
  //   subject: `LoyalFox Records — Pago de $${amount.toFixed(2)} procesado`,
  //   html: `<p>Hola ${name}, tu pago de $${amount.toFixed(2)} ha sido procesado vía ${method}.</p>`
  // });

  return NextResponse.json({ ok: true });
}