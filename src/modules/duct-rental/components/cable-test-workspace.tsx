"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { cableLabels, cableActionLabels, cablePermission, type CableInput } from "../domain/cable-workflow";
import type { listCables } from "../server/cables";
import { apiPost, errorText } from "./api-client";
import { useResource } from "./use-resource";
import { Field, Modal, ModuleNav, Notice, RefreshBar, useDuctModalState } from "./common";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TableRegion } from "@/components/ui/table-region";
import { CommunicationCableWorkspace } from "./communication-cable-workspace";
import styles from "../ui-shared/ui-shared.module.css";
type Rows=Awaited<ReturnType<typeof listCables>>;
type Row=Rows["rows"][number];
const empty: CableInput={authority:"PEA",projectName:"",routeName:"",startPoint:"",endPoint:"",cableType:"",contact:"",submissionNumber:"",permitNumber:"",notes:""};
const fields: [keyof Omit<CableInput,"authority"|"notes">,string][]=[["projectName","ชื่อโครงการ"],["routeName","เส้นทาง"],["startPoint","จุดต้นทาง"],["endPoint","จุดปลายทาง"],["cableType","ประเภทสาย"],["contact","ผู้ประสานงาน"],["submissionNumber","เลขรับเรื่อง"],["permitNumber","เลขใบอนุญาต"]];
export function CableTestWorkspace({permissions,initialDraft}:{permissions:string[];initialDraft?:CableInput}) {
 const [offset,setOffset]=useState(0),[query,setQuery]=useState(""),[search,setSearch]=useState("");
 const [editing,setEditing]=useState<Row|null|undefined>(undefined),[preview,setPreview]=useState(false);
 const model=useResource<Rows>(`cables?offset=${offset}&query=${encodeURIComponent(search)}`,editing!==undefined);
 if(preview)return <div className={`${styles.workspace} ${styles.cableSurface}`} data-ui-screen="duct-rental-communication-cable-preview"><div className={styles.toolbar}><Button variant="ghost" type="button" onClick={()=>setPreview(false)}>กลับรายการพาดสาย</Button></div><CommunicationCableWorkspace embedded/></div>;
 return <div className={`${styles.workspace} ${styles.cableSurface}`} data-ui-screen="duct-rental-communication-cable">
  <PageHeader title="พาดสายสื่อสาร" description="ทดสอบงาน PEA / MEA ด้วยบัญชีเดิม ข้อมูลที่บันทึกจะเก็บในระบบ" actions={permissions.includes("duct_rental.request.create")?<Button variant="primary" type="button" onClick={()=>setEditing(null)}>สร้างคำขอพาดสาย</Button>:undefined}/>
  <ModuleNav current="communication-cable"/>
  {initialDraft&&<Notice text="มีข้อมูลอ้างอิงจากผลวิเคราะห์เส้นทาง กดสร้างคำขอพาดสายเพื่อตรวจสอบและบันทึกร่าง"/>}
  <Notice text="อยู่ระหว่างทดสอบโฟลว์ — ยังไม่มีการส่งข้อมูลให้ PEA/MEA แนบไฟล์ หรือคำนวณค่าบริการ กรุณาใช้ข้อมูลทดสอบ"/>
  <RefreshBar {...model} paused={editing!==undefined} refresh={model.refresh}/><Notice text={model.error} error/>
  <form className={styles.actions} onSubmit={e=>{e.preventDefault();setOffset(0);setSearch(query);}}><Field label="ค้นหารหัส / ชื่อโครงการ"><input value={query} maxLength={200} onChange={e=>setQuery(e.target.value)}/></Field><Button variant="primary" type="submit">ค้นหา</Button><Button variant="ghost" type="button" onClick={()=>setPreview(true)}>ดูร่างโฟลว์</Button></form>
  <TableRegion label="รายการพาดสายที่คุณมีสิทธิ์ดู เลื่อนแนวนอนได้" className={styles.tableWrap}><table className={styles.table}><caption>รายการพาดสายที่คุณมีสิทธิ์ดู</caption><thead><tr><th scope="col">รหัส / โครงการ</th><th scope="col">หน่วยงาน</th><th scope="col">เส้นทาง</th><th scope="col">ขั้นตอน</th><th scope="col">ดำเนินการ</th></tr></thead><tbody>{model.data?.rows.map(row=><tr key={row.id}><td>{row.code}<div>{row.data.projectName}</div></td><td>{row.data.authority}</td><td>{row.data.routeName||"—"}</td><td>{cableLabels[row.stage]}</td><td><Button variant="secondary" type="button" onClick={()=>setEditing(row)}>เปิดรายการ</Button></td></tr>)}</tbody></table>{!model.data?.rows.length&&<p className={styles.empty}>{model.loading?"กำลังโหลด…":"ยังไม่มีรายการที่ตรงเงื่อนไข"}</p>}</TableRegion>
  <div className={styles.pagination}><span>ครั้งละ 50 รายการ</span><div className={styles.actions}><Button variant="secondary" type="button" disabled={!offset} onClick={()=>setOffset(offset-50)}>ก่อนหน้า</Button><Button variant="secondary" type="button" disabled={model.data?.nextOffset==null} onClick={()=>setOffset(model.data!.nextOffset!)}>ถัดไป</Button></div></div>
  {editing!==undefined&&<Modal title={editing?`${editing.code} · ${cableLabels[editing.stage]}`:"สร้างคำขอพาดสาย"} close={()=>setEditing(undefined)}><CableEditor row={editing} permissions={permissions} initialDraft={initialDraft} done={async()=>{await model.refresh();setEditing(undefined);}}/></Modal>}
 </div>;
}
function CableEditor({row,permissions,initialDraft,done}:{row:Row|null;permissions:string[];initialDraft?:CableInput;done:()=>Promise<void>}) {
 const [data,setData]=useState<CableInput>(row?.data??initialDraft??empty),[reason,setReason]=useState(""),[error,setError]=useState(""),[busy,setBusy]=useState(false),[confirm,setConfirm]=useState<"advance"|"revise"|"archive"|null>(null);
 const closed=row?.stage==="COMPLETE", canSave=!closed&&permissions.includes(row?"duct_rental.request.update":"duct_rental.request.create"), canAdvance=row&&!closed&&permissions.includes(cablePermission(row.stage));
 const editable=canSave||canAdvance;
 useDuctModalState(busy, JSON.stringify(data)!==JSON.stringify(row?.data??initialDraft??empty)||!!reason);
 async function run(action:"save"|"advance"|"revise"|"archive") {setBusy(true);setError("");try{await apiPost(row?`cables/${row.id}/change`:"cables",row?{version:row.version,action,data,reason}:data);await done();}catch(e){setError(errorText(e));}finally{setBusy(false);setConfirm(null);}}
 return <><Notice text={error} error/><div className={styles.grid}><Field label="หน่วยงาน"><select disabled={busy||!editable} value={data.authority} onChange={e=>setData({...data,authority:e.target.value as "PEA"|"MEA"})}><option>PEA</option><option>MEA</option></select></Field>{fields.map(([key,label])=><Field key={key} label={label}><input disabled={busy||!editable} value={data[key]} maxLength={key==="permitNumber"||key==="submissionNumber"||key==="cableType"?100:200} onChange={e=>setData({...data,[key]:e.target.value})}/></Field>)}<Field label="หมายเหตุ / ผลติดตั้งและตรวจรับ" full><textarea disabled={busy||!editable} value={data.notes} maxLength={4000} onChange={e=>setData({...data,notes:e.target.value})}/></Field></div>
 <p className={styles.muted}>ร่างต้องมีชื่อโครงการ ก่อนส่งตรวจต้องมีเส้นทาง จุดต้นทาง–ปลายทาง และประเภทสาย ก่อนยื่นต้องมีเลขรับเรื่อง ก่อนรับใบอนุญาตต้องมีเลขใบอนุญาต</p>
 {row&&<Field label="เหตุผลส่งกลับ / หมายเหตุการดำเนินการ"><textarea value={reason} maxLength={2000} disabled={busy} onChange={e=>setReason(e.target.value)}/></Field>}
 <div className={styles.actions}>{canSave&&<Button variant="primary" type="button" disabled={busy} onClick={()=>void run("save")}>{row?"บันทึกข้อมูล":"บันทึกร่าง"}</Button>}{canAdvance&&<Button variant="primary" type="button" disabled={busy} onClick={()=>setConfirm("advance")}>{cableActionLabels[row.stage]}</Button>}{canAdvance&&row?.stage==="SUBMITTED"&&<Button variant="secondary" type="button" disabled={busy||!reason.trim()} onClick={()=>setConfirm("revise")}>ส่งกลับแก้ไข</Button>}{row&&permissions.includes("duct_rental.request.archive")&&<Button variant="secondary" type="button" disabled={busy} onClick={()=>setConfirm("archive")}>เก็บเข้าประวัติ</Button>}</div>
 <ConfirmDialog open={!!confirm} title="ยืนยันดำเนินการพาดสาย" consequence={confirm==="archive"?"เก็บรายการออกจากรายการทำงาน โดยคงข้อมูลและประวัติไว้":confirm==="revise"?"ส่งกลับให้แก้ไขแบบและเอกสาร":"ยืนยันว่าดำเนินการขั้นตอนปัจจุบันครบแล้ว และส่งต่อขั้นถัดไป"} intent={confirm==="archive"?"danger":"primary"} pending={busy} onCancel={()=>setConfirm(null)} onConfirm={()=>{if(confirm)void run(confirm);}} />
 {!!row?.history.length&&<section><h3>ประวัติการดำเนินการ</h3><ol>{row.history.map((h,i)=><li key={i}>{new Date(h.at).toLocaleString("th-TH")} · {h.action==="save"?"บันทึกข้อมูล":h.action==="archive"?"เก็บเข้าประวัติ":`${cableLabels[h.from]} → ${cableLabels[h.to]}`}{h.reason&&` · ${h.reason}`}</li>)}</ol></section>}
 </>;
}
