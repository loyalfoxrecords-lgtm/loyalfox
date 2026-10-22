"use client";
import { useCallback, useEffect, useState } from "react";
import { css } from "./styles";
import ReleasePipeline, { PipeContract, PipeSubmission } from "../artists-portal/ReleasePipeline";

type Contract = PipeContract & { artist_name?: string };
type Sub = PipeSubmission & { stage?: string | null };

const f = { fontFamily: "system-ui" } as const;
const dateInput = (v?: string | null) => (v ? v.slice(0, 10) : "");

function ReleaseRow({ ct, sub, onPatch }: {
  ct: Contract; sub?: Sub; onPatch: (contractId: string, patch: Record<string, any>) => Promise<void>;
}) {
  const stage = sub ? (sub.stage || "info") : "none";
  const [busy, setBusy] = useState(false);
  const run = async (patch: Record<string, any>) => { setBusy(true); await onPatch(ct.id, patch); setBusy(false); };

  const stageBtn = (id: "info" | "distribution" | "published", label: string) => {
    const active = stage === id;
    return (
      <button key={id} disabled={busy || ct.status !== "signed"} onClick={() => run({ stage: id })}
        style={{ ...f, fontSize: "12px", fontWeight: 500, padding: "5px 10px", borderRadius: "6px", cursor: "pointer",
          border: `1px solid ${active ? css.accent : css.border}`,
          background: active ? css.accent : css.white, color: active ? css.white : css.textSub,
          opacity: ct.status !== "signed" ? 0.5 : 1 }}>
        {label}
      </button>
    );
  };

  const dateField = (label: string, key: "distribution_at" | "release_date" | "published_at") => (
    <label style={{ ...f, fontSize: "11px", color: css.textMute, display: "flex", flexDirection: "column", gap: "3px" }}>
      {label}
      <input type="date" defaultValue={dateInput((sub as any)?.[key])} disabled={busy || !sub}
        onBlur={e => { if (e.target.value !== dateInput((sub as any)?.[key])) run({ [key]: e.target.value || null }); }}
        style={{ ...f, fontSize: "12px", padding: "4px 6px", border: `1px solid ${css.border}`, borderRadius: "6px", color: css.text }} />
    </label>
  );

  return (
    <div style={{ padding: "12px 20px", borderBottom: `1px solid ${css.borderLight}`, display: "flex", flexDirection: "column", gap: "10px" }}>
      <p style={{ ...f, fontSize: "13px", fontWeight: 600, color: css.text }}>
        {ct.title}{" "}
        <span style={{ fontWeight: 400, fontSize: "11px", color: ct.status === "signed" ? css.green : css.yellow }}>
          · {ct.status === "signed" ? "contrato firmado" : "contrato pendiente de firma"}
        </span>
      </p>
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {stageBtn("info", "Info recibida")}
        {stageBtn("distribution", "En distribución")}
        {stageBtn("published", "Publicada")}
      </div>
      {sub && (
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {dateField("Entra en distribución", "distribution_at")}
          {dateField("Salida prevista", "release_date")}
          {dateField("Publicada el", "published_at")}
        </div>
      )}
      {!sub && ct.status === "signed" && (
        <p style={{ ...f, fontSize: "11px", color: css.textMute }}>El artista aún no ha enviado la info. Si la recibes por otra vía, marca "Info recibida".</p>
      )}
    </div>
  );
}

export default function AdminArtistReleases({ artistAccountId }: { artistAccountId: string }) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/release-submissions?artist_account_id=${artistAccountId}`);
    if (res.ok) { const d = await res.json(); setContracts(d.contracts || []); setSubs(d.submissions || []); }
    setLoading(false);
  }, [artistAccountId]);
  useEffect(() => { setLoading(true); load(); }, [load]);

  const patch = async (contractId: string, body: Record<string, any>) => {
    await fetch("/api/admin/release-submissions", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contract_id: contractId, ...body }),
    });
    await load();
  };

  return (
    <div>
      <p style={{ fontSize: "11px", fontWeight: 600, color: css.textMute, padding: "12px 20px", borderBottom: `1px solid ${css.border}`,
        ...f, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Lanzamientos
      </p>
      {loading ? (
        <p style={{ ...f, fontSize: "13px", color: css.textMute, padding: "20px" }}>Cargando…</p>
      ) : contracts.length === 0 ? (
        <p style={{ ...f, fontSize: "13px", color: css.textMute, padding: "20px" }}>Sin contratos todavía. Sube uno desde la pestaña Contratos.</p>
      ) : (
        <>
          <div style={{ padding: "16px 20px", background: css.bg, borderBottom: `1px solid ${css.border}` }}>
            <ReleasePipeline lang="es" contracts={contracts} submissions={subs} />
          </div>
          {contracts.map(ct => (
            <ReleaseRow key={ct.id} ct={ct} sub={subs.find(s => s.contract_id === ct.id)} onPatch={patch} />
          ))}
        </>
      )}
    </div>
  );
}
