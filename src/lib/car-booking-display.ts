export function bookingStatus(status:string,startTime:string,now=Date.now()) {
  if(status==="completed")return "คืนแล้ว";
  if(status==="cancelled")return "ยกเลิก";
  return Date.parse(startTime)>now?"จองล่วงหน้า":"กำลังใช้งาน";
}
export function thaiCarDate(value:string) {return new Intl.DateTimeFormat("th-TH",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Bangkok"}).format(new Date(value));}
export function bangkokInput(value=new Date()) {
  return new Date(value.getTime()+7*3600000).toISOString().slice(0,16);
}
export function bangkokISO(value:string) {return new Date(`${value}:00+07:00`).toISOString();}
export function returnParkingFloor(current:string|null,floors:string[]) {
  return current && floors.includes(current)?current:floors.includes("2A")?"2A":floors[0] || "";
}
