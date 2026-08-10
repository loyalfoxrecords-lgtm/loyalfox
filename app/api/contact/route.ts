import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error:"Missing fields" }, { status:400 });
  }

  const { error } = await resend.emails.send({
    from: "LoyalFox Records <noreply@loyalfoxrecords.com>",
    to: ["contact@loyalfoxrecords.com"],
    replyTo: email,
    subject: `Nuevo mensaje de contacto: ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:32px;border-radius:8px;">
        <div style="background:#111827;padding:20px 24px;border-radius:6px;margin-bottom:24px;">
          <h1 style="color:#a8e63d;font-size:22px;margin:0;letter-spacing:2px;">NUEVO MENSAJE DE CONTACTO</h1>
          <p style="color:#6b7280;font-size:12px;margin:6px 0 0;">LoyalFox Records · Formulario de contacto</p>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:14px 0;color:#6b7280;font-size:12px;font-weight:600;width:120px;">NOMBRE</td>
            <td style="padding:14px 0;color:#111827;font-size:14px;">${name}</td>
          </tr>
          <tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:14px 0;color:#6b7280;font-size:12px;font-weight:600;">EMAIL</td>
            <td style="padding:14px 0;font-size:14px;">
              <a href="mailto:${email}" style="color:#2563eb;">${email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:14px 0;color:#6b7280;font-size:12px;font-weight:600;vertical-align:top;">MENSAJE</td>
            <td style="padding:14px 0;color:#111827;font-size:14px;line-height:1.7;">${message.replace(/\n/g,"<br/>")}</td>
          </tr>
        </table>
        <div style="margin-top:24px;padding:16px 20px;background:#eff6ff;border-radius:6px;border:1px solid #bfdbfe;">
          <p style="color:#2563eb;font-size:13px;margin:0;">
            Responde directamente a este email para contactar con ${name}.
          </p>
        </div>
        <p style="color:#9ca3af;font-size:11px;margin-top:24px;text-align:center;">
          LoyalFox Records · contact@loyalfoxrecords.com
        </p>
      </div>
    `,
  });

  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  return NextResponse.json({ ok:true });
}
