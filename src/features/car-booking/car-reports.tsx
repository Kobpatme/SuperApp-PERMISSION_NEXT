"use client";
import { useCallback,useEffect,useRef,useState } from "react";
import { carRequest } from "./car-booking-workspace";
import { bangkokInput,bookingStatus,thaiCarDate } from "@/lib/car-booking-display";
import type { readCarDashboard } from "@/lib/car-booking-report-service";
import type { readOspSync } from "@/lib/car-booking-osp-jobs";
type Report={columns:string[];rows:string[][];total:number;offset:number;limit:number;nextOffset:number|null};
type Dashboard=Awaited<ReturnType<typeof readCarDashboard>>;
type Sync=Awaited<ReturnType<typeof readOspSync>>;
export function CarReports({dashboard=false}:{dashboard?:boolean}){
 const [month,setMonth]=useState(()=>bangkokInput().slice(0,7)),[all,setAll]=useState(false),[offset,setOffset]=useState(0),[report,setReport]=useState<Report|null>(null),[stats,setStats]=useState<Dashboard|null>(null),[sync,setSync]=useState<Sync|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const sequence=useRef({value:0}),selection=all?"all":month;
 const load=useCallback(async()=>{
  const current=++sequence.current.value;setLoading(true);setError("");
  try{
   const [data,status]=await Promise.all([carRequest<Report|Dashboard>(`/api/car-booking/${dashboard?"dashboard":"reports"}?month=${selection}&offset=${offset}`),carRequest<Sync>("/api/car-booking/osp-sync")]);
   if(current!==sequence.current.value)return;
   if(dashboard)setStats(data as Dashboard);else setReport(data as Report);setSync(status);
  }catch(e){if(current===sequence.current.value){setError(e instanceof Error?e.message:"โหลดรายงานไม่สำเร็จ");setReport(null);setStats(null);}}
  finally{if(current===sequence.current.value)setLoading(false);}
 },[dashboard,selection,offset]);
 useEffect(()=>{const current=sequence.current,timer=setTimeout(()=>void load(),0);return()=>{clearTimeout(timer);current.value++;};},[load]);
 const queue=async(action:"retry"|"rebuild")=>{
  setLoading(true);setError("");setNotice("");
  try{await carRequest("/api/car-booking/osp-sync","POST",{action});setNotice("รับคำขอแล้ว รายงานจะส่งเบื้องหลังโดยไม่กระทบการคืนรถ");await load();}
  catch(e){setError(e instanceof Error?e.message:"รับคำขอไม่สำเร็จ");}finally{setLoading(false);}
 };
 const page=dashboard?stats:report,next=page?.nextOffset ?? null;
 const statuses:Record<string,string>={queued:"รอส่ง",running:"กำลังส่ง",sent:"ส่งแล้ว",failed:"ส่งไม่สำเร็จ"};
 return <section className="cb-panel cb-report"><h2>{dashboard?"แดชบอร์ดการใช้รถ":"รายงาน OSP"}</h2>
 <div className="cb-filter"><label>เดือนรายงาน<input type="month" disabled={all||loading} value={month} onChange={e=>{if(e.target.value){setMonth(e.target.value);setOffset(0);}}}/></label><label className="cb-check"><input type="checkbox" checked={all} disabled={loading} onChange={e=>{setAll(e.target.checked);setOffset(0);}}/>ทุกเดือน</label><button disabled={loading} onClick={()=>void load()}>โหลดรายงานใหม่</button><a className="cb-link" href={`/api/car-booking/reports?month=${selection}&format=csv`}>ดาวน์โหลด OSP CSV</a></div>
 <p className="cb-muted">กรองตามวันเริ่มใช้รถ (เวลาไทย) · OSP และยอดระยะทาง/น้ำมันนับเฉพาะรายการคืนแล้ว · รวมเติมระหว่างทางและตอนคืน</p>
 {loading&&<p role="status">กำลังโหลดรายงาน…</p>}{error&&<p role="alert" className="cb-error">{error}</p>}{notice&&<p role="status" className="cb-success">{notice}</p>}
 {dashboard&&stats&&<><dl className="cb-stats">{[["การจองทั้งหมด",stats.totals.total],["คืนแล้ว",stats.totals.completed],["กำลังใช้งาน",stats.totals.active],["จองล่วงหน้า",stats.totals.upcoming],["ระยะทางรวม (กม.)",stats.totals.distance],["น้ำมันรวม (ลิตร)",stats.totals.liters],["ค่าน้ำมันรวม (บาท)",stats.totals.amount]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
 <h3>สถิติรายคัน</h3><div className="cb-table-wrap" tabIndex={0} role="region" aria-label="ตารางรายงาน เลื่อนดูได้ด้วยคีย์บอร์ด"><table><thead><tr><th>ทะเบียน</th><th>ครั้ง</th><th>ระยะทาง (กม.)</th><th>ลิตร</th><th>บาท</th></tr></thead><tbody>{stats.cars.map(car=><tr key={car.car_id}><th scope="row">{car.license_plate}</th><td>{car.count}</td><td>{car.distance}</td><td>{car.liters}</td><td>{car.amount}</td></tr>)}</tbody></table></div>
 <h3>ผู้ใช้สูงสุด 5 อันดับ</h3><ol>{stats.topUsers.map(user=><li key={user.user_id}>{user.employee_name} · {user.count} ครั้ง</li>)}</ol>
 <h3>รายการการจอง</h3><div className="cb-table-wrap" tabIndex={0} role="region" aria-label="ตารางรายงาน เลื่อนดูได้ด้วยคีย์บอร์ด"><table><thead><tr><th>วันเริ่ม</th><th>ทะเบียน</th><th>ผู้จอง</th><th>ปลายทาง</th><th>สถานะ</th><th>กม.</th><th>ลิตร</th><th>บาท</th></tr></thead><tbody>{stats.bookings.map(booking=><tr key={booking.id}><td>{thaiCarDate(String(booking.start_time))}</td><th scope="row">{booking.license_plate}</th><td>{booking.employee_name}</td><td>{booking.destination}</td><td>{bookingStatus(booking.status,String(booking.start_time))}</td><td>{booking.distance}</td><td>{booking.liters}</td><td>{booking.amount}</td></tr>)}</tbody></table></div></>}
 {!dashboard&&report&&<><p>พบ {report.total} รายการคืนแล้ว</p><div className="cb-table-wrap" tabIndex={0} role="region" aria-label="ตารางรายงาน เลื่อนดูได้ด้วยคีย์บอร์ด"><table className="cb-osp-table"><caption className="cb-sr">รายงาน OSP 19 คอลัมน์</caption><thead><tr>{report.columns.map(column=><th key={column}>{column}</th>)}</tr></thead><tbody>{report.rows.map(row=><tr key={row[0]}>{row.map((value,i)=><td key={i}>{i===18&&value?<details><summary>ดูบันทึก</summary><pre tabIndex={0}>{value}</pre></details>:value}</td>)}</tr>)}</tbody></table></div></>}
 {page&&<div className="cb-filter cb-pagination"><button disabled={loading||offset===0} onClick={()=>setOffset(Math.max(0,offset-50))}>หน้ารายงานก่อนหน้า</button><span>หน้า {Math.floor(offset/50)+1}</span><button disabled={loading||next===null} onClick={()=>{if(next!==null)setOffset(next);}}>หน้ารายงานถัดไป</button></div>}
 {sync&&<section className="cb-sync"><h3>สถานะส่ง Google Sheets</h3><p>{sync.configured?"พร้อมส่งตามรอบงานที่ผู้ดูแลตั้งไว้":"ยังไม่ได้เปิดการส่ง Google Sheets รายการรอส่งยังเก็บอยู่"}</p><p>{sync.counts.map(row=>`${statuses[row.status]} ${row.count} รายการ`).join(" · ")||"ยังไม่มีงานส่ง"}</p><div className="cb-actions"><button disabled={loading} onClick={()=>void queue("retry")}>ลองส่งรายการที่ค้างอีกครั้ง</button><details><summary>สร้างรายงานทั้งชีตใหม่</summary><p>สำรองก่อนเขียน รักษาค่า SAP และแถวเดิมที่ยังไม่อยู่ในระบบ จากนั้นรวมแถวซ้ำ ผลซ้ำได้เหมือนเดิม</p><button disabled={loading} onClick={()=>void queue("rebuild")}>ยืนยันสร้างรายงานทั้งชีตใหม่</button></details></div><details><summary>ดูงานส่งล่าสุด (ไม่เกิน 20 รายการ)</summary><ul>{sync.jobs.map(job=><li key={job.id}>{job.kind==="rebuild"?"สร้างทั้งชีต":"ส่งรายการคืนรถ"} · {statuses[job.status]} · ลองแล้ว {job.attempts} ครั้ง{job.error_code?" · กรุณาตรวจการตั้งค่าหรือข้อมูลชีตแล้วลองใหม่":""}</li>)}</ul></details></section>}
 </section>;
}
