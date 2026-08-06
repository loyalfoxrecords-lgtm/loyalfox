import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req NextRequest) {
  const { name, artist, email, genre, links, message } = await req.json();

  if (!name  !email  !links) {
    return NextResponse.json({ errorMissing fields }, { status400 });
  }

  const { error } = await resend.emails.send({
    from LoyalFox Records noreply@loyalfoxrecords.com,
    to   [demos@loyalfoxrecords.com],
    replyTo email,
    subject `Nueva demo ${artist  name}`,
    html `
      div style=font-familysans-serif;max-width600px;margin0 auto;background#f9fafb;padding32px;border-radius8px;
        div style=background#111827;padding20px 24px;border-radius6px;margin-bottom24px;
          h1 style=color#a8e63d;font-size24px;margin0;letter-spacing2px;NUEVA DEMO RECIBIDAh1
          p style=color#6b7280;font-size12px;margin6px 0 0;LoyalFox Records · Portal de demosp
        div

        table style=width100%;border-collapsecollapse;
          tr style=border-bottom1px solid #e5e7eb;
            td style=padding14px 0;color#6b7280;font-size12px;font-weight600;width140px;NOMBREtd
            td style=padding14px 0;color#111827;font-size14px;${name}td
          tr
          tr style=border-bottom1px solid #e5e7eb;
            td style=padding14px 0;color#6b7280;font-size12px;font-weight600;ARTISTAtd
            td style=padding14px 0;color#111827;font-size14px;${artist  —}td
          tr
          tr style=border-bottom1px solid #e5e7eb;
            td style=padding14px 0;color#6b7280;font-size12px;font-weight600;EMAILtd
            td style=padding14px 0;font-size14px;
              a href=mailto${email} style=color#2563eb;${email}a
            td
          tr
          tr style=border-bottom1px solid #e5e7eb;
            td style=padding14px 0;color#6b7280;font-size12px;font-weight600;GÉNEROtd
            td style=padding14px 0;color#111827;font-size14px;${genre  —}td
          tr
          tr style=border-bottom1px solid #e5e7eb;
            td style=padding14px 0;color#6b7280;font-size12px;font-weight600;ENLACEStd
            td style=padding14px 0;font-size14px;
              a href=${links} style=color#2563eb;${links}a
            td
          tr
          ${message  `
          tr
            td style=padding14px 0;color#6b7280;font-size12px;font-weight600;vertical-aligntop;MENSAJEtd
            td style=padding14px 0;color#111827;font-size14px;line-height1.7;${message}td
          tr`  }
        table

        div style=margin-top24px;padding16px 20px;background#eff6ff;border-radius6px;border1px solid #bfdbfe;
          p style=color#2563eb;font-size13px;margin0;
            Responde directamente a este email para contactar con ${name}.
          p
        div

        p style=color#9ca3af;font-size11px;margin-top24px;text-aligncenter;
          LoyalFox Records · demos@loyalfoxrecords.com
        p
      div
    `,
  });

  if (error) return NextResponse.json({ errorerror.message }, { status500 });
  return NextResponse.json({ oktrue });
}