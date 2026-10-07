export type CarCalendarView="month"|"week"|"day";
const dayMs=86400000;
const localDate=(date:Date)=>date.toISOString().slice(0,10);
export function carCalendarBounds(anchor:string,view:CarCalendarView) {
 const date=new Date(`${anchor}T00:00:00Z`);
 let first=date,count=1;
 if(view==="month"){
  first=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),1));
  const days=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,0)).getUTCDate();
  count=Math.ceil((first.getUTCDay()+days)/7)*7;
  first=new Date(first.getTime()-first.getUTCDay()*dayMs);
 }else if(view==="week"){first=new Date(date.getTime()-date.getUTCDay()*dayMs);count=7;}
 const days=Array.from({length:count},(_,i)=>localDate(new Date(first.getTime()+i*dayMs)));
 return {days,start:new Date(first.getTime()-7*3600000).toISOString(),end:new Date(first.getTime()+count*dayMs-7*3600000).toISOString()};
}
export function moveCarCalendar(anchor:string,view:CarCalendarView,direction:number){
 const date=new Date(`${anchor}T00:00:00Z`);
 return localDate(view==="month"?new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+direction,1)):new Date(date.getTime()+direction*(view==="week"?7:1)*dayMs));
}
