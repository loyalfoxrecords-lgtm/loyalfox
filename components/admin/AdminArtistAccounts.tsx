"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { css, hs } from "./styles";
import Papa from "papaparse";

type ArtistAccount = {
  id: string; name: string; artist_name: string;
  email: string; active: boolean;
  royalty_percent: number; is_own_artist: boolean;
  paypal_email: string; bank_iban: string;
  payment_method: string; notes: string;
};
type Royalty = {
  id: string; artist_name: string; month: string;
  total_streams: number; gross_revenue: number;
  artist_share: number; paid: boolean; paid_at: string | null;
  payment_proof_url: string;
};

const THRESHOLD = 50;
const fmt2 = (n: number) => `$${Number(n).toFixed(2)}`;
const fmt4 = (n: number) => `$${Number(n).toFixed(4)}`;
const fmtMonthFull = (m: string) => {
  try { const d = new Date(m+"-02"); return d.toLocaleString("es",{month:"long",year:"numeric"}); }
  catch { return m; }
};
const currentYear = new Date().getFullYear();
const emptyForm = {
  name:"", artist_name:"", email:"", password:"",
  royalty_percent:60, is_own_artist:false,
  paypal_email:"", bank_iban:"", payment_method:"paypal", notes:""
};

// ─── Próximos pagos trimestrales ───
function PaymentCalendar() {
  const now       = new Date();
  const quarters  = [0, 3, 6, 9]; // ene, abr, jul, oct
  const upcoming  = quarters
    .map(q => {
      const year = q <= now.getMonth() ? now.getFullYear()+1 : now.getFullYear();
      const date = new Date(year, q, 1);
      const daysLeft = Math.ceil((date.getTime()-now.getTime())/(1000*60*60*24));
      return { date, daysLeft, label:date.toLocaleString("es",{month:"long",year:"numeric"}) };
    })
    .filter(q => q.daysLeft >= 0)
    .sort((a,b) => a.daysLeft-b.daysLeft)
    .slice(0,4);

  return (
    <div style={{ marginBottom:"24px" }}>
      <p style={{ fontSize:"12px", fontWeight:600, color:css.textMute,
        textTransform:"uppercase" as any, letterSpacing:"0.05em",
        marginBottom:"12px", fontFamily:"system-ui" }}>
        📅 Calendario de pagos trimestrales
      </p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"8px" }}>
        {upcoming.map((q,i) => {
          const isNext   = i === 0;
          const isUrgent = q.daysLeft <= 30;
          return (
            <div key={i} style={{ padding:"14px 16px", borderRadius:"8px",
              background: isNext ? (isUrgent?css.redBg:css.greenBg) : css.white,
              border:`1px solid ${isNext?(isUrgent?css.redBorder:css.greenBorder):css.border}` }}>
              {isNext && (
                <span style={{ display:"inline-block", fontSize:"10px", fontWeight:600,
                  padding:"1px 6px", borderRadius:"9999px", marginBottom:"6px",
                  background:isUrgent?css.red:css.green, color:"#fff",
                  fontFamily:"system-ui" }}>
                  {isUrgent?"⚠ Próximo":"Siguiente"}
                </span>
              )}
              <p style={{ fontSize:"13px", fontWeight:600, fontFamily:"system-ui",
                color:isNext?(isUrgent?css.red:css.green):css.text,
                textTransform:"capitalize" as any, marginBottom:"2px" }}>
                {q.label}
              </p>
              <p style={{ fontSize:"11px", color:css.textMute, fontFamily:"system-ui" }}>
                {q.daysLeft === 0 ? "¡Hoy!" : `En ${q.daysLeft} días`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Grupo de artistas colapsable ───
function ArtistGroup({ title, badge, badgeStyle, accounts, getArtistData, selectedArtist,
  setSelectedArtist, markAllPaid, payingId, showPayBtn, defaultOpen, borderColor }: {
  title: string; badge?: string; badgeStyle?: React.CSSProperties;
  accounts: ArtistAccount[]; getArtistData: (n:string)=>any;
  selectedArtist: string|null; setSelectedArtist: (v:string|null)=>void;
  markAllPaid: (a:ArtistAccount)=>void; payingId: string|null;
  showPayBtn: boolean; defaultOpen: boolean; borderColor: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (accounts.length === 0) return null;

  const totalPending = accounts.reduce((a,acc) => {
    const d = getArtistData(acc.artist_name);
    return a + d.pending;
  }, 0);

  return (
    <div style={{ background:css.white, border:`1px solid ${css.border}`,
      borderRadius:"8px", overflow:"hidden", marginBottom:"12px" }}>
      <div onClick={() => setOpen(!open)}
        style={{ padding:"14px 20px", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          borderBottom: open?`1px solid ${css.border}`:"none",
          borderLeft:`3px solid ${borderColor}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
          <span style={{ fontSize:"13px" }}>{open?"▾":"▸"}</span>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
              <p style={{ fontSize:"13px", fontWeight:600,
                color:css.text, fontFamily:"system-ui" }}>
                {title} ({accounts.length})
              </p>
              {badge && <span style={badgeStyle}>{badge}</span>}
            </div>
            {totalPending > 0 && (
              <p style={{ fontSize:"11px", color:css.textMute, fontFamily:"system-ui" }}>
                Total pendiente: <strong>{fmt2(totalPending)}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      {open && (
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:css.bg }}>
              {["Artista","Streams","% Art","Bruto","Su parte","Pagado","Pendiente","Estado",showPayBtn?"":undefined].filter(Boolean).map((h,i) => (
                <th key={i} style={{ padding:"10px 16px", textAlign:"left",
                  fontSize:"11px", fontWeight:500, color:css.textMute,
                  fontFamily:"system-ui", borderBottom:`1px solid ${css.border}` }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map((a,i) => {
              const d = getArtistData(a.artist_name);
              const isSel = selectedArtist===a.artist_name;
              return (
                <tr key={a.id}
                  onClick={() => setSelectedArtist(isSel?null:a.artist_name)}
                  style={{ borderBottom:`1px solid ${css.border}`,
                    background:isSel?css.accentBg:i%2===0?css.white:css.bg,
                    cursor:"pointer" }}
                  onMouseEnter={(e) => { if(!isSel)(e.currentTarget as HTMLElement).style.background=css.accentBg; }}
                  onMouseLeave={(e) => { if(!isSel)(e.currentTarget as HTMLElement).style.background=i%2===0?css.white:css.bg; }}>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                      <div style={{ width:"28px", height:"28px", borderRadius:"50%",
                        background:a.is_own_artist?css.purpleBg:css.accentBg,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:"11px", fontWeight:700,
                        color:a.is_own_artist?css.purple:css.text, flexShrink:0 }}>
                        {a.artist_name[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize:"13px", fontWeight:500,
                          color:css.text, fontFamily:"system-ui" }}>{a.artist_name}</p>
                        <p style={{ fontSize:"11px", color:css.textMute,
                          fontFamily:"system-ui" }}>{a.name}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:"13px",
                    color:css.textSub, fontFamily:"system-ui" }}>
                    {d.streams.toLocaleString()}
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:"13px",
                    fontWeight:600, color:css.text, fontFamily:"system-ui" }}>
                    {a.is_own_artist?"—":a.royalty_percent??60+"%"}
                    {!a.is_own_artist && "%"}
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:"13px",
                    color:css.textSub, fontFamily:"system-ui" }}>
                    {fmt2(d.grossTotal)}
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:"13px",
                    color:a.is_own_artist?css.purple:css.text, fontFamily:"system-ui" }}>
                    {a.is_own_artist?"Tuyo":fmt2(d.totalAll)}
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:"13px",
                    color:css.textSub, fontFamily:"system-ui" }}>
                    {fmt2(d.totalPaid)}
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ fontSize:"13px", fontWeight:600, fontFamily:"system-ui",
                      color:a.is_own_artist?css.purple:d.canPay?css.green:css.text }}>
                      {a.is_own_artist?fmt2(d.grossTotal):fmt2(d.pending)}
                    </span>
                  </td>
                  <td style={{ padding:"12px 16px" }}>
                    {a.is_own_artist?<span style={hs.badgePurple}>Propio</span>
                    :d.canPay?<span style={hs.badgeGreen}>✓ Listo</span>
                    :d.pending>0?<span style={hs.badgeYellow}>Acumulando</span>
                    :<span style={hs.badgeGray}>Sin datos</span>}
                  </td>
                  {showPayBtn && (
                    <td style={{ padding:"12px 16px" }}>
                      {!a.is_own_artist && d.unpaid.length>0 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAllPaid(a); }}
                          disabled={payingId===a.artist_name}
                          style={{ ...hs.btnGreen, fontSize:"12px", padding:"5px 12px",
                            opacity:payingId===a.artist_name?0.7:1 }}>
                          {payingId===a.artist_name?"...":"Pagar"}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AdminArtistAccounts() {
  const [accounts, setAccounts]   = useState<ArtistAccount[]>([]);
  const [royalties, setRoyalties] = useState<Royalty[]>([]);
  const [tab, setTab]             = useState<"payments"|"accounts"|"csv">("payments");
  const [selectedArtist, setSelectedArtist] = useState<string|null>(null);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [editForm, setEditForm]   = useState({...emptyForm});
  const [addForm, setAddForm]     = useState({...emptyForm});
  const [showAddForm, setShowAddForm] = useState(false);
  const [csvMonth, setCsvMonth]   = useState("");
  const [csvStatus, setCsvStatus] = useState("");
  const [loading, setLoading]     = useState(false);
  const [uploadingProof, setUploadingProof] = useState<string|null>(null);
  const [payingId, setPayingId]             = useState<string|null>(null);
  const [sendingCredentials, setSendingCredentials] = useState<string|null>(null);
  const [credentialsSent, setCredentialsSent]       = useState<Set<string>>(new Set());
  const [tempPasswords, setTempPasswords]           = useState<Record<string,string>>({});

  const load = async () => {
    const [{ data:a }, { data:r }] = await Promise.all([
      supabase.from("artist_accounts").select("*").order("artist_name"),
      supabase.from("artist_royalties").select("*").order("month", { ascending:false }),
    ]);
    if (a) setAccounts(a);
    if (r) setRoyalties(r);
  };
  useEffect(() => { load(); }, []);

  const getArtistData = (artistName: string) => {
    const all     = royalties.filter(r => r.artist_name === artistName);
    const unpaid  = all.filter(r => !r.paid);
    const paid    = all.filter(r => r.paid);
    const pending = unpaid.reduce((a,r) => a + Number(r.artist_share), 0);
    const totalPaid  = paid.reduce((a,r) => a + Number(r.artist_share), 0);
    const totalAll   = all.reduce((a,r) => a + Number(r.artist_share), 0);
    const streams    = all.reduce((a,r) => a + Number(r.total_streams), 0);
    const grossTotal = all.reduce((a,r) => a + Number(r.gross_revenue), 0);
    return { all, unpaid, paid, pending, totalPaid, totalAll, streams, grossTotal, canPay: pending >= THRESHOLD };
  };

  const globalSummary = (() => {
    let totalPending=0, totalOwn=0, readyCount=0, totalPaid=0;
    accounts.forEach(a => {
      const d = getArtistData(a.artist_name);
      if (a.is_own_artist) totalOwn += d.grossTotal;
      else { totalPending+=d.pending; totalPaid+=d.totalPaid; if(d.canPay) readyCount++; }
    });
    return { totalPending, totalOwn, readyCount, totalPaid };
  })();

  const markSinglePaid = async (royaltyId: string, share: number, month: string) => {
    if (!confirm(`¿Marcar ${fmt4(share)} de ${fmtMonthFull(month.slice(0,7))} como pagado?`)) return;
    await supabase.from("artist_royalties")
      .update({ paid:true, paid_at:new Date().toISOString() }).eq("id", royaltyId);
    await load();
  };

  const markAllPaid = async (account: ArtistAccount) => {
    const d = getArtistData(account.artist_name);
    if (d.unpaid.length === 0) return;
    if (!confirm(`¿Marcar todos los pendientes de ${account.artist_name} como pagados?\nTotal: ${fmt2(d.pending)}`)) return;
    setPayingId(account.artist_name);
    for (const r of d.unpaid) {
      await supabase.from("artist_royalties")
        .update({ paid:true, paid_at:new Date().toISOString() }).eq("id", r.id);
    }
    await fetch("/api/notify-payment", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        email: account.email, name: account.name,
        artist_name: account.artist_name, amount: d.pending,
        method: account.payment_method,
        paypal: account.paypal_email, iban: account.bank_iban,
      }),
    });
    await load();
    setPayingId(null);
  };

  const sendCredentials = async (account: ArtistAccount) => {
    const tempPass = tempPasswords[account.id] || "";
    if (!tempPass.trim()) {
      alert("Escribe una contraseña temporal primero"); return;
    }
    setSendingCredentials(account.id);
    const res = await fetch("/api/admin/send-credentials", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        name:        account.name,
        artist_name: account.artist_name,
        email:       account.email,
        password:    tempPass,
      }),
    });
    if (res.ok) {
      setCredentialsSent(s => new Set([...s, account.id]));
      setTempPasswords(p => ({...p, [account.id]:""}));
      alert(`✓ Credenciales enviadas a ${account.email}`);
    } else {
      alert("Error al enviar el email. Comprueba que RESEND_API_KEY está configurado en Vercel.");
    }
    setSendingCredentials(null);
  };

  const deleteAccount = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar la cuenta de ${name}? Se eliminarán también sus regalías.`)) return;
    const account = accounts.find(a => a.id === id);
    if (account) {
      await supabase.from("artist_royalties").delete().eq("artist_name", account.artist_name);
    }
    await supabase.from("artist_accounts").delete().eq("id", id);
    if (selectedArtist === account?.artist_name) setSelectedArtist(null);
    await load();
  };

  const uploadProof = async (royaltyId: string, file: File) => {
    setUploadingProof(royaltyId);
    const ext  = file.name.split(".").pop();
    const path = `${royaltyId}.${ext}`;
    const { error } = await supabase.storage
      .from("payment-proofs").upload(path, file, { upsert:true });
    if (error) { alert("Error al subir: "+error.message); setUploadingProof(null); return; }
    const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(path);
    await supabase.from("artist_royalties")
      .update({ payment_proof_url: urlData.publicUrl }).eq("id", royaltyId);
    await load();
    setUploadingProof(null);
  };

  const addAccount = async () => {
    if (!addForm.name||!addForm.artist_name||!addForm.email||!addForm.password) {
      alert("Rellena todos los campos obligatorios"); return;
    }
    setLoading(true);
    const buf  = new TextEncoder().encode(addForm.password);
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",buf)))
      .map(b=>b.toString(16).padStart(2,"0")).join("");
    const { error } = await supabase.from("artist_accounts").insert({
      name:addForm.name, artist_name:addForm.artist_name,
      email:addForm.email.toLowerCase(), password_hash:hash, active:true,
      royalty_percent:addForm.royalty_percent, is_own_artist:addForm.is_own_artist,
      paypal_email:addForm.paypal_email, bank_iban:addForm.bank_iban,
      payment_method:addForm.payment_method, notes:addForm.notes,
    });
    if (error) alert("Error: "+error.message);
    else { setAddForm({...emptyForm}); setShowAddForm(false); await load(); }
    setLoading(false);
  };

  const saveEdit = async (id: string) => {
    setLoading(true);
    const updates: Record<string,any> = {
      name:editForm.name, artist_name:editForm.artist_name,
      email:editForm.email.toLowerCase(),
      royalty_percent:editForm.royalty_percent, is_own_artist:editForm.is_own_artist,
      paypal_email:editForm.paypal_email, bank_iban:editForm.bank_iban,
      payment_method:editForm.payment_method, notes:editForm.notes,
    };
    if (editForm.password.trim()) {
      const buf  = new TextEncoder().encode(editForm.password);
      updates.password_hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",buf)))
        .map(b=>b.toString(16).padStart(2,"0")).join("");
    }
    await supabase.from("artist_accounts").update(updates).eq("id",id);
    setEditingId(null); await load(); setLoading(false);
  };

  const importArtistsFromCSV = (file: File) => {
    setCsvStatus("Importando artistas...");
    Papa.parse(file, {
      header:true, skipEmptyLines:true,
      complete: async (result) => {
        const rows = result.data as Record<string,string>[];
        const artistNames = [...new Set(
          rows.map(r => r["Artist"]?.trim()).filter(Boolean)
        )] as string[];
        let created = 0, skipped = 0;
        for (const artistName of artistNames) {
          const exists = accounts.find(a => a.artist_name.toLowerCase()===artistName.toLowerCase());
          if (exists) { skipped++; continue; }
          const password = Math.random().toString(36).slice(2, 10);
          const buf      = new TextEncoder().encode(password);
          const hash     = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buf)))
            .map(b => b.toString(16).padStart(2,"0")).join("");
          await supabase.from("artist_accounts").insert({
            name:artistName, artist_name:artistName,
            email:`${artistName.toLowerCase().replace(/\s+/g,"").replace(/[^a-z0-9]/g,"")}@loyalfox.com`,
            password_hash:hash, active:true, royalty_percent:60,
            is_own_artist:true, payment_method:"paypal",
          });
          created++;
        }
        await load();
        setCsvStatus(
          `✓ ${created} artista${created!==1?"s":""} creados como propios`+
          (skipped>0?` · ${skipped} ya existían`:"")+
          ` — Edita los externos desde Cuentas`
        );
      },
    });
  };

  const processCSV = (file: File) => {
    if (!csvMonth) { setCsvStatus("⚠ Selecciona un mes primero"); return; }
    setCsvStatus("Procesando...");
    Papa.parse(file, {
      header:true, skipEmptyLines:true,
      complete: async (result) => {
        const rows = result.data as Record<string,string>[];
        const map: Record<string,{streams:number;revenue:number}> = {};
        rows.forEach(r => {
          const artist = r["Artist"]?.trim(); if(!artist) return;
          const qty = parseInt(r["Quantity"]||"0");
          const rev = parseFloat(r["Recipient Net Royalty ($ USD)"]||"0");
          if(!map[artist]) map[artist]={streams:0,revenue:0};
          map[artist].streams+=qty; map[artist].revenue+=rev;
        });
        let ok=0, skip=0; const skipped:string[]=[];
        for (const [artistName, data] of Object.entries(map)) {
          const acc = accounts.find(a=>a.artist_name.toLowerCase()===artistName.toLowerCase());
          if (!acc) { skipped.push(artistName); skip++; continue; }
          const pct   = (acc.royalty_percent??60)/100;
          const share = data.revenue*pct;
          const { data:ex } = await supabase.from("artist_royalties")
            .select("id").eq("artist_name",artistName).eq("month",csvMonth).single();
          if (ex) {
            await supabase.from("artist_royalties").update({
              total_streams:data.streams, gross_revenue:data.revenue, artist_share:share,
            }).eq("id",ex.id);
          } else {
            await supabase.from("artist_royalties").insert({
              artist_name:artistName, month:csvMonth,
              total_streams:data.streams, gross_revenue:data.revenue, artist_share:share,
            });
          }
          ok++;
        }
        await load();
        setCsvStatus(`✓ ${ok} artista${ok!==1?"s":""} actualizados`+
          (skip>0?` · ${skip} sin cuenta: ${skipped.slice(0,4).join(", ")}${skipped.length>4?" …":""}`:""));
      },
    });
  };

  const inp: React.CSSProperties = { ...hs.input };

  const ArtistForm = ({ data, onChange }: {
    data: typeof emptyForm; onChange: (d: typeof emptyForm) => void;
  }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
        {[
          { label:"Nombre real *",     key:"name",        type:"text",     ph:"Nombre completo"     },
          { label:"Nombre artístico *",key:"artist_name", type:"text",     ph:"Igual que en el CSV" },
          { label:"Email *",           key:"email",       type:"email",    ph:"email@ejemplo.com"   },
          { label:"Contraseña *",      key:"password",    type:"password", ph:"Mínimo 8 caracteres" },
        ].map(f => (
          <div key={f.key}>
            <label style={hs.formLabel}>{f.label}</label>
            <input type={f.type} placeholder={f.ph}
              value={(data as any)[f.key]}
              onChange={e => onChange({...data,[f.key]:e.target.value})}
              style={inp} />
          </div>
        ))}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"140px 1fr 1fr", gap:"10px", alignItems:"end" }}>
        <div>
          <label style={hs.formLabel}>% Artista</label>
          <input type="number" min="0" max="100" step="5"
            value={data.royalty_percent}
            onChange={e => onChange({...data,royalty_percent:+e.target.value})}
            style={inp} />
          <p style={{ fontSize:"11px", color:css.textMute, marginTop:"3px", fontFamily:"system-ui" }}>
            Sello: {100-data.royalty_percent}%
          </p>
        </div>
        <div>
          <label style={hs.formLabel}>Método de pago</label>
          <select value={data.payment_method}
            onChange={e => onChange({...data,payment_method:e.target.value})}
            style={{...inp, appearance:"none" as any}}>
            <option value="paypal">PayPal</option>
            <option value="bank">Transferencia</option>
            <option value="both">Ambos</option>
          </select>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"8px", paddingBottom:"2px" }}>
          <input type="checkbox" checked={data.is_own_artist}
            onChange={e => onChange({...data,is_own_artist:e.target.checked})}
            style={{ accentColor:css.text, width:"14px", height:"14px" }} />
          <label style={{ fontSize:"13px", color:css.text, fontFamily:"system-ui", cursor:"pointer" }}>
            Artista propio
          </label>
        </div>
      </div>
      {!data.is_own_artist && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
          {(data.payment_method==="paypal"||data.payment_method==="both") && (
            <div>
              <label style={hs.formLabel}>Email PayPal</label>
              <input type="email" placeholder="paypal@email.com" value={data.paypal_email}
                onChange={e => onChange({...data,paypal_email:e.target.value})} style={inp} />
            </div>
          )}
          {(data.payment_method==="bank"||data.payment_method==="both") && (
            <div>
              <label style={hs.formLabel}>IBAN</label>
              <input type="text" placeholder="ES00 0000 0000..." value={data.bank_iban}
                onChange={e => onChange({...data,bank_iban:e.target.value})} style={inp} />
            </div>
          )}
        </div>
      )}
      <div>
        <label style={hs.formLabel}>Notas internas</label>
        <textarea placeholder="Acuerdos, observaciones..." value={data.notes}
          onChange={e => onChange({...data,notes:e.target.value})}
          style={{...inp, minHeight:"60px", resize:"vertical" as any}} />
      </div>
    </div>
  );

  const selectedAccount = accounts.find(a => a.artist_name===selectedArtist);
  const selectedData    = selectedArtist ? getArtistData(selectedArtist) : null;
  const externalAccounts = accounts.filter(a => !a.is_own_artist);
  const ownAccounts      = accounts.filter(a => a.is_own_artist);
  const readyAccounts    = externalAccounts.filter(a => getArtistData(a.artist_name).canPay);
  const accumulatingAccounts = externalAccounts.filter(a => !getArtistData(a.artist_name).canPay);

  return (
    <div style={{ maxWidth:"1200px" }}>

      {/* Tabs */}
      <div style={{ display:"flex", marginBottom:"24px", borderBottom:`1px solid ${css.border}` }}>
        {([
          { id:"payments", label:"Pagos y regalías" },
          { id:"accounts", label:"Cuentas"           },
          { id:"csv",      label:"Subir CSV"         },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:"8px 16px", border:"none", background:"transparent",
              fontSize:"13px", fontWeight:tab===t.id?600:400, cursor:"pointer",
              color:tab===t.id?css.text:css.textSub,
              borderBottom:tab===t.id?`2px solid ${css.text}`:"2px solid transparent",
              marginBottom:"-1px", fontFamily:"system-ui", transition:"all .15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── PAGOS ─── */}
      {tab === "payments" && (
        <div style={{ display:"grid",
          gridTemplateColumns:selectedArtist?"1fr 380px":"1fr", gap:"24px" }}>
          <div>

            {/* Calendario */}
            <PaymentCalendar />

            {/* KPIs */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)",
              gap:"12px", marginBottom:"24px" }}>
              {[
                { label:"A pagar ahora",            value:fmt2(globalSummary.totalPending),
                  highlight:globalSummary.readyCount>0 },
                { label:"Listos para cobrar",        value:String(globalSummary.readyCount)+" artistas", highlight:globalSummary.readyCount>0 },
                { label:"Ingresos propios (tuyo)",   value:fmt2(globalSummary.totalOwn),    highlight:false },
                { label:"Total ya pagado a artistas",value:fmt2(globalSummary.totalPaid),   highlight:false },
              ].map((k,i) => (
                <div key={i} style={{ padding:"16px 20px", borderRadius:"8px",
                  background:k.highlight?css.greenBg:css.white,
                  border:`1px solid ${k.highlight?css.greenBorder:css.border}` }}>
                  <p style={{ fontSize:"11px", color:css.textMute,
                    marginBottom:"6px", fontFamily:"system-ui" }}>{k.label}</p>
                  <p style={{ fontSize:"20px", fontWeight:700,
                    color:k.highlight?css.green:css.text, fontFamily:"system-ui" }}>
                    {k.value}
                  </p>
                </div>
              ))}
            </div>

            {/* ─── Listos para pagar ─── */}
            <ArtistGroup
              title="✓ Listos para pagar"
              badge={`≥ $${THRESHOLD}`}
              badgeStyle={hs.badgeGreen}
              accounts={readyAccounts}
              getArtistData={getArtistData}
              selectedArtist={selectedArtist}
              setSelectedArtist={setSelectedArtist}
              markAllPaid={markAllPaid}
              payingId={payingId}
              showPayBtn={true}
              defaultOpen={true}
              borderColor={css.green}
            />

            {/* ─── Acumulando ─── */}
            <ArtistGroup
              title="Acumulando"
              badge={`< $${THRESHOLD}`}
              badgeStyle={hs.badgeYellow}
              accounts={accumulatingAccounts}
              getArtistData={getArtistData}
              selectedArtist={selectedArtist}
              setSelectedArtist={setSelectedArtist}
              markAllPaid={markAllPaid}
              payingId={payingId}
              showPayBtn={false}
              defaultOpen={false}
              borderColor={css.yellow}
            />

            {/* ─── Artistas propios ─── */}
            {ownAccounts.length > 0 && (
              <ArtistGroup
                title="Artistas propios"
                badge="Todo tuyo"
                badgeStyle={hs.badgePurple}
                accounts={ownAccounts}
                getArtistData={getArtistData}
                selectedArtist={selectedArtist}
                setSelectedArtist={setSelectedArtist}
                markAllPaid={markAllPaid}
                payingId={payingId}
                showPayBtn={false}
                defaultOpen={false}
                borderColor={css.purple}
              />
            )}

            {accounts.length===0 && (
              <div style={{ padding:"40px", textAlign:"center",
                background:css.white, border:`1px solid ${css.border}`, borderRadius:"8px" }}>
                <p style={{ fontSize:"13px", color:css.textMute, fontFamily:"system-ui" }}>
                  No hay artistas. Añade desde Cuentas o importa desde CSV.
                </p>
              </div>
            )}
          </div>

          {/* ─── Panel lateral ─── */}
          {selectedArtist && selectedAccount && selectedData && (
            <div style={{ position:"sticky", top:"80px", alignSelf:"start" }}>
              <div style={hs.section}>
                <div style={hs.sectionHeader}>
                  <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                    <div style={{ width:"32px", height:"32px", borderRadius:"50%",
                      background:selectedAccount.is_own_artist?css.purpleBg:css.accentBg,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:"14px", fontWeight:700,
                      color:selectedAccount.is_own_artist?css.purple:css.text }}>
                      {selectedArtist[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={hs.cardTitle}>{selectedArtist}</p>
                      <p style={{ fontSize:"11px", color:css.textMute,
                        fontFamily:"system-ui" }}>{selectedAccount.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedArtist(null)}
                    style={{ ...hs.btnSmall, padding:"4px 8px" }}>✕</button>
                </div>

                {/* Resumen financiero */}
                <div style={{ padding:"16px 20px", borderBottom:`1px solid ${css.border}` }}>
                  <div style={{ marginBottom:"14px", padding:"12px",
                    background:css.bg, borderRadius:"6px" }}>
                    <p style={{ fontSize:"11px", fontWeight:600, color:css.textMute,
                      marginBottom:"10px", fontFamily:"system-ui",
                      textTransform:"uppercase" as any, letterSpacing:"0.05em" }}>
                      Resumen financiero
                    </p>
                    <div style={{ display:"flex", flexDirection:"column", gap:"6px" }}>
                      {[
                        { label:"Total bruto",
                          value:fmt2(selectedData.grossTotal), color:css.text },
                        { label:`Su parte (${selectedAccount.royalty_percent??60}%)`,
                          value:selectedAccount.is_own_artist?"Tuyo":fmt2(selectedData.totalAll),
                          color:selectedAccount.is_own_artist?css.purple:css.text },
                        { label:"Lo que te queda",
                          value:selectedAccount.is_own_artist
                            ?fmt2(selectedData.grossTotal)
                            :fmt2(selectedData.grossTotal - selectedData.totalAll),
                          color:css.green, bold:true },
                      ].map((k,i) => (
                        <div key={i} style={{ display:"flex", justifyContent:"space-between",
                          alignItems:"center", paddingBottom:i<2?"6px":"0",
                          borderBottom:i<2?`1px solid ${css.border}`:"none" }}>
                          <span style={{ fontSize:"12px", color:css.textMute,
                            fontFamily:"system-ui" }}>{k.label}</span>
                          <span style={{ fontSize:"13px",
                            fontWeight:(k as any).bold?700:500,
                            color:k.color, fontFamily:"system-ui" }}>{k.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!selectedAccount.is_own_artist && (
                    <>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
                        gap:"8px", marginBottom:"12px" }}>
                        {[
                          { label:"Pendiente", value:fmt2(selectedData.pending),
                            color:selectedData.canPay?css.green:css.text },
                          { label:"Ya pagado", value:fmt2(selectedData.totalPaid), color:css.textSub },
                        ].map((k,i) => (
                          <div key={i} style={{ padding:"10px 12px",
                            background:css.bg, borderRadius:"6px" }}>
                            <p style={{ fontSize:"11px", color:css.textMute,
                              marginBottom:"3px", fontFamily:"system-ui" }}>{k.label}</p>
                            <p style={{ fontSize:"17px", fontWeight:700,
                              color:k.color, fontFamily:"system-ui" }}>{k.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Barra progreso */}
                      <div style={{ marginBottom:"12px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                          <span style={{ fontSize:"11px", color:css.textMute, fontFamily:"system-ui" }}>
                            Mínimo ${THRESHOLD}
                          </span>
                          <span style={{ fontSize:"11px", fontWeight:600, fontFamily:"system-ui",
                            color:selectedData.canPay?css.green:css.text }}>
                            {Math.min(Math.round((selectedData.pending/THRESHOLD)*100),100)}%
                          </span>
                        </div>
                        <div style={{ height:"6px", background:css.border, borderRadius:"3px" }}>
                          <div style={{ height:"100%", borderRadius:"3px",
                            background:selectedData.canPay?css.green:css.yellow,
                            width:`${Math.min((selectedData.pending/THRESHOLD)*100,100)}%`,
                            transition:"width .4s" }} />
                        </div>
                      </div>

                      {/* Método pago */}
                      <div style={{ padding:"8px 12px", background:css.bg,
                        borderRadius:"6px", marginBottom:"12px" }}>
                        <p style={{ fontSize:"11px", color:css.textMute,
                          marginBottom:"2px", fontFamily:"system-ui" }}>Método de pago</p>
                        <p style={{ fontSize:"12px", fontWeight:500,
                          color:css.text, fontFamily:"system-ui" }}>
                          {selectedAccount.payment_method==="paypal"
                            ?`PayPal: ${selectedAccount.paypal_email||"—"}`
                            :selectedAccount.payment_method==="bank"
                            ?`IBAN: ${selectedAccount.bank_iban||"—"}`
                            :`PayPal: ${selectedAccount.paypal_email||"—"} · IBAN: ${selectedAccount.bank_iban||"—"}`}
                        </p>
                      </div>

                      {selectedData.unpaid.length>0 && (
                        <button onClick={() => markAllPaid(selectedAccount)}
                          disabled={payingId===selectedArtist}
                          style={{ ...hs.btnGreen, width:"100%", padding:"9px",
                            textAlign:"center" as any,
                            opacity:payingId===selectedArtist?0.7:1, marginBottom:"8px" }}>
                          {payingId===selectedArtist
                            ?"Procesando..."
                            :`Pagar todo (${fmt2(selectedData.pending)})`}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Enviar acceso al portal */}
                {!selectedAccount.is_own_artist && (
                  <div style={{ padding:"16px 20px", borderBottom:`1px solid ${css.border}` }}>
                    <p style={{ fontSize:"11px", fontWeight:600, color:css.textMute,
                      fontFamily:"system-ui", textTransform:"uppercase" as any,
                      letterSpacing:"0.05em", marginBottom:"10px" }}>
                      📧 Enviar acceso al portal
                    </p>
                    <p style={{ fontSize:"12px", color:css.textMute, fontFamily:"system-ui",
                      marginBottom:"10px", lineHeight:1.5 }}>
                      Email: <strong style={{ color:css.text }}>{selectedAccount.email}</strong>
                    </p>
                    <div style={{ display:"flex", gap:"8px", marginBottom:"8px" }}>
                      <input
                        type="text"
                        placeholder="Contraseña temporal..."
                        value={tempPasswords[selectedAccount.id] || ""}
                        onChange={e => setTempPasswords(p => ({...p, [selectedAccount.id]:e.target.value}))}
                        style={{ ...hs.input, flex:1 }}
                      />
                      <button
                        onClick={() => sendCredentials(selectedAccount)}
                        disabled={sendingCredentials===selectedAccount.id || !tempPasswords[selectedAccount.id]?.trim()}
                        style={{ ...hs.btnGreen, whiteSpace:"nowrap" as any, padding:"7px 14px",
                          opacity:(sendingCredentials===selectedAccount.id||!tempPasswords[selectedAccount.id]?.trim())?0.5:1 }}>
                        {sendingCredentials===selectedAccount.id
                          ? "Enviando..."
                          : credentialsSent.has(selectedAccount.id)
                          ? "✓ Enviado"
                          : "Enviar acceso"}
                      </button>
                    </div>
                    <p style={{ fontSize:"11px", color:css.textMute, fontFamily:"system-ui" }}>
                      El artista recibirá un email con sus credenciales y un enlace al portal.
                    </p>
                  </div>
                )}

                {/* Historial */}
                <div>
                  <p style={{ fontSize:"11px", fontWeight:600, color:css.textMute,
                    padding:"12px 20px", borderBottom:`1px solid ${css.border}`,
                    fontFamily:"system-ui", textTransform:"uppercase" as any,
                    letterSpacing:"0.05em" }}>
                    Historial mes a mes
                  </p>
                  <div style={{ maxHeight:"380px", overflowY:"auto" }}>
                    {selectedData.all.length===0 ? (
                      <p style={{ padding:"20px", fontSize:"13px",
                        color:css.textMute, fontFamily:"system-ui" }}>
                        Sin datos. Sube un CSV primero.
                      </p>
                    ) : (
                      selectedData.all.map((r,i) => (
                        <div key={r.id} style={{
                          borderBottom:i<selectedData.all.length-1?`1px solid ${css.border}`:"none" }}>
                          <div style={{ display:"flex", alignItems:"flex-start",
                            justifyContent:"space-between", padding:"12px 20px" }}>
                            <div style={{ flex:1 }}>
                              <p style={{ fontSize:"13px", fontWeight:500, color:css.text,
                                fontFamily:"system-ui", textTransform:"capitalize" as any,
                                marginBottom:"2px" }}>
                                {fmtMonthFull(r.month.slice(0,7))}
                              </p>
                              <p style={{ fontSize:"11px", color:css.textMute, fontFamily:"system-ui" }}>
                                {r.total_streams.toLocaleString()} streams · bruto {fmt4(r.gross_revenue)}
                              </p>
                            </div>
                            <div style={{ textAlign:"right" as any, flexShrink:0,
                              display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"4px" }}>
                              <p style={{ fontSize:"13px", fontWeight:700,
                                color:r.paid?css.textSub:css.text, fontFamily:"system-ui" }}>
                                {fmt4(r.artist_share)}
                              </p>
                              {selectedAccount.is_own_artist ? (
                                <span style={hs.badgePurple}>Tuyo</span>
                              ) : r.paid ? (
                                <span style={hs.badgeGreen}>✓ Pagado</span>
                              ) : (
                                <div style={{ display:"flex", gap:"4px", alignItems:"center" }}>
                                  <span style={hs.badgeYellow}>Pendiente</span>
                                  <button
                                    onClick={() => markSinglePaid(r.id, r.artist_share, r.month)}
                                    style={{ ...hs.btnSmall, fontSize:"11px", padding:"2px 8px",
                                      color:css.green, borderColor:css.greenBorder,
                                      background:css.greenBg }}>
                                    Pagar
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {r.paid && !selectedAccount.is_own_artist && (
                            <div style={{ padding:"8px 20px 12px", background:css.greenBg }}>
                              {r.payment_proof_url ? (
                                <div style={{ display:"flex", alignItems:"center",
                                  justifyContent:"space-between" }}>
                                  <a href={r.payment_proof_url} target="_blank" rel="noreferrer"
                                    style={{ display:"flex", alignItems:"center", gap:"6px",
                                      fontSize:"12px", fontWeight:500, color:css.green,
                                      fontFamily:"system-ui", textDecoration:"none" }}>
                                    📎 Ver comprobante
                                  </a>
                                  <label style={{ fontSize:"11px", color:css.textMute,
                                    cursor:"pointer", fontFamily:"system-ui" }}>
                                    Cambiar
                                    <input type="file" accept="image/*,.pdf" style={{ display:"none" }}
                                      onChange={e => { const f=e.target.files?.[0]; if(f) uploadProof(r.id,f); }} />
                                  </label>
                                </div>
                              ) : (
                                <label style={{ display:"flex", alignItems:"center", gap:"6px",
                                  cursor:"pointer", fontSize:"12px", color:css.green,
                                  fontFamily:"system-ui" }}>
                                  {uploadingProof===r.id?"Subiendo...":(
                                    <><span>📎</span>
                                    <span style={{ fontWeight:500 }}>Adjuntar comprobante</span></>
                                  )}
                                  <input type="file" accept="image/*,.pdf" style={{ display:"none" }}
                                    disabled={uploadingProof===r.id}
                                    onChange={e => { const f=e.target.files?.[0]; if(f) uploadProof(r.id,f); }} />
                                </label>
                              )}
                              {r.paid_at && (
                                <p style={{ fontSize:"10px", color:css.green,
                                  marginTop:"4px", fontFamily:"system-ui" }}>
                                  Pagado el {new Date(r.paid_at).toLocaleDateString("es",{
                                    day:"numeric", month:"long", year:"numeric"
                                  })}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── CUENTAS ─── */}
      {tab === "accounts" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:"16px" }}>
            <p style={{ fontSize:"13px", color:css.textMute, fontFamily:"system-ui" }}>
              {accounts.length} artista{accounts.length!==1?"s":""}
              ({externalAccounts.length} externos · {ownAccounts.length} propios)
            </p>
            <button onClick={() => setShowAddForm(!showAddForm)} style={hs.btnGreen}>
              {showAddForm?"Cancelar":"+ Añadir artista"}
            </button>
          </div>

          {showAddForm && (
            <div style={{ ...hs.section, marginBottom:"20px" }}>
              <div style={hs.sectionHeader}>
                <p style={hs.cardTitle}>Nuevo artista</p>
              </div>
              <div style={{ padding:"20px" }}>
                <ArtistForm data={addForm} onChange={setAddForm} />
                <div style={{ marginTop:"16px" }}>
                  <button onClick={addAccount} disabled={loading}
                    style={{ ...hs.btnGreen, opacity:loading?0.7:1 }}>
                    {loading?"Creando...":"Crear cuenta"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={hs.section}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:css.bg }}>
                  {["Artista","Email","% Art","Pago","Estado",""].map((h,i) => (
                    <th key={i} style={{ padding:"10px 16px", textAlign:"left",
                      fontSize:"11px", fontWeight:500, color:css.textMute,
                      fontFamily:"system-ui", borderBottom:`1px solid ${css.border}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {accounts.map((a,i) => (
                  <>
                    <tr key={a.id} style={{ borderBottom:`1px solid ${css.border}`,
                      background:i%2===0?css.white:css.bg }}>
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                          <div style={{ width:"28px", height:"28px", borderRadius:"50%",
                            background:a.is_own_artist?css.purpleBg:css.accentBg,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:"11px", fontWeight:700,
                            color:a.is_own_artist?css.purple:css.text, flexShrink:0 }}>
                            {a.artist_name[0].toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize:"13px", fontWeight:500,
                              color:css.text, fontFamily:"system-ui" }}>{a.artist_name}</p>
                            <p style={{ fontSize:"11px", color:css.textMute,
                              fontFamily:"system-ui" }}>{a.name}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:"12px 16px", fontSize:"13px",
                        color:css.textSub, fontFamily:"system-ui" }}>{a.email}</td>
                      <td style={{ padding:"12px 16px", fontSize:"13px",
                        fontWeight:600, color:css.text, fontFamily:"system-ui" }}>
                        {a.royalty_percent??60}%
                      </td>
                      <td style={{ padding:"12px 16px", fontSize:"12px",
                        color:css.textSub, fontFamily:"system-ui" }}>
                        {a.is_own_artist?"—":
                          a.payment_method==="paypal"?`PayPal: ${a.paypal_email||"—"}`:
                          a.payment_method==="bank"?`IBAN: ${a.bank_iban||"—"}`:
                          "PayPal + IBAN"}
                      </td>
                      <td style={{ padding:"12px 16px" }}>
                        {a.is_own_artist?<span style={hs.badgePurple}>Propio</span>
                        :a.active?<span style={hs.badgeGreen}>Activo</span>
                        :<span style={hs.badgeGray}>Inactivo</span>}
                      </td>
                      <td style={{ padding:"12px 16px" }}>
                        <div style={{ display:"flex", gap:"6px" }}>
                          <button
                            onClick={() => {
                              if(editingId===a.id){setEditingId(null);return;}
                              setEditingId(a.id);
                              setEditForm({
                                name:a.name, artist_name:a.artist_name,
                                email:a.email, password:"",
                                royalty_percent:a.royalty_percent??60,
                                is_own_artist:a.is_own_artist??false,
                                paypal_email:a.paypal_email??"",
                                bank_iban:a.bank_iban??"",
                                payment_method:a.payment_method??"paypal",
                                notes:a.notes??"",
                              });
                            }}
                            style={hs.btnSmall}>
                            {editingId===a.id?"Cancelar":"Editar"}
                          </button>
                          <button
                            onClick={() => deleteAccount(a.id, a.artist_name)}
                            style={hs.btnDanger}>
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editingId===a.id && (
                      <tr key={`edit-${a.id}`}>
                        <td colSpan={6} style={{ padding:"20px 24px",
                          background:css.blueBg, borderBottom:`1px solid ${css.border}` }}>
                          <ArtistForm data={editForm} onChange={setEditForm} />
                          <div style={{ display:"flex", gap:"8px", marginTop:"16px" }}>
                            <button onClick={() => saveEdit(a.id)} disabled={loading}
                              style={{ ...hs.btnGreen, opacity:loading?0.7:1 }}>
                              {loading?"Guardando...":"Guardar cambios"}
                            </button>
                            <button onClick={() => setEditingId(null)} style={hs.btnSmall}>
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
            {accounts.length===0 && (
              <div style={{ padding:"40px", textAlign:"center" }}>
                <p style={{ fontSize:"13px", color:css.textMute, fontFamily:"system-ui" }}>
                  Sin artistas. Usa el botón de arriba o importa desde CSV.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── CSV ─── */}
      {tab === "csv" && (
        <div style={{ maxWidth:"600px" }}>

          {/* Importar */}
          <div style={{ marginBottom:"24px", padding:"16px 20px",
            background:css.blueBg, border:`1px solid ${css.blueBorder}`,
            borderRadius:"8px" }}>
            <p style={{ fontSize:"13px", fontWeight:600, color:css.blue,
              marginBottom:"4px", fontFamily:"system-ui" }}>
              📥 Importar artistas automáticamente
            </p>
            <p style={{ fontSize:"12px", color:css.textSub, marginBottom:"12px",
              fontFamily:"system-ui", lineHeight:1.6 }}>
              Sube cualquier CSV y el sistema creará una cuenta para cada artista nuevo,
              marcándolos como <strong>propios por defecto</strong>.
              Edita los externos desde Cuentas.
            </p>
            <label style={{ display:"inline-flex", alignItems:"center", gap:"6px",
              padding:"7px 14px", borderRadius:"6px", cursor:"pointer",
              background:css.blue, color:"#fff",
              fontSize:"13px", fontWeight:500, fontFamily:"system-ui" }}>
              Subir CSV para importar
              <input type="file" accept=".csv" style={{ display:"none" }}
                onChange={e => { const f=e.target.files?.[0]; if(f) importArtistsFromCSV(f); }} />
            </label>
          </div>

          {/* Subir CSV */}
          <div style={hs.section}>
            <div style={hs.sectionHeader}>
              <p style={hs.cardTitle}>Subir CSV de Label Engine</p>
            </div>
            <div style={{ padding:"20px" }}>
              <p style={{ fontSize:"13px", color:css.textSub, marginBottom:"20px",
                lineHeight:1.6, fontFamily:"system-ui" }}>
                Asigna las regalías a cada artista según su <strong>% individual</strong>.
              </p>

              <div style={{ marginBottom:"20px" }}>
                <label style={hs.formLabel}>Mes del CSV</label>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"6px" }}>
                  {Array.from({length:12},(_,i) => {
                    const date     = new Date(currentYear,i,1);
                    const monthKey = `${currentYear}-${String(i+1).padStart(2,"0")}-01`;
                    const hasData  = royalties.some(r=>r.month===monthKey);
                    const isSel    = csvMonth===monthKey;
                    return (
                      <button key={monthKey} onClick={()=>setCsvMonth(isSel?"":monthKey)}
                        style={{ padding:"8px", borderRadius:"6px", fontSize:"12px",
                          fontWeight:500, cursor:"pointer", fontFamily:"system-ui",
                          background:isSel?css.text:hasData?css.greenBg:css.bg,
                          border:`1px solid ${isSel?css.text:hasData?css.greenBorder:css.border}`,
                          color:isSel?"#fff":hasData?css.green:css.textSub, transition:"all .15s" }}>
                        {date.toLocaleString("es",{month:"short"}).toUpperCase()}
                        {hasData&&!isSel&&<span style={{ display:"block", fontSize:"9px" }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
                {csvMonth && (
                  <p style={{ fontSize:"12px", color:css.green, marginTop:"8px",
                    fontFamily:"system-ui", fontWeight:500 }}>
                    ✓ {fmtMonthFull(csvMonth.slice(0,7))}
                  </p>
                )}
              </div>

              <label style={{ display:"flex", flexDirection:"column", alignItems:"center",
                padding:"32px", border:`2px dashed ${csvMonth?css.text:css.border}`,
                borderRadius:"8px", cursor:csvMonth?"pointer":"not-allowed",
                background:css.bg, transition:"all .2s" }}>
                <span style={{ fontSize:"28px", marginBottom:"8px" }}>📄</span>
                <p style={{ fontSize:"14px", fontWeight:600, color:css.text,
                  marginBottom:"4px", fontFamily:"system-ui" }}>
                  {csvMonth?"Subir CSV":"Selecciona un mes primero"}
                </p>
                <p style={{ fontSize:"12px", color:css.textMute, fontFamily:"system-ui" }}>
                  Columnas: Artist · Quantity · Recipient Net Royalty
                </p>
                <input type="file" accept=".csv" style={{display:"none"}}
                  disabled={!csvMonth}
                  onChange={e=>{const f=e.target.files?.[0];if(f)processCSV(f);}} />
              </label>

              {csvStatus && (
                <div style={{ marginTop:"12px", padding:"10px 14px", borderRadius:"6px",
                  background:csvStatus.startsWith("✓")?css.greenBg:css.redBg,
                  border:`1px solid ${csvStatus.startsWith("✓")?css.greenBorder:css.redBorder}` }}>
                  <p style={{ fontSize:"13px", fontWeight:500, fontFamily:"system-ui",
                    color:csvStatus.startsWith("✓")?css.green:css.red }}>{csvStatus}</p>
                </div>
              )}

              <div style={{ marginTop:"24px" }}>
                <p style={{ fontSize:"11px", fontWeight:600, color:css.textMute,
                  fontFamily:"system-ui", textTransform:"uppercase" as any,
                  letterSpacing:"0.05em", marginBottom:"8px" }}>
                  Artistas registrados ({accounts.length})
                </p>
                <div style={{ border:`1px solid ${css.border}`, borderRadius:"6px", overflow:"hidden" }}>
                  {accounts.map((a,i) => (
                    <div key={a.id} style={{ display:"flex", justifyContent:"space-between",
                      alignItems:"center", padding:"8px 14px",
                      borderBottom:i<accounts.length-1?`1px solid ${css.border}`:"none",
                      background:i%2===0?css.white:css.bg }}>
                      <span style={{ fontSize:"13px", color:css.text, fontFamily:"system-ui" }}>
                        {a.artist_name}
                      </span>
                      <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                        <span style={{ fontSize:"12px", fontWeight:600,
                          color:css.text, fontFamily:"system-ui" }}>
                          {a.royalty_percent??60}%
                        </span>
                        {a.is_own_artist
                          ?<span style={hs.badgePurple}>Propio</span>
                          :<span style={hs.badgeGreen}>Externo</span>}
                      </div>
                    </div>
                  ))}
                  {accounts.length===0 && (
                    <p style={{ padding:"16px", fontSize:"13px",
                      color:css.textMute, fontFamily:"system-ui" }}>
                      Sin artistas — importa desde el botón de arriba
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}