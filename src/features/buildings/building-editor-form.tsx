"use client";
import { sessionFetch } from "@/lib/session-fetch";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buildingEditorSchema, buildingFeeDefinitions, installationKeys } from "@/lib/building-editor";
import { copy } from "@/lib/copy";
import { BuildingLocationPicker, type BuildingLocationCandidate } from "./map/location-picker";
import "./building-editor.css";

const c = copy.buildingEditor;
type OtherFee = { key: string; label: string; calculationType: "fixed" | "revenue_share"; value: string; revenuePeriod: "monthly" | "annual"; note: string };
export type BuildingEditorInitial = { code: string; nameTh: string; nameEn: string; ownerTeamId: string; version: number;
  conditions: Record<string, string>; fees: Record<string, string>; installation: Record<string, string>; otherFees: OtherFee[] };
type Field = { key: string; label: string; options?: readonly (readonly [string, string])[]; inputMode?: "decimal" | "numeric" | "email"; multiline?: boolean };
const general: Field[] = [
  { key: "status", label: c.status, options: [["Permission Confirmed", "ยืนยันการอนุญาตแล้ว"], ["MOU", "บันทึกข้อตกลง"], ["Check Permission", "ตรวจสอบการอนุญาต"], ["อาคารปิดถาวร", "อาคารปิดถาวร"]] },
  { key: "group", label: c.group, options: [["Priority 1", "ลำดับสำคัญ 1"], ["Priority 2", "ลำดับสำคัญ 2"], ["X", "กลุ่มทั่วไป"]] },
  { key: "type", label: c.type, options: [["L1", "ระดับ 1"], ["L2", "ระดับ 2"], ["L3", "ระดับ 3"]] },
  { key: "install_type", label: c.installType, options: [["Building", "อาคาร"], ["Shopping Mall", "ศูนย์การค้า"], ["Nikom", "นิคมอุตสาหกรรม"], ["Data center", "ศูนย์ข้อมูล"], ["Airport", "สนามบิน"], ["Port", "ท่าเรือ"], ["Market", "ตลาด"]] },
  { key: "area", label: c.area }, { key: "province", label: c.province },
];
const installation: Field[] = [
  { key: "survey_type", label: c.surveyType, options: [["Auto", "ดำเนินการได้เลย"], ["Need Survey", "ต้องสำรวจ"], ["Need Mark", "ต้องกำหนดจุด"], ["Wait Check", "รอตรวจสอบ"]] },
  { key: "duration", label: c.duration, inputMode: "numeric" }, { key: "location", label: c.location },
  { key: "wm_point", label: c.wmPoint }, { key: "enclosure", label: c.enclosure, options: [["No", c.no], ["Yes", c.yes]] },
  { key: "max_horizontal", label: c.maxHorizontal, inputMode: "decimal" }, { key: "lat", label: c.lat, inputMode: "decimal" }, { key: "lng", label: c.lng, inputMode: "decimal" },
];
const contacts: Field[] = [ { key: "address", label: c.address }, { key: "contact", label: c.contactName }, { key: "phone", label: c.phone }, { key: "mobile", label: c.mobile }, { key: "email", label: c.email, inputMode: "email" }, { key: "remark", label: c.remark, multiline: true } ];
const allFields = [...general, ...installation, ...contacts];
const calculationLabels = [c.metersPerFloor, c.cableRate, c.equipmentCost, c.odfCost, c.spliceCost];

export function BuildingEditorForm({ id, initial, apiKey, teams, canCreateWithoutTeam }: { id?: string; initial?: BuildingEditorInitial;
  apiKey: string; teams: { id: string; name: string }[]; canCreateWithoutTeam: boolean }) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const [identity, setIdentity] = useState({ code: initial?.code ?? "", nameTh: initial?.nameTh ?? "", nameEn: initial?.nameEn ?? "", ownerTeamId: initial?.ownerTeamId ?? teams[0]?.id ?? "" });
  const [values, setValues] = useState<Record<string, string>>(initial?.conditions ?? { status: "Check Permission", group: "X", type: "L2", install_type: "Building", survey_type: "Need Survey", wm_point: "No", enclosure: "No" });
  const [fees, setFees] = useState<Record<string, string>>(initial?.fees ?? {});
  const [calc, setCalc] = useState<Record<string, string>>(initial?.installation ?? {});
  const [otherFees, setOtherFees] = useState<OtherFee[]>(initial?.otherFees ?? []);
  const [reason, setReason] = useState<string>(c.reasonDefault);
  const [candidate, setCandidate] = useState<BuildingLocationCandidate | null>(null);
  const [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(""), [conflict, setConflict] = useState(false);
  const [invalid, setInvalid] = useState<string[]>([]);
  const cancel = id ? `/buildings/${id}` : "/buildings";
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty && !busy) { event.preventDefault(); } }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty, busy]);
  function changeField(key: string, value: string) { setDirty(true); setValues(old => ({ ...old, [key]: value })); if (["lat", "lng", "address", "province"].includes(key)) setCandidate(null); }
  function field(field: Field) {
    const value = values[field.key] ?? "";
    const props = { name: field.key, value, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => changeField(field.key, event.target.value), "aria-invalid": invalid.includes(field.key), "aria-describedby": invalid.includes(field.key) ? "building-editor-error" : undefined };
    return <label key={field.key}>{field.label}{field.options ? <select {...props}><option value="">{c.blank}</option>{value && !field.options.some(([key]) => key === value) && <option value={value}>{value} · {c.legacyOption}</option>}{field.options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select> : field.multiline ? <textarea {...props} rows={4}/> : <input {...props} inputMode={field.inputMode} maxLength={field.key === "address" ? 1000 : 240}/>}</label>;
  }
  function updateOther(index: number, update: Partial<OtherFee>) { setDirty(true); setOtherFees(old => old.map((fee, position) => position === index ? { ...fee, ...update } : fee)); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const raw = { ...identity, ownerTeamId: identity.ownerTeamId || null, conditions: Object.fromEntries(allFields.map(field => [field.key, values[field.key] ?? ""])),
      fees: Object.fromEntries(buildingFeeDefinitions.map(fee => [fee.key, fees[fee.key] ?? ""])), installation: Object.fromEntries(installationKeys.map(key => [key, calc[key] ?? ""])), otherFees,
      ...(id ? { version: initial?.version, reason } : {}) };
    const parsed = buildingEditorSchema.safeParse(raw);
    if (!parsed.success) {
      const names = parsed.error.issues.map(issue => String(issue.path.at(-1)));
      setInvalid(names); setError(c.validation);
      const first = names[0]; const control = form.current?.elements.namedItem(first);
      if (control instanceof HTMLElement) control.focus();
      return;
    }
    setInvalid([]); setError(""); setBusy(true); setConflict(false);
    try {
      const response = await sessionFetch(id ? `/api/buildings/${id}` : "/api/buildings", { method: id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...raw, ...(candidate ? { location: { ...candidate, verified: true } } : {}) }) });
      const result = await response.json() as { id?: string; error?: string };
      if (!response.ok || !result.id) { setConflict(result.error === "building_changed"); setError(response.status === 403 ? c.forbidden : result.error === "building_duplicate" ? c.duplicate : result.error === "building_changed" ? c.conflict : response.status === 400 ? c.validation : c.unavailable); return; }
      setDirty(false); router.push(`/buildings/${result.id}?saved=1`); router.refresh();
    } catch { setError(c.unavailable); } finally { setBusy(false); }
  }
  return <form ref={form} className="building-editor-form" onSubmit={submit} noValidate aria-busy={busy}>
    {error && <div id="building-editor-error" className="building-editor-error" role="alert">{error}{conflict && <button type="button" onClick={() => { if (!dirty || window.confirm(c.leave)) window.location.reload(); }}>{c.reload}</button>}</div>}
    <fieldset className="building-editor-section"><legend>{c.general}</legend><div className="building-editor-grid">
      {([ ["code", c.code], ["nameTh", c.nameTh], ["nameEn", c.nameEn] ] as const).map(([key, label]) => <label key={key}>{label}<input name={key} value={identity[key]} required={key === "nameTh"} maxLength={key === "code" ? 40 : 240} onChange={event => { setDirty(true); setIdentity(old => ({ ...old, [key]: event.target.value })); }} aria-invalid={invalid.includes(key)} aria-describedby={invalid.includes(key) ? "building-editor-error" : key === "code" ? "building-code-hint" : undefined}/>{key === "code" && <small id="building-code-hint">{c.codeHint}</small>}</label>)}
      <label>{c.team}<select name="ownerTeamId" value={identity.ownerTeamId} disabled={Boolean(id)} onChange={event => { setDirty(true); setIdentity(old => ({ ...old, ownerTeamId: event.target.value })); }}><option value="" disabled={!canCreateWithoutTeam && !id}>{c.noTeam}</option>{identity.ownerTeamId && !teams.some(team => team.id === identity.ownerTeamId) && <option value={identity.ownerTeamId}>{c.team}</option>}{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
      {general.map(field)}
    </div></fieldset>
    <fieldset className="building-editor-section"><legend>{c.installation}</legend><div className="building-editor-grid">{installation.map(field)}</div><p>{c.locationHint}</p></fieldset>
    <BuildingLocationPicker apiKey={apiKey} initial={null} canUpdate onConfirmCandidate={point => { setDirty(true); setCandidate(point); setValues(old => ({ ...old, lat: String(point.latitude), lng: String(point.longitude), ...(point.address ? { address: point.address } : {}), ...(point.province ? { province: point.province } : {}) })); }}/>
    <fieldset className="building-editor-section"><legend>{c.fees}</legend><div className="building-editor-grid">{buildingFeeDefinitions.map(fee => <label key={fee.key}>{fee.label}<input name={fee.key} inputMode="decimal" value={fees[fee.key] ?? ""} onChange={event => { setDirty(true); setFees(old => ({ ...old, [fee.key]: event.target.value })); }} aria-invalid={invalid.includes(fee.key)}/><small>{c.amountHint}</small></label>)}</div></fieldset>
    <fieldset className="building-editor-section"><legend>{c.calculation}</legend><p>{c.calculationHint}</p><div className="building-editor-grid">{installationKeys.map((key, index) => <label key={key}>{calculationLabels[index]}<input name={key} inputMode="decimal" value={calc[key] ?? ""} onChange={event => { setDirty(true); setCalc(old => ({ ...old, [key]: event.target.value })); }} aria-invalid={invalid.includes(key)}/></label>)}</div></fieldset>
    <fieldset className="building-editor-section"><legend>{c.otherFees}</legend>{otherFees.map((fee, index) => <div className="building-editor-other" key={fee.key}>
      <label>{c.feeName}<input name={`otherFeeLabel${index}`} value={fee.label} maxLength={240} onChange={event => updateOther(index, { label: event.target.value })}/></label>
      <label>{c.feeCalculation}<select value={fee.calculationType} onChange={event => updateOther(index, { calculationType: event.target.value as OtherFee["calculationType"] })}><option value="fixed">{c.fixed}</option><option value="revenue_share">{c.revenueShare}</option></select></label>
      <label>{c.feeValue}<input name={`otherFeeValue${index}`} inputMode="decimal" value={fee.value} onChange={event => updateOther(index, { value: event.target.value })}/></label>
      {fee.calculationType === "revenue_share" && <label>{c.feePeriod}<select value={fee.revenuePeriod} onChange={event => updateOther(index, { revenuePeriod: event.target.value as OtherFee["revenuePeriod"] })}><option value="monthly">{c.monthly}</option><option value="annual">{c.annual}</option></select></label>}
      <label>{c.feeNote}<input value={fee.note} maxLength={500} onChange={event => updateOther(index, { note: event.target.value })}/></label><button type="button" aria-label={`${c.removeFee} ${index + 1}`} onClick={() => { setDirty(true); setOtherFees(old => old.filter((_, position) => position !== index)); }}>{c.removeFee}</button>
    </div>)}<button type="button" disabled={otherFees.length >= 50} onClick={() => { setDirty(true); setOtherFees(old => [...old, { key: `other_fee_${crypto.randomUUID()}`, label: "", calculationType: "fixed", value: "", revenuePeriod: "monthly", note: "" }]); }}>{c.addFee}</button></fieldset>
    <fieldset className="building-editor-section"><legend>{c.contact}</legend><div className="building-editor-grid">{contacts.map(field)}</div>{id && <label>{c.reason}<textarea name="reason" value={reason} maxLength={500} rows={2} onChange={event => { setDirty(true); setReason(event.target.value); }}/></label>}</fieldset>
    <div className="building-editor-actions"><span role="status">{busy ? c.savingHint : ""}</span><Link href={cancel} onClick={event => { if (dirty && !window.confirm(c.leave)) event.preventDefault(); }}>{c.cancel}</Link><button className="button" type="submit" disabled={busy}>{busy ? c.saving : c.save}</button></div>
  </form>;
}
