"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { cableLabels, cableActionLabels, cablePermission, type CableInput } from "../domain/cable-workflow";
import type { listCables } from "../server/cables";
import { apiPost, errorText } from "./api-client";
import { useResource } from "./use-resource";
import { Field, Modal, ModuleNav, Notice, RefreshBar } from "./common";
import { CommunicationCableWorkspace } from "./communication-cable-workspace";
import styles from "./workspace.module.css";
type Rows=Awaited<ReturnType<typeof listCables>>;
type Row=Rows["rows"][number];
const empty: CableInput={authority:"PEA",projectName:"",routeName:"",startPoint:"",endPoint:"",cableType:"",contact:"",submissionNumber:"",permitNumber:"",notes:""};
const fields: [keyof Omit<CableInput,"authority"|"notes">,string][]=[["projectName","ชื่อโครงการ"],["routeName","เส้นทาง"],["startPoint","จุดต้นทาง"],["endPoint","จุดปลายทาง"],["cableType","ประเภทสาย"],["contact","ผู้ประสานงาน"],["submissionNumber","เลขรับเรื่อง"],["permitNumber","เลขใบอนุญาต"]];
export function CableTestWorkspace({permissions}:{permissions:string[]}) {
 const [offset,setOffset]=useState(0),[query,setQuery]=useState(""),[search,setSearch]=useState("");
 const [editing,setEditing]=useState<Row|null|undefined>(undefined),[preview,setPreview]=useState(false);
 const model=useResource<Rows>(`cables?offset=${offset}&query=${encodeURIComponent(search)}`,editing!==undefined);
 if(preview)return <><button type="button" className={styles.button} onClick={()=>setPreview(false)}>กลับรายการพาดสาย</button><CommunicationCableWorkspace/></>;
 return <div className={styles.workspace}>
  <PageHeader title="พาดสายสื่อสาร" description="ทดสอบงาน PEA / MEA ด้วยบัญชีเดิม ข้อมูลที่บันทึกจะเก็บในระบบ" actions={permissions.includes("duct_rental.request.create")?<button className={styles.primary} onClick={()=>setEditing(null)}>สร้างคำขอพาดสาย</button>:undefined}/>
  <ModuleNav current="communication-cable"/>
  <Notice text="อยู่ระหว่างทดสอบโฟลว์ — ยังไม่มีการส่งข้อมูลให้ PEA/MEA แนบไฟล์ หรือคำนวณค่าบริการ กรุณาใช้ข้อมูลทดสอบ"/>
  <RefreshBar {...model} paused={editing!==undefined} refresh={model.refresh}/><Notice text={model.error} error/>
  <form className={styles.actions} onSubmit={e=>{e.preventDefault();setOffset(0);setSearch(query);}}><Field label="ค้นหารหัส / ชื่อโครงการ"><input value={query} maxLength={200} onChange={e=>setQuery(e.target.value)}/></Field><button className={styles.button}>ค้นหา</button><button type="button" className={styles.button} onClick={()=>setPreview(true)}>ดูร่างโฟลว์</button></form>
  <div className={styles.tableWrap}><table className={styles.table}><caption>รายการพาดสายที่คุณมีสิทธิ์ดู</caption><thead><tr><th scope="col">รหัส / โครงการ</th><th scope="col">หน่วยงาน</th><th scope="col">เส้นทาง</th><th scope="col">ขั้นตอน</th><th scope="col">ดำเนินการ</th></tr></thead><tbody>{model.data?.rows.map(row=><tr key={row.id}><td>{row.code}<div>{row.data.projectName}</div></td><td>{row.data.authority}</td><td>{row.data.routeName||"—"}</td><td>{cableLabels[row.stage]}</td><td><button className={styles.button} onClick={()=>setEditing(row)}>เปิดรายการ</button></td></tr>)}</tbody></table>{!model.data?.rows.length&&<p className={styles.empty}>{model.loading?"กำลังโหลด…":"ยังไม่มีรายการที่ตรงเงื่อนไข"}</p>}</div>
  <div className={styles.pagination}><span>ครั้งละ 50 รายการ</span><div className={styles.actions}><button className={styles.button} disabled={!offset} onClick={()=>setOffset(offset-50)}>ก่อนหน้า</button><button className={styles.button} disabled={model.data?.nextOffset==null} onClick={()=>setOffset(model.data!.nextOffset!)}>ถัดไป</button></div></div>
  {editing!==undefined&&<Modal title={editing?`${editing.code} · ${cableLabels[editing.stage]}`:"สร้างคำขอพาดสาย"} close={()=>setEditing(undefined)}><CableEditor row={editing} permissions={permissions} done={async()=>{await model.refresh();setEditing(undefined);}}/></Modal>}
 </div>;
}
function CableEditor({row,permissions,done}:{row:Row|null;permissions:string[];done:()=>Promise<void>}) {
 const [data,setData]=useState<CableInput>(row?.data??empty),[reason,setReason]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[confirm,setConfirm]=useState<"advance"|"revise"|"archive"|null>(null);
 const closed=row?.stage==="COMPLETE", canSave=!closed&&permissions.includes(row?"duct_rental.request.update":"duct_rental.request.create"), canAdvance=row&&!closed&&permissions.includes(cablePermission(row.stage));
 const editable=canSave||canAdvance;
 async function run(action:"save"|"advance"|"revise"|"archive") {setBusy(true);setError("");try{await apiPost(row?`cables/${row.id}/change`:"cables",row?{version:row.version,action,data,reason}:data);await done();}catch(e){setError(errorText(e));}finally{setBusy(false);setConfirm(null);}}
 return <><Notice text={error} error/><div className={styles.grid}><Field label="หน่วยงาน"><select disabled={busy||!editable} value={data.authority} onChange={e=>setData({...data,authority:e.target.value as "PEA"|"MEA"})}><option>PEA</option><option>MEA</option></select></Field>{fields.map(([key,label])=><Field key={key} label={label}><input disabled={busy||!editable} value={data[key]} maxLength={key==="permitNumber"||key==="submissionNumber"||key==="cableType"?100:200} onChange={e=>setData({...data,[key]:e.target.value})}/></Field>)}<Field label="หมายเหตุ / ผลติดตั้งและตรวจรับ" full><textarea disabled={busy||!editable} value={data.notes} maxLength={4000} onChange={e=>setData({...data,notes:e.target.value})}/></Field></div>
 <p className={styles.muted}>ร่างต้องมีชื่อโครงการ ก่อนส่งตรวจต้องมีเส้นทาง จุดต้นทาง–ปลายทาง และประเภทสาย ก่อนยื่นต้องมีเลขรับเรื่อง ก่อนรับใบอนุญาตต้องมีเลขใบอนุญาต</p>
 {row&&<Field label="เหตุผลส่งกลับ / หมายเหตุการดำเนินการ"><textarea value={reason} maxLength={2000} disabled={busy} onChange={e=>setReason(e.target.value)}/></Field>}
 <div className={styles.actions}>{canSave&&<button className={styles.primary} disabled={busy} onClick={()=>void run("save")}>{row?"บันทึกข้อมูล":"บันทึกร่าง"}</button>}{canAdvance&&<button className={styles.primary} disabled={busy} onClick={()=>setConfirm("advance")}>{cableActionLabels[row.stage]}</button>}{canAdvance&&row?.stage==="SUBMITTED"&&<button className={styles.button} disabled={busy||!reason.trim()} onClick={()=>setConfirm("revise")}>ส่งกลับแก้ไข</button>}{row&&permissions.includes("duct_rental.request.archive")&&<button className={styles.button} disabled={busy} onClick={()=>setConfirm("archive")}>เก็บเข้าประวัติ</button>}</div>
 {confirm&&<div className={styles.notice}><p>{confirm==="archive"?"ยืนยันเก็บรายการนี้ออกจากรายการทำงาน โดยคงข้อมูลและประวัติไว้?":confirm==="revise"?"ยืนยันส่งกลับให้แก้ไขแบบและเอกสาร?":"ยืนยันว่าดำเนินการขั้นตอนปัจจุบันครบแล้ว และส่งต่อขั้นถัดไป?"}</p><div className={styles.actions}><button className={styles.primary} disabled={busy} onClick={()=>void run(confirm)}>ยืนยัน</button><button className={styles.button} disabled={busy} onClick={()=>setConfirm(null)}>กลับไปตรวจ</button></div></div>}
 {!!row?.history.length&&<section><h3>ประวัติการดำเนินการ</h3><ol>{row.history.map((h,i)=><li key={i}>{new Date(h.at).toLocaleString("th-TH")} · {h.action==="save"?"บันทึกข้อมูล":h.action==="archive"?"เก็บเข้าประวัติ":`${cableLabels[h.from]} → ${cableLabels[h.to]}`}{h.reason&&` · ${h.reason}`}</li>)}</ol></section>}
 </>;
}
