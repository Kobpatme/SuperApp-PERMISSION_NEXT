"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BuildingLocationPicker, type BuildingLocationCandidate } from "./location-picker";
import { copy } from "@/lib/copy";

type Team = { id: string; name: string };
export function BuildingCreateForm({ apiKey, teams, canCreateWithoutTeam }: { apiKey: string; teams: Team[]; canCreateWithoutTeam: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [nameTh, setNameTh] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [ownerTeamId, setOwnerTeamId] = useState(teams[0]?.id ?? "");
  const [location, setLocation] = useState<BuildingLocationCandidate | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("กำลังสร้างข้อมูลอาคาร…");
    try {
      const response = await fetch("/api/buildings", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, nameTh, nameEn, ownerTeamId: ownerTeamId || null, location: location ? { ...location, verified: true } : undefined }) });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        throw new Error(response.status === 403 ? "ไม่มีสิทธิ์สร้างอาคารในทีมที่เลือก" : result.error === "invalid_building" ? "ตรวจรูปแบบรหัสและชื่ออาคารอีกครั้ง" : "สร้างข้อมูลไม่สำเร็จ อาจมีรหัสอาคารนี้แล้ว");
      }
      const result = await response.json() as { id: string };
      router.push(`/buildings/${result.id}`);
      router.refresh();
    } catch { setMessage(copy.feedback.createUnavailable); }
    finally { setBusy(false); }
  }

  return <form className="building-create-form" onSubmit={submit}>
    <section className="ui-panel building-create-fields"><div><h2>ข้อมูลอาคาร</h2><p>สร้างรายการในขอบเขตข้อมูลที่คุณได้รับอนุญาต</p></div>
      <label>รหัสอาคาร<input value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" maxLength={40} required /></label>
      <label>ชื่ออาคารภาษาไทย<input value={nameTh} onChange={(event) => setNameTh(event.target.value)} maxLength={240} required /></label>
      <label>ชื่ออาคารภาษาอังกฤษ<input value={nameEn} onChange={(event) => setNameEn(event.target.value)} maxLength={240} /></label>
      <label>ทีมเจ้าของข้อมูล<select value={ownerTeamId} onChange={(event) => setOwnerTeamId(event.target.value)} required={!canCreateWithoutTeam}><option value="">ไม่กำหนดทีม</option>{teams.map((team) => <option value={team.id} key={team.id}>{team.name}</option>)}</select></label>
    </section>
    <BuildingLocationPicker apiKey={apiKey} initial={null} canUpdate onConfirmCandidate={setLocation} />
    <div className="building-create-submit"><span>{message || (location ? "ยืนยันตำแหน่งแล้ว · จะบันทึกพร้อมข้อมูลอาคาร" : "ตำแหน่งเป็นข้อมูลเสริม สามารถเพิ่มภายหลังได้")}</span><button type="submit" disabled={busy || !code.trim() || !nameTh.trim() || (!ownerTeamId && !canCreateWithoutTeam)}>{busy ? "กำลังสร้าง…" : "สร้างอาคาร"}</button></div>
  </form>;
}
