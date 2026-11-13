"use client";
import {useCallback,useEffect,useState,type FormEvent} from "react";
import type {DatasetView} from "@/modules/permission-out/service";
import {styles,Field,ErrorMessage,Button,useWorkspaceApi} from "./ui";
export function DatasetWorkspace({ canPublish,canDownload,moduleId }: { canPublish: boolean;canDownload:boolean;moduleId:"permission-out"|"site-facility" }) {
  const {api,readApi,post}=useWorkspaceApi(moduleId);
  const [datasets, setDatasets] = useState<DatasetView[]>([]), [selected, setSelected] = useState(""), [versions, setVersions] = useState<{ id: string; state: string; filename: string; report: Record<string, unknown> }[]>([]), [error, setError] = useState(""), [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const [teams,setTeams]=useState<{id:string;name:string}[]>([]);
  useEffect(()=>{let active=true;readApi<typeof teams>("teams").then(r=>{if(active)setTeams(r);}).catch(()=>{});return()=>{active=false;};},[readApi]);
  const load = useCallback(() => readApi<DatasetView[]>("datasets"), [readApi]);
  useEffect(() => { load().then(setDatasets).catch(e => setError(e.message)); }, [load]);
  useEffect(() => { let active = true; if (!selected) return; readApi<typeof versions>(`datasets/${selected}`).then(r => { if (active) setVersions(r); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [selected, message,readApi]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget); setBusy(true); setError("");
    try { const result = await readApi<{ datasetId: string; report: Record<string, number> }>("import", { method: "POST", body: form }); setSelected(result.datasetId); setMessage(`ตรวจไฟล์แล้ว: เพิ่ม ${result.report.added}, เปลี่ยน ${result.report.updated}, นำออก ${result.report.removed}, เหมือนเดิม ${result.report.unchanged}, ไม่มีพิกัด ${result.report.withoutCoordinates} — ยังไม่เผยแพร่`); setDatasets(await load()); }
    catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  async function publish(id: string) {
    if (!window.confirm("ยืนยันเผยแพร่เวอร์ชันนี้? ข้อมูลที่ผู้ใช้เห็นจะเปลี่ยนเป็นเวอร์ชันที่เลือก")) return;
    setBusy(true); setError("");
    try { await post("publish", { datasetId: selected, versionId: id, expectedVersion: datasets.find(d => d.id === selected)?.version }); setMessage(`เผยแพร่เวอร์ชันเรียบร้อย ${new Date().toLocaleTimeString("th-TH")}`); setDatasets(await load()); }
    catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  return <section className={styles.panel}><h2>นำเข้าชุดข้อมูลเวอร์ชันใหม่</h2><form onSubmit={submit} aria-busy={busy}><div className={styles.columns}><Field label="ชุดข้อมูลเดิม"><select name="datasetId" value={selected} onChange={e => setSelected(e.target.value)}><option value="">สร้างชุดข้อมูลใหม่</option>{datasets.map(d => <option key={d.id} value={d.id}>{d.name} ({d.kind})</option>)}</select></Field><Field label="ชื่อชุดข้อมูล"><input name="name" key={selected} defaultValue={datasets.find(d=>d.id===selected)?.name??""} required maxLength={200} /></Field>{!selected&&<Field label="ทีมเจ้าของข้อมูล"><select name="teamId"><option value="">ไม่ระบุทีม</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>}<Field label="ประเภท"><select name="kind" key={selected} defaultValue={datasets.find(d=>d.id===selected)?.kind??(moduleId==="site-facility"?"sites":"pea")}>{moduleId==="permission-out"?<><option value="pea">เส้นทาง/พื้นที่ PEA</option><option value="ufm">เส้นทาง UFM</option><option value="road">ถนนอ้างอิง</option><option value="building">พื้นที่อาคารอ้างอิง</option></>:<option value="sites">Site Facility — Excel / Total Site</option>}</select></Field><Field label="ไฟล์ KML/KMZ หรือ Excel (สูงสุด 100 MB)"><input name="file" type="file" accept={moduleId==="site-facility"?".xlsx":".kml,.kmz"} required /></Field></div><Button disabled={busy} type="submit">{busy ? "กำลังตรวจและนำเข้า…" : "ตรวจไฟล์และนำเข้าร่าง"}</Button></form><p>{moduleId==="site-facility"?"Excel ต้องมีชีต Total Site และหัวตาราง 70 คอลัมน์":"ไฟล์ KML/KMZ ต้องมีเส้นทางหรือขอบเขตพื้นที่ที่ถูกต้อง"} · ข้อมูลปัจจุบันจะไม่เปลี่ยนจนกว่าจะเผยแพร่</p><ErrorMessage error={error} /><p role="status">{message}</p><h2>เวอร์ชันของชุดข้อมูลที่เลือก</h2><ul className={styles.list}>{versions.map(v => <li key={v.id}><div><strong>{v.filename}</strong><p>{v.state === "staging" ? "ร่าง" : v.state === "published" ? "เผยแพร่แล้ว" : "เก็บย้อนหลัง"} · เพิ่ม {String(v.report.added)} · เปลี่ยน {String(v.report.updated)} · นำออก {String(v.report.removed)} · เหมือนเดิม {String(v.report.unchanged)}</p></div>{canDownload&&<a href={`${api}source/${v.id}`}>ดาวน์โหลดต้นฉบับ</a>}{canPublish && v.state !== "published" && <Button disabled={busy} onClick={() => publish(v.id)}>{v.state === "archived" ? "ย้อนกลับเวอร์ชันนี้" : "เผยแพร่"}</Button>}</li>)}</ul></section>;
}
