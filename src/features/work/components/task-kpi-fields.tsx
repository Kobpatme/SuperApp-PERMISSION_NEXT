"use client";
import { FormField } from "@/components/ui/form";
import { mapFieldErrors } from "@/components/ui/form";
import { useState } from "react";

type Rule = { id: string; mainKpi: string; subKpi: string };
type Values = { main: string; sub: string };

export function TaskKpiFields({ rules, values, onValuesChange, fieldErrors, controlClassName }: { rules: Rule[]; values?: Values; onValuesChange?: (values: Values) => void; fieldErrors?: Record<string, string[]>; controlClassName?: string }) {
  const [main, setMain] = useState("");
  const [sub, setSub] = useState("");
  const selectedMain = values?.main ?? main;
  const selectedSub = values?.sub ?? sub;
  const selected = rules.find(rule => rule.mainKpi === selectedMain && rule.subKpi === selectedSub);
  const hasContractorNotice = selectedSub.includes("แจ้ง Job ให้ผู้รับเหมา");
  const hasBuildingCoordination = selectedSub.includes("ประสานงานอาคาร");
  const hasSapJob = selectedSub.toLowerCase().includes("open job sap");
  const hasOwfJob = selectedSub.toLowerCase().includes("open job owf");

  return <>
    <FormField label="Main KPI" required controlId="work-main-kpi" error={mapFieldErrors(fieldErrors, "mainKpi")}><select id="work-main-kpi" name="mainKpi" required value={selectedMain} className={controlClassName} onChange={event => { setMain(event.target.value); setSub(""); onValuesChange?.({ main: event.target.value, sub: "" }); }}><option value="">เลือก Main KPI</option>{[...new Set(rules.map(rule => rule.mainKpi))].map(value => <option key={value}>{value}</option>)}</select></FormField>
    <FormField label="Sub KPI" required controlId="work-sub-kpi" error={mapFieldErrors(fieldErrors, "subKpi")}><select id="work-sub-kpi" name="subKpi" required value={selectedSub} className={controlClassName} onChange={event => { setSub(event.target.value); onValuesChange?.({ main: selectedMain, sub: event.target.value }); }}><option value="">เลือก Sub KPI</option>{rules.filter(rule => rule.mainKpi === selectedMain).map(rule => <option key={rule.id}>{rule.subKpi}</option>)}</select></FormField>
    <input name="ruleVersionId" type="hidden" value={selected?.id ?? ""} />
    {!rules.length && <p className="work-form-hint">ยังไม่มีกฎ KPI ที่ใช้ได้ ให้ผู้ดูแลตั้งค่าก่อนเพิ่มงาน</p>}
    <FormField label="TYPE ผู้รับเหมา" required={hasContractorNotice} controlId="work-type" error={mapFieldErrors(fieldErrors, "workType")}><select id="work-type" name="workType" defaultValue="" required={hasContractorNotice} className={controlClassName}><option value="">ไม่ระบุ</option>{["B1", "C1", "C2", "E1"].map(value => <option key={value}>{value}</option>)}</select></FormField>
    <FormField label="ผู้รับเหมา" controlId="work-contractor-name" error={mapFieldErrors(fieldErrors, "contractorName")}><input id="work-contractor-name" name="contractorName" maxLength={180} className={controlClassName} /></FormField>
    {hasBuildingCoordination && <>
      <FormField label="อาคาร" controlId="work-building" error={mapFieldErrors(fieldErrors, "building")}><input id="work-building" name="building" maxLength={180} className={controlClassName} /></FormField>
      <FormField label="ลูกค้า" controlId="work-client" error={mapFieldErrors(fieldErrors, "client")}><input id="work-client" name="client" maxLength={180} className={controlClassName} /></FormField>
      <FormField label="ผู้รับเหมาอาคาร" controlId="work-building-contractor" error={mapFieldErrors(fieldErrors, "contractor")}><input id="work-building-contractor" name="contractor" maxLength={180} className={controlClassName} /></FormField>
    </>}
    {hasSapJob && <FormField label="SSR Number" controlId="work-ssr-number" error={mapFieldErrors(fieldErrors, "ssrNumber")}><input id="work-ssr-number" name="ssrNumber" maxLength={180} className={controlClassName} /></FormField>}
    {hasOwfJob && <FormField label="OSP Number" controlId="work-osp-number" error={mapFieldErrors(fieldErrors, "ospNumber")}><input id="work-osp-number" name="ospNumber" maxLength={180} className={controlClassName} /></FormField>}
  </>;
}
