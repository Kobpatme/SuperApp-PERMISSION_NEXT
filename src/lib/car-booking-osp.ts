import Decimal from "decimal.js";
export const ospColumns=["_booking_id","ลำดับที่","วันที่ใช้รถ","เวลาเริ่มต้น","เลขไมล์เริ่มต้น","วันที่จอดรถ","เวลาสิ้นสุด","เลขไมล์สิ้นสุด","ระยะทางรวม (Km)","ศูนย์บริการ","ทะเบียนรถ","ชื่อผู้ใช้รถ","Sap. อ้างอิง","รายละเอียดงาน / เหตุผลการใช้รถ","จุดจอดรถ","เลขไมล์ที่เติมน้ำมัน","จำนวนลิตรที่เติมน้ำมัน","จำนวนเงินที่เติมน้ำมัน (บาท)","logs_json"] as const;
export type OspLog={id:string;log_time:string;log_type:string;location:string;mileage:string|null;refueled:boolean;fuel_liters:string|null;fuel_amount:string|null;note:string;gps_latitude:string|null;gps_longitude:string|null;gps_accuracy_meters:string|null};
export type OspSource={id:string;legacy_id:string|null;start_time:Date|string;actual_return_time:Date|string|null;start_mileage:string|null;mileage_on_return:string|null;license_plate:string;employee_name:string;destination:string;parking_floor:string|null;refueled:boolean;fuel_mileage:string|null;fuel_liters:string|null;fuel_amount:string|null;logs:OspLog[]};
const decimal=(value:string|null)=>new Decimal(value ?? "0");
const number=(value:string|null)=>value==null?"":new Decimal(value).toFixed();
const dateFormatter=new Intl.DateTimeFormat("th-TH",{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"Asia/Bangkok"});
const timeFormatter=new Intl.DateTimeFormat("en-GB",{hour:"2-digit",minute:"2-digit",hourCycle:"h23",timeZone:"Asia/Bangkok"});
export function ospDate(value:Date|string|null,time=false){
 if(value==null)return "";
 return (time?timeFormatter:dateFormatter).format(new Date(value));
}
export function ospLogLabel(log:OspLog){return log.log_type==="fuel"||log.refueled?"เติมน้ำมัน":log.log_type==="overnight_stop"?"จอดพัก":log.log_type==="checkpoint"?"จุดแวะ":"บันทึกระหว่างทาง";}
export function ospFuel(source:Pick<OspSource,"logs"|"refueled"|"fuel_liters"|"fuel_amount">){
 let liters=new Decimal(0),amount=new Decimal(0);
 for(const log of source.logs)if(log.log_type==="fuel"||log.refueled){liters=liters.plus(decimal(log.fuel_liters));amount=amount.plus(decimal(log.fuel_amount));}
 if(source.refueled){liters=liters.plus(decimal(source.fuel_liters));amount=amount.plus(decimal(source.fuel_amount));}
 return {liters:liters.toFixed(),amount:amount.toFixed()};
}
export function buildOspRow(source:OspSource,sequence:number,sap="ไม่มี SAP"):string[]{
 const logs=[...source.logs].sort((a,b)=>Date.parse(a.log_time)-Date.parse(b.log_time)||a.id.localeCompare(b.id));
 const fuel=ospFuel({...source,logs}),lastFuel=logs.filter(log=>log.log_type==="fuel"||log.refueled).at(-1);
 const logText=logs.map(log=>`${ospLogLabel(log)} : ${ospDate(log.log_time)} ${ospDate(log.log_time,true)} | ${log.location || "-"} | ไมล์ ${number(log.mileage)}${log.log_type==="fuel"||log.refueled?` | ${number(log.fuel_liters)} ลิตร | ${number(log.fuel_amount)} บาท`:""}${log.note?` | ${log.note}`:""}`);
 const logsJson=logs.map(log=>({time:new Date(log.log_time).toISOString(),type:ospLogLabel(log),location:log.location,mileage:number(log.mileage),fuel_liters:number(log.fuel_liters),fuel_amount:number(log.fuel_amount),note:log.note,gps:log.gps_latitude!=null&&log.gps_longitude!=null?{lat:number(log.gps_latitude),lng:number(log.gps_longitude),accuracy:number(log.gps_accuracy_meters)}:null}));
 return [source.legacy_id ?? source.id,String(sequence),ospDate(source.start_time),ospDate(source.start_time,true),number(source.start_mileage),ospDate(source.actual_return_time),ospDate(source.actual_return_time,true),number(source.mileage_on_return),source.start_mileage==null||source.mileage_on_return==null?"":decimal(source.mileage_on_return).minus(source.start_mileage).toFixed(),"OSP",source.license_plate,source.employee_name,sap,[source.destination,logText.join("\n")].filter(Boolean).join("\n\n"),source.parking_floor ?? "",number(source.fuel_mileage ?? lastFuel?.mileage ?? null),decimal(fuel.liters).gt(0)?fuel.liters:"",decimal(fuel.amount).gt(0)?fuel.amount:"",logsJson.length?JSON.stringify(logsJson):""];
}
export function ospCsv(rows:readonly (readonly string[])[]){
 const cell=(value:string)=>`"${(/^[\s]*[=+@-]/.test(value)?"'":"")+value.replaceAll('"','""')}"`;
 return "\ufeff"+[ospColumns,...rows].map(row=>row.map(cell).join(",")).join("\r\n")+"\r\n";
}
