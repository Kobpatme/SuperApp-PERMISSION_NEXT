"use client";
import { useState } from "react";
import { bangkokInput,thaiCarDate } from "@/lib/car-booking-display";
import { carCalendarBounds,moveCarCalendar,type CarCalendarView } from "@/lib/car-booking-calendar";
export type CarCalendarEvent={car_id:string;license_plate:string;start_time:string;end_time:string};
export function CarCalendar({events,anchor,view,onDate,onView,loading}:{events:CarCalendarEvent[];anchor:string;view:CarCalendarView;onDate:(date:string)=>void;onView:(view:CarCalendarView)=>void;loading:boolean}){
 const [selected,setSelected]=useState<CarCalendarEvent|null>(null),{days}=carCalendarBounds(anchor,view);
 const legend=Array.from(new Map(events.map(event=>[event.car_id,event.license_plate])).entries()).sort((a,b)=>a[1].localeCompare(b[1],"th"));
 const heading=new Intl.DateTimeFormat("th-TH",view==="month"?{month:"long",year:"numeric",timeZone:"Asia/Bangkok"}:{dateStyle:"full",timeZone:"Asia/Bangkok"}).format(new Date(`${anchor}T12:00:00+07:00`));
 return <section className="cb-panel"><h2>ปฏิทินช่วงไม่ว่าง</h2><p className="cb-muted">แสดงเฉพาะทะเบียนและเวลา หากคืนแล้วจะแสดงเวลาคืนจริง</p>
 <div className="cb-filter"><button disabled={loading} onClick={()=>{setSelected(null);onDate(moveCarCalendar(anchor,view,-1));}}>ก่อนหน้า</button><button disabled={loading} onClick={()=>{setSelected(null);onDate(bangkokInput().slice(0,10));}}>วันนี้</button><button disabled={loading} onClick={()=>{setSelected(null);onDate(moveCarCalendar(anchor,view,1));}}>ถัดไป</button><label>มุมมองปฏิทิน<select value={view} disabled={loading} onChange={e=>{setSelected(null);onView(e.target.value as CarCalendarView);}}><option value="month">เดือน</option><option value="week">สัปดาห์</option><option value="day">วัน</option></select></label></div>
 <h3 className="cb-calendar-heading">{heading}</h3><div className="cb-legend" aria-label="คำอธิบายสีรถ">{legend.map(([id,plate],i)=><span key={id}><i className={`cb-swatch cb-tone-${i%5}`} aria-hidden="true"/>{plate}</span>)}</div>
 {selected&&<p role="status" className="cb-calendar-detail"><strong>{selected.license_plate}</strong> · {thaiCarDate(selected.start_time)} → {thaiCarDate(selected.end_time)}</p>}
 <div className={`cb-calendar-grid cb-calendar-${view}`} aria-label={`ปฏิทิน ${heading}`}>
 {view!=="day"&&["อา.","จ.","อ.","พ.","พฤ.","ศ.","ส."].map(day=><div key={day} className="cb-weekday" aria-hidden="true">{day}</div>)}
 {days.map(day=>{
  const start=Date.parse(`${day}T00:00:00+07:00`),end=start+86400000;
  const rows=events.filter(event=>Date.parse(event.start_time)<end&&(Date.parse(event.end_time)>start || event.start_time===event.end_time&&Date.parse(event.start_time)>=start));
  return <section key={day} className={`cb-calendar-cell${day.slice(0,7)!==anchor.slice(0,7)?" cb-adjacent-month":""}`}><h4>{new Intl.DateTimeFormat("th-TH",{day:"numeric",month:"short",timeZone:"Asia/Bangkok"}).format(new Date(`${day}T12:00:00+07:00`))}</h4>{rows.map((event,i)=><button type="button" key={`${event.car_id}-${i}`} className={`cb-calendar-event cb-tone-${Math.max(0,legend.findIndex(([id])=>id===event.car_id))%5}`} onClick={()=>setSelected(event)} aria-label={`${event.license_plate} ${thaiCarDate(event.start_time)} ถึง ${thaiCarDate(event.end_time)}`}><strong>{event.license_plate}</strong><span>{bangkokInput(new Date(event.start_time)).slice(0,10)===day?bangkokInput(new Date(event.start_time)).slice(11):"ต่อจากวันก่อน"} → {bangkokInput(new Date(event.end_time)).slice(0,10)===day?bangkokInput(new Date(event.end_time)).slice(11):"ต่อวันถัดไป"}</span></button>)}</section>;
 })}</div>{!events.length&&!loading&&<p role="status">ยังไม่มีช่วงไม่ว่างในช่วงนี้</p>}</section>;
}
