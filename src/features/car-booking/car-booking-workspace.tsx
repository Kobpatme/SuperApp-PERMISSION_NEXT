"use client";
import Link from "next/link";
import { useCallback,useEffect,useRef,useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { bangkokInput,bangkokISO,bookingStatus,returnParkingFloor,thaiCarDate } from "@/lib/car-booking-display";
import { CarBookingDialog } from "./car-booking-dialog";
import { CarJourneyMap } from "./car-journey-map";
import { CarCalendar,type CarCalendarEvent } from "./car-calendar";
import { carCalendarBounds,type CarCalendarView } from "@/lib/car-booking-calendar";
export type Vehicle={car_id:string;license_plate:string;parking_floor:string|null;latest_mileage:string;is_active:boolean;last_user:string;using_now:boolean};
export type Reservation={id:string;userId:string;employeeName:string;carId:string;destination:string;startTime:string;endTime:string;status:string;startMileage:string;actualReturnTime:string|null};
export type JourneyLog={id:string;logTime:string;logType:string;location:string;mileage:string;note:string;fuelLiters:string|null;fuelAmount:string|null;gpsLatitude:string|null;gpsLongitude:string|null;gpsAccuracyMeters:string|null};
type CalendarEvent=CarCalendarEvent;
type PageResponse<T>={data:T[];message?:string;page?:{nextOffset:number|null}};
type Dialog={kind:"return"|"log"|"logs"|"gps"|"car"|"cancel";booking?:Reservation;car?:Vehicle};
export async function carRequest<T>(path:string,method="GET",body?:unknown):Promise<T> {
  const response=await fetch(path,{method,cache:"no-store",headers:body===undefined?undefined:{"Content-Type":"application/json"},body:body===undefined?undefined:JSON.stringify(body)});
  const result=await response.json();if(!response.ok)throw new Error(result.message || "ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่");return result.data;
}
const tabs=[{id:"book",label:"จองรถ"},{id:"mine",label:"รายการของฉัน"},{id:"return",label:"คืนรถ"},{id:"calendar",label:"ปฏิทิน"},{id:"vehicles",label:"ข้อมูลรถ"}];
export function CarBookingWorkspace({userId,admin,canManageAccess}:{userId:string;admin:boolean;canManageAccess:boolean}) {
 const [tab,setTab]=useState("book"),[cars,setCars]=useState<Vehicle[]>([]),[bookings,setBookings]=useState<Reservation[]>([]),[calendar,setCalendar]=useState<CalendarEvent[]>([]),[floors,setFloors]=useState<string[]>([]),[floorVersion,setFloorVersion]=useState(1);
 const [month,setMonth]=useState(()=>bangkokInput().slice(0,7)),[start,setStart]=useState(()=>bangkokInput()),[end,setEnd]=useState(()=>bangkokInput(new Date(Date.now()+3600000))),[available,setAvailable]=useState<Vehicle[]|null>(null),[availableRange,setAvailableRange]=useState(""),[selectedCar,setSelectedCar]=useState(""),[destination,setDestination]=useState("");
 const [calendarDate,setCalendarDate]=useState(()=>bangkokInput().slice(0,10)),[calendarView,setCalendarView]=useState<CarCalendarView>("month");
 const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[message,setMessage]=useState(""),[error,setError]=useState(""),[dialog,setDialog]=useState<Dialog|null>(null),[query,setQuery]=useState(""),[status,setStatus]=useState("all"),[floorText,setFloorText]=useState("");
 const refreshSequence=useRef({value:0});
 const range=useCallback(()=>{
  const [year,number]=month.split("-").map(Number);return `start=${encodeURIComponent(new Date(Date.UTC(year,number-1,1)-7*3600000).toISOString())}&end=${encodeURIComponent(new Date(Date.UTC(year,number,1)-7*3600000).toISOString())}`;
 },[month]);
 const calendarRange=useCallback(()=>{const bounds=carCalendarBounds(calendarDate,calendarView);return `start=${encodeURIComponent(bounds.start)}&end=${encodeURIComponent(bounds.end)}`;},[calendarDate,calendarView]);
 const refresh=useCallback(async()=>{
  const sequence=++refreshSequence.current.value;setLoading(true);setError("");
  try {
   const ownReservations:Reservation[]=[];let offset:number|null=0;
   while(offset!==null){
    const response:Response=await fetch(`/api/car-booking/bookings?${range()}&offset=${offset}`,{cache:"no-store"});const result:PageResponse<Reservation>=await response.json();if(!response.ok)throw new Error(result.message || "โหลดการจองไม่สำเร็จ");
    ownReservations.push(...result.data);offset=result.page?.nextOffset ?? null;
   }
   offset=0;
   while(offset!==null){
    const response:Response=await fetch(`/api/car-booking/bookings?view=active&offset=${offset}`,{cache:"no-store"});const result:PageResponse<Reservation>=await response.json();if(!response.ok)throw new Error(result.message || "โหลดรายการที่ยังไม่คืนไม่สำเร็จ");
    ownReservations.push(...result.data.filter((row:Reservation)=>!ownReservations.some(existing=>existing.id===row.id)));offset=result.page?.nextOffset ?? null;
   }
   const [vehicles,events,settings]=await Promise.all([carRequest<Vehicle[]>("/api/car-booking/cars"),carRequest<CalendarEvent[]>(`/api/car-booking/calendar?${calendarRange()}`),carRequest<{floors:string[];version:number}>("/api/car-booking/settings")]);
   if(sequence!==refreshSequence.current.value)return;
   setCars(vehicles);setBookings(ownReservations);setCalendar(events);setFloors(settings.floors);setFloorVersion(settings.version);setFloorText(settings.floors.join("\n"));setAvailable(null);
  }catch(e){if(sequence===refreshSequence.current.value){setError(e instanceof Error?e.message:"โหลดข้อมูลไม่สำเร็จ");setCars([]);setBookings([]);setCalendar([]);}}
  finally{if(sequence===refreshSequence.current.value)setLoading(false);}
 },[range,calendarRange]);
 useEffect(()=>{const sequence=refreshSequence.current;const timer=setTimeout(()=>void refresh(),0);return()=>{clearTimeout(timer);sequence.value++;};},[refresh]);
 const mutate=async(path:string,body:unknown,method="POST",success="บันทึกเรียบร้อยแล้ว")=>{
  setBusy(true);setError("");setMessage("");
  try{await carRequest(path,method,body);setDialog(null);setMessage(success);await refresh();return true;}
  catch(e){setError(e instanceof Error?e.message:"บันทึกไม่สำเร็จ");return false;}
  finally{setBusy(false);}
 };
 const allTabs=admin?[...tabs,{id:"admin",label:"จัดการรถ"},{id:"all",label:"การจองทั้งหมด"},{id:"parking",label:"ชั้นจอด"}]:tabs;
 const monthRange=new URLSearchParams(range()),monthStart=Date.parse(monthRange.get("start")!),monthEnd=Date.parse(monthRange.get("end")!);
 const filtered=bookings.filter(b=>(tab==="return" || Date.parse(b.startTime)<monthEnd&&Date.parse(b.endTime)>monthStart)&&(tab==="all" || b.userId===userId)&&(tab!=="return" || b.status==="booked" && Date.parse(b.startTime)<=now)&&(status==="all" || b.status===status)&&`${cars.find(c=>c.car_id===b.carId)?.license_plate || ""} ${b.destination} ${b.employeeName}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 const checkAvailable=async()=>{
  setBusy(true);setError("");setAvailable(null);setSelectedCar("");
  try{
   const from=bangkokISO(start),to=bangkokISO(end);if(to<=from)throw new Error("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มต้น");
   const rows=await carRequest<Vehicle[]>(`/api/car-booking/cars?start=${encodeURIComponent(from)}&end=${encodeURIComponent(to)}`);
   setAvailable(rows.filter(c=>c.is_active));setAvailableRange(`${start}|${end}`);
  }catch(e){setError(e instanceof Error?e.message:"ตรวจรถว่างไม่สำเร็จ");}finally{setBusy(false);}
 };
 return <div className="cb-workspace">
  <PageHeader title="ระบบจองรถ" description="จองและคืนรถ บันทึกการเดินทาง และตรวจสอบช่วงไม่ว่าง" actions={<span className="cb-scope">{admin?"ผู้ดูแลระบบจองรถ":"สิทธิ์ผู้ใช้ · รายการของตนเอง"}</span>}/>
  <div className="cb-toolbar"><nav aria-label="เมนูระบบจองรถ">{allTabs.map(item=><button key={item.id} type="button" aria-current={tab===item.id?"page":undefined} onClick={()=>{setTab(item.id);setQuery("");setStatus("all");}}>{item.label}</button>)}</nav>{canManageAccess&&<Link href="/admin/car-booking" className="cb-link">จัดสิทธิ์จองรถ</Link>}</div>
  <div className="cb-filter"><label>เดือนที่แสดง<input type="month" value={month} onChange={e=>{if(e.target.value){setMonth(e.target.value);setCalendarDate(`${e.target.value}-01`);}}}/></label><button type="button" disabled={loading || busy} onClick={()=>void refresh()}>โหลดใหม่</button><span className="cb-muted">เวลาไทย (กรุงเทพฯ)</span></div>
  {message&&<p role="status" className="cb-success">{message}</p>}{error&&<p role="alert" className="cb-error">{error}</p>}{loading&&<p role="status">กำลังโหลดข้อมูล…</p>}
  {tab==="book"&&<section className="cb-panel"><h2>จองรถ</h2><form onSubmit={async e=>{e.preventDefault();if(await mutate("/api/car-booking/bookings",{carId:selectedCar,destination,intervals:[{startTime:bangkokISO(start),endTime:bangkokISO(end)}]},"POST","จองรถเรียบร้อยแล้ว")){setDestination("");setSelectedCar("");}}}>
   <div className="cb-form-grid"><label>เวลาเริ่ม<input type="datetime-local" required value={start} onChange={e=>{setStart(e.target.value);setAvailable(null);}}/></label><label>เวลากลับ<input type="datetime-local" required value={end} onChange={e=>{setEnd(e.target.value);setAvailable(null);}}/></label></div>
   <button type="button" disabled={busy || !start || !end} onClick={()=>void checkAvailable()}>ตรวจรถว่าง</button>
   {available!==null&&<><p role="status">พบรถว่าง {available.length} คัน</p><label>ทะเบียนรถ<select required value={selectedCar} onChange={e=>setSelectedCar(e.target.value)}><option value="">เลือกทะเบียนรถ</option>{available.map(c=><option value={c.car_id} key={c.car_id}>{c.license_plate} · ที่จอด {c.parking_floor || "ยังไม่ระบุ"} · ไมล์ {c.latest_mileage}</option>)}</select></label></>}
   <label>สถานที่ที่จะไป<input required maxLength={2000} value={destination} onChange={e=>setDestination(e.target.value)} placeholder="ระบุจุดหมายหรือภารกิจ"/></label>
   <button className="cb-primary" disabled={busy || loading || !selectedCar || availableRange!==`${start}|${end}`} type="submit">{busy?"กำลังบันทึก…":"ยืนยันการจอง"}</button>
  </form></section>}
  {["mine","return","all"].includes(tab)&&<section className="cb-panel"><h2>{tab==="return"?"รายการที่เริ่มแล้วและยังไม่คืน":tab==="all"?"การจองทั้งหมด":"รายการของฉัน"}</h2><div className="cb-filter"><label>ค้นหาการจอง<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="ทะเบียน ปลายทาง หรือผู้จอง"/></label>{tab!=="return"&&<label>สถานะ<select value={status} onChange={e=>setStatus(e.target.value)}><option value="all">ทุกสถานะ</option><option value="booked">ยังไม่คืน</option><option value="completed">คืนแล้ว</option><option value="cancelled">ยกเลิก</option></select></label>}</div>
   {!filtered.length&&!loading&&<p role="status">ไม่มีรายการในเดือนและตัวกรองที่เลือก</p>}
   <div className="cb-reservations">{filtered.map(b=><article className="cb-reservation" key={b.id}><div><h3>{cars.find(c=>c.car_id===b.carId)?.license_plate || "รถ"}</h3><span className={`cb-status cb-status-${b.status}`}>{bookingStatus(b.status,b.startTime,now)}</span></div><p>{thaiCarDate(b.startTime)} → {thaiCarDate(b.actualReturnTime || b.endTime)}</p><p>{b.destination}</p>{admin&&<p className="cb-muted">ผู้จอง: {b.employeeName}</p>}<div className="cb-actions">{b.status==="booked"&&<>{Date.parse(b.startTime)<=now&&<button onClick={()=>setDialog({kind:"return",booking:b})}>คืนรถ</button>}<button onClick={()=>setDialog({kind:"log",booking:b})}>เพิ่มบันทึก</button><button className="cb-danger" onClick={()=>setDialog({kind:"cancel",booking:b})}>ยกเลิกการจอง</button></>}<button onClick={()=>setDialog({kind:"logs",booking:b})}>ดูบันทึก</button>{admin&&<button onClick={()=>setDialog({kind:"gps",booking:b})}>ดูพิกัด</button>}</div></article>)}</div>
  </section>}
  {tab==="calendar"&&<CarCalendar events={calendar} anchor={calendarDate} view={calendarView} loading={loading} onView={setCalendarView} onDate={date=>{setCalendarDate(date);setMonth(date.slice(0,7));}}/>}
  {["vehicles","admin"].includes(tab)&&<section className="cb-panel"><div className="cb-section-head"><h2>{tab==="admin"?"จัดการรถ":"ข้อมูลรถ"}</h2>{tab==="admin"&&<button className="cb-primary" onClick={()=>setDialog({kind:"car"})}>เพิ่มรถ</button>}</div><div className="cb-table-wrap"><table><caption className="cb-sr">ข้อมูลรถและการใช้งานล่าสุด</caption><thead><tr><th>ทะเบียน</th><th>ที่จอด</th><th>เลขไมล์ล่าสุด</th><th>ผู้ใช้ล่าสุด</th><th>สถานะ</th>{tab==="admin"&&<th>จัดการ</th>}</tr></thead><tbody>{cars.map(c=><tr key={c.car_id}><th scope="row">{c.license_plate}</th><td>{c.parking_floor || "ยังไม่ระบุ"}</td><td>{c.latest_mileage}</td><td>{c.last_user}</td><td>{c.is_active?"เปิดใช้งาน":"ปิดใช้งาน"}</td>{tab==="admin"&&<td><button onClick={()=>setDialog({kind:"car",car:c})}>แก้ไข {c.license_plate}</button></td>}</tr>)}</tbody></table></div></section>}
  {tab==="parking"&&admin&&<section className="cb-panel"><h2>รายการชั้นจอด</h2><form onSubmit={e=>{e.preventDefault();void mutate("/api/car-booking/settings",{floors:floorText.split(/\r?\n/).map(v=>v.trim()).filter(Boolean),version:floorVersion},"PATCH","บันทึกชั้นจอดแล้ว");}}><label>ชั้นจอด (หนึ่งรายการต่อบรรทัด)<textarea required rows={10} value={floorText} onChange={e=>setFloorText(e.target.value)}/></label><p className="cb-muted">การแก้รายการไม่เปลี่ยนที่จอดที่บันทึกไว้ในประวัติเดิม</p><button type="submit" className="cb-primary" disabled={busy}>บันทึกชั้นจอด</button></form></section>}
  {dialog&&<CarBookingDialog title={{return:"คืนรถ",log:"เพิ่มบันทึกระหว่างทาง",logs:"บันทึกระหว่างทาง",gps:"พิกัดการเดินทาง",car:dialog.car?"แก้ไขรถ":"เพิ่มรถ",cancel:"ยืนยันยกเลิกการจอง"}[dialog.kind]} busy={busy} onClose={()=>setDialog(null)}>
   {error&&<p role="alert" className="cb-error">{error}</p>}
   {dialog.kind==="cancel"&&<><p>ยกเลิกการจองไป {dialog.booking!.destination} ใช่หรือไม่?</p><div className="cb-actions"><button disabled={busy} className="cb-danger" onClick={()=>void mutate(`/api/car-booking/bookings/${dialog.booking!.id}/cancel`,{},"POST","ยกเลิกการจองเรียบร้อยแล้ว")}>ยืนยันยกเลิก</button><button disabled={busy} onClick={()=>setDialog(null)}>กลับ</button></div></>}
   {dialog.kind==="return"&&<ReturnForm booking={dialog.booking!} floor={returnParkingFloor(cars.find(c=>c.car_id===dialog.booking!.carId)?.parking_floor || null,floors)} floors={floors} busy={busy} onSave={body=>mutate(`/api/car-booking/bookings/${dialog.booking!.id}/return`,body,"POST","คืนรถเรียบร้อยแล้ว")}/>}
   {dialog.kind==="log"&&<LogForm busy={busy} onSave={body=>mutate(`/api/car-booking/bookings/${dialog.booking!.id}/logs`,body,"POST","บันทึกระหว่างทางแล้ว")}/>}
   {["logs","gps"].includes(dialog.kind)&&<JourneyLogs bookingId={dialog.booking!.id} gps={dialog.kind==="gps"}/>}
   {dialog.kind==="car"&&<CarForm vehicle={dialog.car} floors={floors} busy={busy} onSave={body=>mutate(`/api/car-booking/cars${dialog.car?`/${dialog.car.car_id}`:""}`,body,dialog.car?"PATCH":"POST","บันทึกข้อมูลรถแล้ว")}/>}
  </CarBookingDialog>}
 </div>;
}
function ReturnForm({booking,floor,floors,busy,onSave}:{booking:Reservation;floor:string;floors:string[];busy:boolean;onSave:(body:unknown)=>Promise<boolean>}) {
 const [fuel,setFuel]=useState(false);
 return <form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);void onSave({actualReturnTime:bangkokISO(String(data.get("returnTime"))),parkingFloor:String(data.get("parkingFloor")),mileage:String(data.get("mileage")),refueled:fuel,...(fuel?{fuelMileage:String(data.get("fuelMileage")),fuelLiters:String(data.get("fuelLiters")),fuelAmount:String(data.get("fuelAmount"))}:{})});}}><p>เริ่มใช้ {thaiCarDate(booking.startTime)} · ไมล์เริ่มต้น {booking.startMileage}</p><label>เวลาคืนรถ<input name="returnTime" type="datetime-local" required defaultValue={bangkokInput()}/></label><label>ชั้นที่จอด<select name="parkingFloor" required defaultValue={floor}>{floors.map(f=><option key={f}>{f}</option>)}</select></label><label>เลขไมล์ตอนคืน<input name="mileage" type="number" min="0" step="any" required inputMode="decimal"/></label><label className="cb-check"><input type="checkbox" checked={fuel} onChange={e=>setFuel(e.target.checked)}/>เติมน้ำมันตอนคืนรถ</label>{fuel&&<FuelFields mileage/>}<button disabled={busy} type="submit" className="cb-primary">ยืนยันคืนรถ</button></form>;
}
function FuelFields({mileage=false}:{mileage?:boolean}) {return <fieldset><legend>ข้อมูลการเติมน้ำมัน</legend>{mileage&&<label>เลขไมล์ตอนเติม<input name="fuelMileage" type="number" min="0" step="any" required inputMode="decimal"/></label>}<label>จำนวนลิตร<input name="fuelLiters" type="number" min="0.001" step="any" required inputMode="decimal"/></label><label>จำนวนเงิน (บาท)<input name="fuelAmount" type="number" min="0.01" step="any" required inputMode="decimal"/></label></fieldset>;}
function LogForm({busy,onSave}:{busy:boolean;onSave:(body:unknown)=>Promise<boolean>}) {
 const [type,setType]=useState("other"),[fuel,setFuel]=useState(false),[gps,setGps]=useState<{gpsLatitude:number;gpsLongitude:number;gpsAccuracyMeters:number}|null>(null),[locating,setLocating]=useState(false),[notice,setNotice]=useState("ยังไม่ได้แนบพิกัด สามารถบันทึกได้");
 const locate=()=>{if(!navigator.geolocation){setNotice("อุปกรณ์นี้ไม่รองรับพิกัด สามารถบันทึกต่อได้");return;}setLocating(true);navigator.geolocation.getCurrentPosition(position=>{setGps({gpsLatitude:position.coords.latitude,gpsLongitude:position.coords.longitude,gpsAccuracyMeters:position.coords.accuracy});setNotice("แนบพิกัดแล้ว");setLocating(false);},()=>{setGps(null);setNotice("ไม่สามารถรับพิกัดได้ สามารถบันทึกต่อโดยไม่มีพิกัด");setLocating(false);},{enableHighAccuracy:true,timeout:8000,maximumAge:120000});};
 return <form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);void onSave({logTime:bangkokISO(String(data.get("logTime"))),logType:type,location:String(data.get("location")),mileage:String(data.get("mileage")),note:String(data.get("note")),refueled:fuel,...(type==="fuel"||fuel?{fuelLiters:String(data.get("fuelLiters")),fuelAmount:String(data.get("fuelAmount"))}:{}),...(gps || {})});}}><label>วันเวลาบันทึก<input name="logTime" type="datetime-local" required defaultValue={bangkokInput()}/></label><label>ประเภท<select value={type} onChange={e=>setType(e.target.value)}><option value="other">บันทึกระหว่างทาง</option><option value="overnight_stop">จอดพัก</option><option value="checkpoint">จุดแวะ</option><option value="fuel">เติมน้ำมัน</option></select></label><label>สถานที่<input name="location" required maxLength={2000}/></label><label>เลขไมล์<input name="mileage" type="number" min="0" step="any" required inputMode="decimal"/></label>{type!=="fuel"&&<label className="cb-check"><input type="checkbox" checked={fuel} onChange={e=>setFuel(e.target.checked)}/>เติมน้ำมันด้วย</label>}{(type==="fuel" || fuel)&&<FuelFields/>}<label>หมายเหตุ<textarea name="note" maxLength={4000}/></label><div className="cb-actions"><button type="button" disabled={locating || busy} onClick={locate}>{locating?"กำลังรับพิกัด…":"แนบพิกัดปัจจุบัน"}</button>{gps&&<button type="button" onClick={()=>{setGps(null);setNotice("นำพิกัดออกแล้ว");}}>นำพิกัดออก</button>}</div><p role="status" className="cb-muted">{notice}</p><button disabled={busy || locating} type="submit" className="cb-primary">บันทึกการเดินทาง</button></form>;
}
function CarForm({vehicle,floors,busy,onSave}:{vehicle?:Vehicle;floors:string[];busy:boolean;onSave:(body:unknown)=>Promise<boolean>}) {return <form onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);void onSave({licensePlate:String(data.get("plate")),parkingFloor:String(data.get("floor")) || null,latestMileage:String(data.get("mileage")),isActive:data.get("active")==="on"});}}><label>ทะเบียนรถ<input name="plate" required maxLength={80} defaultValue={vehicle?.license_plate}/></label><label>ชั้นที่จอด<select name="floor" defaultValue={returnParkingFloor(vehicle?.parking_floor || null,floors)}><option value="">ยังไม่ระบุ</option>{floors.map(f=><option key={f}>{f}</option>)}</select></label><label>เลขไมล์ล่าสุด<input name="mileage" type="number" min="0" step="any" required defaultValue={vehicle?.latest_mileage || "0"}/></label><label className="cb-check"><input name="active" type="checkbox" defaultChecked={vehicle?.is_active ?? true}/>เปิดใช้งานรถ</label><p className="cb-muted">ปิดใช้งานเพื่อหยุดรับจองใหม่ ประวัติยังอยู่</p><button className="cb-primary" disabled={busy} type="submit">บันทึกรถ</button></form>;}
function JourneyLogs({bookingId,gps}:{bookingId:string;gps:boolean}) {
 const [rows,setRows]=useState<JourneyLog[]>([]),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 useEffect(()=>{let live=true;async function load(){try{const all:JourneyLog[]=[];let offset:number|null=0;while(offset!==null){const response:Response=await fetch(`/api/car-booking/bookings/${bookingId}/${gps?"gps":"logs"}?offset=${offset}`,{cache:"no-store"});const result:PageResponse<JourneyLog>=await response.json();if(!response.ok)throw new Error(result.message);all.push(...result.data);offset=result.page?.nextOffset ?? null;}if(live)setRows(all);}catch(e){if(live)setError(e instanceof Error?e.message:"โหลดบันทึกไม่สำเร็จ");}finally{if(live)setLoading(false);}}void load();return()=>{live=false;};},[bookingId,gps]);
 const labels:Record<string,string>={fuel:"เติมน้ำมัน",overnight_stop:"จอดพัก",checkpoint:"จุดแวะ",other:"บันทึกระหว่างทาง"};
 return <>{loading&&<p role="status">กำลังโหลดบันทึก…</p>}{error&&<p role="alert">{error}</p>}{gps&&rows.length>0&&<CarJourneyMap logs={rows}/>}<ol className="cb-log-list">{rows.map(row=><li key={row.id}><strong>{labels[row.logType]} · {row.location}</strong><p>{thaiCarDate(row.logTime)} · ไมล์ {row.mileage}</p>{row.fuelLiters&&<p>น้ำมัน {row.fuelLiters} ลิตร · {row.fuelAmount} บาท</p>}{row.note&&<p>{row.note}</p>}{gps&&<p>พิกัด {row.gpsLatitude}, {row.gpsLongitude} · ความแม่นยำ {row.gpsAccuracyMeters || "ไม่ระบุ"} เมตร</p>}</li>)}</ol>{!loading&&!rows.length&&!error&&<p role="status">ยังไม่มี{gps?"บันทึกที่มีพิกัด":"บันทึกระหว่างทาง"}</p>}</>;
}
