"use client";
import { useState } from "react";
import { c, base, card, cardHeader, cardTitle, btnDark, input, Lang } from "./theme";
import { isValidEmail, isValidIban, formatIban, normalizeIban } from "@/lib/payment";

export type PaymentData = { payment_method: string; paypal_email: string; bank_iban: string };

export default function PaymentMethodForm({ lang, initial, onSaved }: {
  lang: Lang; initial: PaymentData; onSaved?: (d: PaymentData) => void;
}) {
  const L = (es: string, en: string) => (lang === "en" ? en : es);
  const [method, setMethod] = useState<"paypal" | "bank">(initial.payment_method === "bank" ? "bank" : "paypal");
  const [paypal, setPaypal] = useState(initial.paypal_email || "");
  const [iban, setIban] = useState(formatIban(initial.bank_iban || ""));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const valid = method === "paypal" ? isValidEmail(paypal) : isValidIban(iban);
  const hasSaved = method === "paypal" ? !!initial.paypal_email : !!initial.bank_iban;

  const save = async () => {
    setMsg(null);
    if (!valid) {
      setMsg({ ok: false, text: method === "paypal"
        ? L("Introduce un email de PayPal válido.", "Enter a valid PayPal email.")
        : L("El IBAN no es válido. Revisa que esté completo.", "The IBAN is not valid. Check it is complete.") });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/artists-portal/payment-method", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_method: method, paypal_email: paypal.trim(), bank_iban: normalizeIban(iban) }),
      });
      if (res.ok) {
        setMsg({ ok: true, text: L("Método de pago guardado.", "Payment method saved.") });
        onSaved?.({ payment_method: method, paypal_email: paypal.trim(), bank_iban: normalizeIban(iban) });
      } else {
        setMsg({ ok: false, text: L("No se pudo guardar. Inténtalo de nuevo.", "Could not save. Please try again.") });
      }
    } catch {
      setMsg({ ok: false, text: L("Error de conexión.", "Connection error.") });
    }
    setSaving(false);
  };

  const tab = (id: "paypal" | "bank", label: string) => (
    <button key={id} type="button" onClick={() => { setMethod(id); setMsg(null); }}
      style={{ ...base, flex: 1, padding: "9px 12px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
        border: `1px solid ${method === id ? c.accent : c.border}`, borderRadius: "6px",
        background: method === id ? c.accent : c.white, color: method === id ? c.white : c.textSub }}>
      {label}
    </button>
  );

  return (
    <div style={card}>
      <div style={cardHeader}>
        <p style={cardTitle}>{L("Método de pago", "Payment method")}</p>
        {hasSaved && <span style={{ ...base, fontSize: "11px", color: c.green, fontWeight: 600 }}>✓ {L("Configurado", "Set up")}</span>}
      </div>
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {tab("paypal", "PayPal")}
          {tab("bank", L("Transferencia (IBAN)", "Bank transfer (IBAN)"))}
        </div>
        {method === "paypal" ? (
          <div>
            <label style={{ ...base, fontSize: "12px", fontWeight: 500, color: c.textSub, display: "block", marginBottom: "6px" }}>
              {L("Email de PayPal", "PayPal email")}
            </label>
            <input type="email" inputMode="email" autoComplete="email" value={paypal}
              placeholder="tu@email.com" onChange={e => setPaypal(e.target.value)} style={input} />
          </div>
        ) : (
          <div>
            <label style={{ ...base, fontSize: "12px", fontWeight: 500, color: c.textSub, display: "block", marginBottom: "6px" }}>IBAN</label>
            <input type="text" autoCapitalize="characters" value={iban} placeholder="ES00 0000 0000 0000 0000 0000"
              onChange={e => setIban(formatIban(e.target.value))} style={input} />
            {iban && !isValidIban(iban) && normalizeIban(iban).length >= 15 && (
              <p style={{ ...base, fontSize: "11px", color: c.red, marginTop: "6px" }}>
                {L("El dígito de control del IBAN no coincide.", "The IBAN check digits do not match.")}
              </p>
            )}
          </div>
        )}
        {msg && (
          <div style={{ padding: "10px 14px", borderRadius: "6px",
            background: msg.ok ? c.greenBg : c.redBg, border: `1px solid ${msg.ok ? c.greenBorder : c.redBorder}` }}>
            <p style={{ ...base, fontSize: "13px", color: msg.ok ? c.green : c.red }}>{msg.text}</p>
          </div>
        )}
        <button type="button" onClick={save} disabled={saving || !valid}
          style={{ ...btnDark, alignSelf: "flex-start", opacity: saving || !valid ? 0.5 : 1 }}>
          {saving ? L("Guardando...", "Saving...") : L("Guardar método de pago", "Save payment method")}
        </button>
        <p style={{ ...base, fontSize: "11px", color: c.textMute, lineHeight: 1.6 }}>
          {L("Los pagos se envían al método marcado como activo. Avisamos al sello cada vez que lo cambias.",
             "Payments go to the method marked as active. The label is notified whenever you change it.")}
        </p>
      </div>
    </div>
  );
}
