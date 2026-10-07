"use client";
import { useState } from "react";
import type { JourneyLog } from "./car-booking-workspace";
function project(lat:number,lng:number,zoom:number) {
 const size=256*2**zoom,latitude=Math.max(-85.05112878,Math.min(85.05112878,lat))*Math.PI/180;
 return {x:(lng+180)/360*size,y:(1-Math.log(Math.tan(latitude)+1/Math.cos(latitude))/Math.PI)/2*size};
}
export function CarJourneyMap({logs}:{logs:JourneyLog[]}) {
 const [selected,setSelected]=useState(logs[0].id),[zoom,setZoom]=useState(12),[tileError,setTileError]=useState(false);
 const log=logs.find(row=>row.id===selected) || logs[0],center=project(Number(log.gpsLatitude),Number(log.gpsLongitude),zoom),origin={x:center.x-384,y:center.y-256};
 const tiles=[];for(let x=Math.floor(origin.x/256);x<=Math.floor((origin.x+768)/256);x++)for(let y=Math.floor(origin.y/256);y<=Math.floor((origin.y+512)/256);y++){const limit=2**zoom;if(y>=0&&y<limit)tiles.push({x,y,url:`https://tile.openstreetmap.org/${zoom}/${(x%limit+limit)%limit}/${y}.png`});}
 return <div className="cb-map"><div className="cb-filter"><label>ตำแหน่งบนแผนที่<select value={selected} onChange={e=>setSelected(e.target.value)}>{logs.map(row=><option key={row.id} value={row.id}>{row.location}</option>)}</select></label><button type="button" aria-label="ขยายแผนที่" disabled={zoom>=18} onClick={()=>setZoom(value=>value+1)}>+</button><button type="button" aria-label="ย่อแผนที่" disabled={zoom<=2} onClick={()=>setZoom(value=>value-1)}>−</button></div>
 <svg viewBox="0 0 768 512" role="img" aria-label={`แผนที่พิกัด ${log.location}`} className="cb-map-canvas"><rect width="768" height="512" fill="var(--color-surface-subtle)"/>{tiles.map(tile=><image key={`${zoom}-${tile.x}-${tile.y}`} href={tile.url} x={tile.x*256-origin.x} y={tile.y*256-origin.y} width="256" height="256" onError={()=>setTileError(true)}/>)}{logs.map((row,index)=>{const point=project(Number(row.gpsLatitude),Number(row.gpsLongitude),zoom);return <g key={row.id}><circle cx={point.x-origin.x} cy={point.y-origin.y} r={row.id===selected?14:10} fill="var(--color-brand)" stroke="var(--color-on-brand)" strokeWidth="2"/><text x={point.x-origin.x} y={point.y-origin.y+4} textAnchor="middle" fill="var(--color-on-brand)" fontSize="12">{index+1}</text></g>;})}</svg>
 {tileError&&<p role="status">โหลดพื้นแผนที่ไม่สำเร็จ ยังดูพิกัดในรายการด้านล่างได้</p>}<p className="cb-muted"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></p></div>;
}
