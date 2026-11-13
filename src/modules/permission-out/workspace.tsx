"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import type { DatasetView, ProjectSnapshot } from "./service";
import type { Formula, Segment, RouteLine } from "./domain";
import { NetworkMap } from "@/components/map-workspace/network-map";
import { DatasetWorkspace } from "@/components/map-workspace/dataset-workspace";
import { styles, Field, ErrorMessage, Button } from "@/components/map-workspace/ui";


import provinceNames from "./province-names.json";
const selection=(event:ChangeEvent<HTMLSelectElement>)=>Array.from(event.target.selectedOptions).map(o=>o.value).join("|");

const api = "/api/permission-out/";
export async function readApi<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(api + path, { ...init, cache: "no-store" });
  const value = await response.json(); if (!response.ok) throw new Error(value.error || "โหลดข้อมูลไม่สำเร็จ"); return value;
}
const post = <T,>(path: string, value: unknown) => readApi<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value) });
const label = { new: "New — เพิ่มใหม่", same: "Same — เหมือนเดิม", remove: "Remove — นำออก" };

type ResultProject = { id: string; title: string;version:number; snapshot: ProjectSnapshot; fee: { total: string; subtotal: string; surcharge: string; incomplete: boolean } | null; totalSegments: number };
type Permissions = string[];



export function PermissionOutWorkspace({ view, permissions, canOpenCable=false }: { view: string; permissions: Permissions; canOpenCable?:boolean }) {
  const can = (code: string) => permissions.includes("*") || permissions.includes(`permission_out.${code}`);
  const name=({analysis:"วิเคราะห์เส้นทาง PEA / UFM",projects:"โครงการวิเคราะห์",reports:"รายงานเส้นทาง",datasets:"ชุดข้อมูล PEA / UFM",settings:"สูตรค่าพาดสาย"} as Record<string,string>)[view];
  return <main className={styles.workspace} data-ui-screen="route-intelligence">
    <PageHeader title={name} description="MOD 1 — วิเคราะห์และเปรียบเทียบโครงข่ายบนแผนที่" parent={{label:"ภาพรวม",href:"/"}}/>
    <nav className="ui-tabs" aria-label="ส่วนงานวิเคราะห์เส้นทาง">{[["","แผนที่เส้นทาง"],["projects","โครงการ"],...(can("dataset.manage")?[["datasets","ชุดข้อมูล"]]:[]),...(can("formula.manage")?[["settings","สูตรค่าพาดสาย"]]:[])].map(([path,title])=><Link key={path} href={`/permission-out${path?"/"+path:""}`} aria-current={(path||"analysis")===view?"page":undefined}>{title}</Link>)}</nav>
    {view==="analysis"&&<Analysis canRun={can("analysis.run")&&can("project.manage")} canExport={can("report.export")} canOpenCable={canOpenCable}/>}
    {(view==="projects"||view==="reports")&&<Projects/>}
    {view==="datasets"&&(can("dataset.manage")?<DatasetWorkspace moduleId="permission-out" canPublish={can("dataset.publish")} canDownload/>:<p>คุณไม่มีสิทธิ์จัดการชุดข้อมูลเส้นทาง</p>)}
    {view==="settings"&&(can("formula.manage")?<FormulaSettings/>:<p>คุณไม่มีสิทธิ์จัดการสูตรค่าพาดสาย</p>)}
  </main>;
}
function Analysis({ canRun, canExport, canOpenCable }: { canRun: boolean; canExport: boolean; canOpenCable:boolean }) {
  const params = useSearchParams(), router = useRouter();
  const [datasets, setDatasets] = useState<DatasetView[]>([]), [result, setResult] = useState<ResultProject | null>(null), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(""), [q, setQ] = useState(""), [province, setProvince] = useState(""), [overlap, setOverlap] = useState("");
  const [cableStatus,setCableStatus]=useState(""),[category,setCategory]=useState(""),[area,setArea]=useState("");
  const id = params.get("project"), key = useRef<string | null>(null),lastMode=useRef("");
  const [teams,setTeams]=useState<{id:string;name:string}[]>([]);
  useEffect(()=>{let active=true;readApi<typeof teams>("teams").then(rows=>{if(active)setTeams(rows);}).catch(()=>{});return()=>{active=false;};},[]);
  const filter = new URLSearchParams({ q, status, province, overlap, cableStatus, category, area });
  useEffect(() => { let active = true; readApi<DatasetView[]>("datasets").then(d => { if (active) setDatasets(d.filter(x => x.activeVersion && x.kind !== "sites")); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, []);
  useEffect(() => { let active = true; if (!id) return; readApi<ResultProject>(`projects/${id}?${new URLSearchParams({ q, status, province, overlap, cableStatus, category, area })}`).then(d => { if (active) { setResult(d); setError(""); } }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(false); }); return () => { active = false; }; }, [id, q, status, province, overlap, cableStatus, category, area]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setError("");
    const reuse=(event.nativeEvent as SubmitEvent).submitter?.getAttribute("name")==="reuse"?result:null;
    const mode=reuse?.id??"";if(lastMode.current!==mode){key.current=null;lastMode.current=mode;}
    key.current ??= crypto.randomUUID();
    form.set("input", JSON.stringify({ title: String(form.get("title")||"").trim()||(reuse?`${reuse.title} (สำเนา)`.slice(0,200):""),sourceProjectId:reuse?.id??null, teamId: form.get("teamId") || null, baseVersions: form.getAll("baseVersions"), compareVersions: form.getAll("compareVersions"), options: { threshold: Number(form.get("threshold")), interval: Number(form.get("interval")), dedupe: form.has("dedupe") }, idempotencyKey: key.current }));
    try { const saved = await readApi<{ id: string }>("analysis", { method: "POST", body: form }); key.current = null; router.push(`/permission-out?project=${saved.id}`); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  const [network,setNetwork]=useState<RouteLine[]>([]),[networkLimited,setNetworkLimited]=useState(false),[selectedRoute,setSelectedRoute]=useState<RouteLine|null>(null);
  useEffect(()=>{let active=true;readApi<{items:RouteLine[];limited:boolean}>("network").then(r=>{if(active){setNetwork(r.items);setNetworkLimited(r.limited);}}).catch(e=>{if(active)setError(e.message);});return()=>{active=false;};},[]);
  const loadReferences=useCallback(()=>readApi<{items:{key:string;name:string;coords?:[number,number][];geometry?:{type:"Polygon";coordinates:[number,number][][]}}[];limited:boolean}>("references"),[]);
  const selectedSegment=selectedRoute as Segment|null;
  return <>
    <div className={styles.workbench}>
      <aside className={styles.sidebar} aria-label="เครื่องมือวิเคราะห์เส้นทาง">
        {canRun && <form onSubmit={submit} className="ui-form" onChange={() => { key.current = null; }} aria-busy={busy}>
      <h2>ข้อมูลวิเคราะห์</h2>
      <Field label="ชื่อโครงการ"><input name="title" required maxLength={200} /></Field><Field label="ขอบเขตทีม"><select name="teamId"><option value="">โครงการส่วนบุคคล</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
      <div className={styles.columns}>{["base", "compare"].map(side => <fieldset key={side}><legend>{side === "base" ? "ชุดฐาน" : "ชุดเปรียบเทียบ"}</legend><Field label="เลือก KML/KMZ (หลายไฟล์ได้)"><input name={`${side}Files`} type="file" multiple accept=".kml,.kmz" /></Field><Field label="ชุดข้อมูลกลาง (กด Ctrl/⌘ เพื่อเลือกหลายชุด)"><select name={`${side}Versions`} multiple size={4}>{datasets.filter(d => ["pea","ufm"].includes(d.kind)).map(d => <option value={d.activeVersion!} key={d.id}>{d.name}</option>)}</select></Field></fieldset>)}</div>
      <div className={styles.actions}><Field label="ระยะใกล้เคียง (เมตร)"><input name="threshold" type="number" min={1} max={500} defaultValue={10} required /></Field><Field label="ระยะสุ่ม (เมตร)"><input name="interval" type="number" min={1} max={500} defaultValue={10} required /></Field><label><input name="dedupe" type="checkbox" /> ตัดเส้นซ้ำภายในชุด (ทับซ้อนตั้งแต่ 90%)</label><Button disabled={busy} type="submit">{busy ? "กำลังวิเคราะห์…" : "วิเคราะห์และบันทึกโครงการ"}</Button>{result&&<Button disabled={busy} type="submit" name="reuse" formNoValidate>วิเคราะห์ใหม่จากข้อมูลโครงการนี้</Button>}</div>
      <p>New คือช่วงที่มีในชุดฐานเท่านั้น / Remove คือช่วงที่มีในชุดเปรียบเทียบเท่านั้น การวิเคราะห์ด้านเดียวรองรับได้</p>
    </form>}
        {result&&<details open><summary>ตัวกรองผลวิเคราะห์</summary><div className="ui-map-fields"><Field label="ค้นหาเส้นทาง"><input value={q} onChange={e => setQ(e.target.value)} /></Field><Field label="จังหวัด (เลือกหลายค่าได้)"><select multiple size={3} value={province?province.split("|"):[]} onChange={e=>setProvince(selection(e))}>{provinceNames.map(p=><option key={p} value={p}>{p}</option>)}</select></Field><Field label="ผลเปรียบเทียบ"><select multiple size={3} value={status?status.split("|"):[]} onChange={e => setStatus(selection(e))}>{Object.entries(label).map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></Field><Field label="การทับซ้อน"><select multiple size={3} value={overlap?overlap.split("|"):[]} onChange={e => setOverlap(selection(e))}><option value="none">ไม่ทับซ้อน</option><option value="partial">ทับบางส่วน</option><option value="full">ทับทั้งหมด</option></select></Field><Field label="สถานะสาย Maxi"><input value={cableStatus} placeholder="หลายค่าคั่นด้วย |" onChange={e=>setCableStatus(e.target.value)} /></Field><Field label="ประเภทงาน Maxi"><select multiple size={3} value={category?category.split("|"):[]} onChange={e=>setCategory(selection(e))}><option value="network">โครงข่าย</option><option value="ready-access">พร้อมให้บริการ</option><option value="customer">ลูกค้า</option></select></Field><Field label="พื้นที่ PEA"><select value={area} onChange={e=>setArea(e.target.value)}><option value="">ทั้งหมด</option>{result.snapshot.areas?.map(a=><option key={a.key} value={a.key}>{a.name}</option>)}</select></Field></div>
      <p>ไม่เลือกค่า = ทั้งหมด · ใช้ Ctrl/⌘ เพื่อเลือกหลายค่า</p><Button onClick={()=>{setQ("");setProvince("");setStatus("");setOverlap("");setCableStatus("");setCategory("");setArea("");}}>ล้างตัวกรอง</Button><p role="status">พบ {result.snapshot.segments.length.toLocaleString("th-TH")} จาก {result.totalSegments.toLocaleString("th-TH")} ช่วงเส้นทาง{result.fee ? ` · ค่าพาดสาย ${result.fee.total} บาท${result.fee.incomplete ? " (ยังขาดขนาดสายบางรายการ)" : ""}` : " · ยังไม่ได้กำหนดสูตรค่าพาดสาย"}</p>
</details>}
      </aside>
      <div className={styles.canvas}>
        <ErrorMessage error={error}/>
        <NetworkMap title="แผนที่เส้นทาง PEA / UFM" routes={result?undefined:network} segments={result?.snapshot.segments} areas={result?.snapshot.areas} selectedRoute={selectedRoute} onRouteSelect={setSelectedRoute} onDetailClose={()=>setSelectedRoute(null)} loadReferences={loadReferences} detail={selectedRoute&&<><div className={styles.actions}><h2>รายละเอียดเส้นทาง</h2><Button onClick={()=>setSelectedRoute(null)}>ปิดรายละเอียดเส้นทาง</Button></div><strong>{selectedRoute.name}</strong><dl><div><dt>ไฟล์ต้นทาง</dt><dd>{selectedRoute.sourceFile||"ชุดข้อมูลกลาง"}</dd></div><div><dt>จังหวัด</dt><dd>{selectedRoute.provinces?.join(" | ")||selectedRoute.province||"ไม่ระบุ"}</dd></div><div><dt>ผลเปรียบเทียบ</dt><dd>{selectedSegment?.status?label[selectedSegment.status]:"เส้นทางจากชุดข้อมูลเผยแพร่"}</dd></div><div><dt>ขนาดสาย / จำนวนเสา</dt><dd>{selectedRoute.diameter??"ไม่ระบุ"} มม. / {selectedRoute.poles??"คำนวณตามระยะ"}</dd></div><div><dt>พิกัดต้น / ปลาย</dt><dd>{selectedRoute.coords.map((p,i)=>i===0||i===selectedRoute.coords.length-1?`${p[1]}, ${p[0]}`:null).filter(Boolean).join(" → ")}</dd></div></dl><details><summary>ข้อมูลประกอบเส้นทาง</summary><dl>{Object.entries(selectedRoute.metadata).map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></details></>}/>
        {!result&&<p>แผนที่ชุดข้อมูลเผยแพร่ · {network.length.toLocaleString("th-TH")} เส้นทาง{networkLimited?" (สูงสุด 5,000 รายการ)":""}</p>}
        {result&&<section className={styles.panel} aria-busy={busy}><h2>{result.title}</h2>
                {canExport && <div className={styles.actions}>{["csv","kml","kmz"].map(format => <a key={format} href={`${api}projects/${result.id}/export?${filter}&format=${format}`}>ส่งออก {format.toUpperCase()}</a>)}</div>}
      {canExport && <div className={styles.actions}><a href={`${api}projects/${result.id}/export?${filter}&format=source-csv`}>CSV จับคู่ RD03/Maxi ต้นฉบับ</a><a href={`${api}projects/${result.id}/export?${filter}&format=source-csv&trim=1`}>CSV จับคู่และตัดส่วนเกิน Maxi</a></div>}
      {canRun && <Button disabled={busy} onClick={async()=>{if(!window.confirm("เก็บโครงการออกจากรายการทำงาน โดยยังรักษาประวัติไว้?"))return;setBusy(true);try{await post(`projects/${result.id}/archive`,{expectedVersion:result.version});router.push("/permission-out/projects");}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>เก็บโครงการเข้าประวัติ</Button>}
      {canOpenCable && <Link href={`/duct-rental/communication-cable?analysisProject=${result.id}`}>ใช้ผลวิเคราะห์อ้างอิงคำขอพาดสาย</Link>}

        </section>}
      </div>
    </div>
    {result&&<section className={styles.panel}><h2>รายงานรายละเอียดช่วงเส้นทาง</h2><p>เลือกชื่อเส้นทางเพื่อซูมและเปิดรายละเอียดบนแผนที่</p><SegmentTable segments={result.snapshot.segments} onSelect={setSelectedRoute}/></section>}
  </>;
}
function SegmentTable({ segments,onSelect }: { segments: Segment[];onSelect:(route:RouteLine)=>void }) {
  const [page, setPage] = useState(1), count = Math.max(1, Math.ceil(segments.length / 50)), current = Math.min(page, count);
  return <><div className={styles.table} tabIndex={0} role="region" aria-label="ผลวิเคราะห์เส้นทาง"><table className="ui-table"><caption>ผลวิเคราะห์ตามตัวกรอง</caption><thead><tr>{["ชื่อเส้นทาง","ผลเปรียบเทียบ","การทับซ้อน","จังหวัด","ระยะ (ม.)","ขนาดสาย (มม.)","จำนวนเสาต้นทาง"].map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{segments.slice((current - 1) * 50, current * 50).map((s, index) => <tr key={`${s.key}:${index}`}><th scope="row"><Button variant="ghost" onClick={()=>onSelect(s)}>{s.name}</Button><details><summary>พิกัดและต้นทาง</summary><p>{s.sourceFile || "ไม่ระบุไฟล์"}</p><p>ต้น: {s.coords[0]?.[1]}, {s.coords[0]?.[0]}<br/>ปลาย: {s.coords.at(-1)?.[1]}, {s.coords.at(-1)?.[0]}</p></details></th><td>{label[s.status]}</td><td>{({ none: "ไม่ทับซ้อน", full: "ทับทั้งหมด", partial: "ทับบางส่วน" })[s.overlapType]}</td><td>{s.province || "—"}</td><td>{s.length.toFixed(2)}</td><td>{s.diameter ?? "ไม่ระบุ"}</td><td>{s.poles ?? "คำนวณจากระยะ"}</td></tr>)}</tbody></table>{!segments.length && <p>ไม่พบเส้นทางตามตัวกรอง</p>}</div><div className={styles.actions}><Button disabled={current === 1} onClick={() => setPage(current - 1)}>ก่อนหน้า</Button><span>หน้า {current} / {count}</span><Button disabled={current === count} onClick={() => setPage(current + 1)}>ถัดไป</Button></div></>;
}
function Projects() {
  const [q, setQ] = useState(""), [page, setPage] = useState(1), [rows, setRows] = useState<{ id: string; title: string; createdAt: string; total: number }[]>([]), [error, setError] = useState("");
  useEffect(() => { let active = true; readApi<typeof rows>(`projects?${new URLSearchParams({ q, page: String(page) })}`).then(r => { if (active) { setRows(r); setError(""); } }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [q, page]);
  return <section className={styles.panel}><Field label="ค้นหาโครงการ"><input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} /></Field><ErrorMessage error={error} /><ul className={styles.list}>{rows.map(r => <li key={r.id}><Link href={`/permission-out?project=${r.id}`}>{r.title}</Link><span>{new Date(r.createdAt).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</span></li>)}</ul>{!rows.length && !error && <p>ยังไม่มีโครงการที่ตรงกับคำค้นหา</p>}<div className={styles.actions}><Button disabled={page === 1} onClick={() => setPage(page - 1)}>ก่อนหน้า</Button><span>หน้า {page}</span><Button disabled={rows.length < 50} onClick={() => setPage(page + 1)}>ถัดไป</Button></div></section>;
}
function FormulaSettings() {
  const [error, setError] = useState(""), [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [formulas, setFormulas] = useState<{ id: string; parameters: Formula }[]>([]);
  const load = useCallback(() => readApi<{ id: string; parameters: Formula }[]>("formulas"), []);
  useEffect(() => { load().then(setFormulas).catch(e => setError(e.message)); }, [load]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget); if (!window.confirm("ยืนยันบันทึกสูตรใหม่? โครงการใหม่จะใช้สูตรนี้ตั้งแต่วันเริ่มใช้ ส่วนผลวิเคราะห์เดิมยังใช้สูตรเดิม")) return; setBusy(true); setError("");
    try { await post("formulas", { name: form.get("name"), polesPerKm: form.get("polesPerKm"), rate: form.get("rate"), surchargePercent: form.get("surchargePercent"), effectiveFrom: new Date(String(form.get("effectiveFrom"))).toISOString(), rounding: "summary_half_up_2" }); setMessage("บันทึกสูตรเวอร์ชันใหม่แล้ว"); setFormulas(await load()); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  return <section className={styles.panel}><p>ยังไม่มีอัตราเริ่มต้น กรุณากรอกเฉพาะอัตราที่เจ้าของงานรับรองแล้ว จำนวนเสาต้นทางมีลำดับก่อนการคำนวณจากระยะ รวมต้นทุนก่อนปัดยอดสรุปสองตำแหน่ง</p><form onSubmit={submit}><div className={styles.columns}><Field label="ชื่อสูตร"><input name="name" required maxLength={100} /></Field>{[["polesPerKm","จำนวนเสาต่อกิโลเมตร"],["rate","อัตราบาท / มม. / เสา"],["surchargePercent","ค่าเพิ่ม (%)"]].map(([name, title]) => <Field label={title} key={name}><input name={name} required inputMode="decimal" pattern="[0-9]+([.][0-9]{1,8})?" /></Field>)}<Field label="เริ่มใช้ (เวลาไทย)"><input name="effectiveFrom" type="datetime-local" required /></Field></div><Button type="submit" disabled={busy}>บันทึกสูตรเวอร์ชันใหม่</Button></form><ErrorMessage error={error} /><p role="status">{message}</p><ul className={styles.list}>{formulas.map(f => <li key={f.id}>{f.parameters.name} · {f.parameters.rate} บาท · เริ่ม {new Date(f.parameters.effectiveFrom).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</li>)}</ul></section>;
}
