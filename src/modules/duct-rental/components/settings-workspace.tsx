"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { SERVICE_CENTER_OPTIONS } from "../schemas/design";
import { apiPost, errorText } from "./api-client";
import { Field, ModuleNav, Notice, RefreshBar } from "./common";
import { useResource } from "./use-resource";
import type { FormOptions } from "./request-form";
import styles from "./workspace.module.css";
type Settings = { version: number; service_center_teams: Record<string, string>; coordinator_phones: Record<string, string> };
export function DuctSettings() {
 const [paused, setPaused] = useState(false), model = useResource<Settings>("settings", paused), options = useResource<FormOptions>("options");
 return <div className={styles.workspace}><PageHeader title="ตั้งค่าผู้ประสานงานเช่าท่อ" description="กำหนดทีมของศูนย์บริการและเบอร์ติดต่อ โดยใช้บัญชีและสมาชิกทีมใน Core" parent={{ label: "เช่าท่อร้อยสาย", href: "/duct-rental" }} /><ModuleNav /><RefreshBar {...model} paused={paused} refresh={model.refresh} /><Notice text={model.error || options.error} error />{model.data && options.data && <SettingsForm key={model.data.version} row={model.data} options={options.data} pause={setPaused} reload={async () => { setPaused(false); await model.refresh(); await options.refresh(); }} />}</div>;
}
function SettingsForm({ row, options, pause, reload }: { row: Settings; options: FormOptions; pause: (value: boolean) => void; reload: () => Promise<void> }) {
 const [centers, setCenters] = useState(row.service_center_teams), [phones, setPhones] = useState(row.coordinator_phones), [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
 async function save() { setBusy(true); setError(""); try { await apiPost("settings", { version: row.version, serviceCenterTeams: Object.fromEntries(Object.entries(centers).filter(([, value]) => value)), coordinatorPhones: phones }); setMessage("บันทึกการตั้งค่าแล้ว"); await reload(); } catch (reason) { setError(errorText(reason)); } finally { setBusy(false); } }
 return <><Notice text={error} error /><Notice text={message} /><section className={styles.panel}><h2>ศูนย์บริการและทีม</h2><div className={styles.grid}>{SERVICE_CENTER_OPTIONS.map(center => <Field key={center} label={`ทีมของ ${center}`}><select value={centers[center] || ""} disabled={busy} onChange={event => { setCenters(previous => ({ ...previous, [center]: event.target.value })); pause(true); }}><option value="">ยังไม่กำหนดทีม</option>{options.teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></Field>)}</div></section><section className={styles.panel}><h2>เบอร์ติดต่อผู้ประสานงานติดตั้ง</h2><div className={styles.grid}>{options.coordinators.map(person => <Field key={person.id} label={`${person.display_name} · ${person.email}`}><input value={phones[person.id] || ""} maxLength={100} disabled={busy} onChange={event => { setPhones(previous => ({ ...previous, [person.id]: event.target.value })); pause(true); }} /></Field>)}</div>{!options.coordinators.length && <p className={styles.muted}>ยังไม่พบบัญชีที่มีสิทธิ์งานติดตั้ง กรุณากำหนดบัญชีและสมาชิกทีมผ่านหน้าแอดมิน Core</p>}</section><button className={styles.primary} type="button" disabled={busy} onClick={() => void save()}>บันทึกการตั้งค่า</button></>;
}
