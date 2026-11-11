"use client";
import { Button } from "@/components/ui/button";
import { useCallback,useEffect,useRef,useState } from "react";
import { Panel } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import type { CarAccessUser } from "@/lib/car-booking-access";
import { carRequest } from "./car-booking-workspace";
export function CarAccessWorkspace() {
 const [users,setUsers]=useState<CarAccessUser[]>([]),[query,setQuery]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState(""),[loading,setLoading]=useState(true);
 const sequence=useRef({value:0});
 const load=useCallback(async()=>{const current=++sequence.current.value;setLoading(true);setError("");try{const rows=await carRequest<CarAccessUser[]>("/api/admin/car-booking");if(current===sequence.current.value)setUsers(rows);}catch(e){if(current===sequence.current.value)setError(e instanceof Error?e.message:"โหลดผู้ใช้ไม่สำเร็จ");}finally{if(current===sequence.current.value)setLoading(false);}},[]);
 useEffect(()=>{const current=sequence.current,timer=setTimeout(()=>void load(),0);return()=>{clearTimeout(timer);current.value++;};},[load]);
 const save=async(user:CarAccessUser,canUse:boolean,canAdmin:boolean)=>{
  setBusy(true);setError("");setMessage("");
  try{await carRequest("/api/admin/car-booking","PATCH",{userId:user.id,canUse,canAdmin,expectedUse:user.can_use,expectedAdmin:user.can_admin});setMessage(`บันทึกสิทธิ์ของ ${user.display_name || user.email} แล้ว มีผลในคำขอถัดไป`);await load();}
  catch(e){setError(e instanceof Error?e.message:"บันทึกสิทธิ์ไม่สำเร็จ");}finally{setBusy(false);}
 };
 const visible=users.filter(user=>`${user.display_name} ${user.email} ${user.employee_code}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 return <div className="cb-workspace" data-admin-surface="car-booking-access"><PageHeader title="สิทธิ์ระบบจองรถ" description="กำหนดสิทธิ์รายบุคคล มีผลทันทีในคำขอถัดไปโดยไม่ต้องเข้าสู่ระบบใหม่" parent={{label:"ผู้ดูแลระบบ",href:"/admin"}}/>
 <Panel className="cb-panel cb-access-panel" title="การเข้าถึงระบบจองรถ" headingId="car-access-title" description="แยกสิทธิ์การใช้งานส่วนบุคคลออกจากสิทธิ์ผู้ดูแล และบันทึกเมื่อเลือกเสร็จ" actions={<span className="cb-status-badge">{users.length} บัญชี</span>}><div className="cb-filter"><label>ค้นหาผู้ใช้<input className="ui-building-field" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="ชื่อ อีเมล หรือรหัสพนักงาน"/></label><Button disabled={busy || loading} onClick={()=>void load()}>โหลดใหม่</Button></div>{message&&<p role="status" className="cb-success">{message}</p>}{error&&<p role="alert" className="cb-error">{error}</p>}
 {loading&&<p role="status">กำลังโหลดผู้ใช้…</p>}<p className="cb-muted">ใช้งาน: จองและจัดการรายการของตนเอง · ผู้ดูแล: จัดการรถและรายการทั้งหมด ทั้งสองสิทธิ์เลือกแยกกันได้</p><div className="cb-access-list" aria-live="polite">{visible.map(user=><AccessRow key={`${user.id}-${user.can_use}-${user.can_admin}`} user={user} busy={busy || loading} onSave={save}/>)}</div>{!loading&&!error&&!visible.length&&<p role="status" className="cb-empty">{users.length ? "ไม่พบผู้ใช้ที่ตรงกับคำค้นหา" : "ไม่พบผู้ใช้"}</p>}</Panel></div>;
}
function AccessRow({user,busy,onSave}:{user:CarAccessUser;busy:boolean;onSave:(user:CarAccessUser,canUse:boolean,canAdmin:boolean)=>Promise<void>}) {
 const [use,setUse]=useState(user.can_use),[admin,setAdmin]=useState(user.can_admin);
 return <form className="cb-access-row" onSubmit={e=>{e.preventDefault();void onSave(user,use,admin);}}><div><strong>{user.display_name || user.email}</strong><p>{user.email} · {user.employee_code || "ไม่มีรหัสพนักงาน"} · {user.status==="active"?"ใช้งาน":"ถูกระงับ"}</p></div><label className="cb-check"><input type="checkbox" checked={use} disabled={busy} onChange={e=>setUse(e.target.checked)}/>ใช้งาน</label><label className="cb-check"><input type="checkbox" checked={admin} disabled={busy} onChange={e=>setAdmin(e.target.checked)}/>ผู้ดูแล</label><Button type="submit" variant="primary" disabled={busy || use===user.can_use&&admin===user.can_admin} aria-label={`บันทึกสิทธิ์ ${user.display_name || user.email}`}>บันทึก</Button></form>;
}
