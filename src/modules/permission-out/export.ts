import JSZip from "jszip";
import type { Segment, Site } from "./domain";
import type { Area } from "./geography";
import { peaRegions,annotateGeography } from "./geography";
import { lineLength,type RouteLine } from "./domain";
import { resolvePeaArea } from "./pea-hierarchy.mjs";
import Decimal from "decimal.js";

export const xmlEscape = (text: unknown) => String(text ?? "").replace(/[<>&"']/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[\s\u0000-\u001f]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function csv(rows: unknown[][]) { return "\ufeff" + rows.map(row => row.map(csvCell).join(",")).join("\r\n"); }
export function routeCsv(segments: Segment[],groups:string[] = []) {
  if(segments.length>5000)throw new Error("ส่งออกได้สูงสุด 5,000 ช่วง กรุณากรองข้อมูล");
  return csv([["รหัส", "ชื่อ", "สถานะ", "การทับซ้อน", "จังหวัด", "สถานะสายต้นทาง", "ระยะทาง (เมตร)", "ขนาดสาย (มม.)", "จำนวนเสาต้นทาง", "ไฟล์ต้นทาง","กลุ่มทับซ้อน","รหัสพื้นที่ PEA","ชื่อพื้นที่ PEA"], ...segments.map((s,i) => [s.key, s.name, s.status, s.overlapType, s.provinces.join(" | ")||s.province, s.cableStatus, s.length.toFixed(2), s.diameter, s.poles, s.sourceFile,groups[i]??"",s.peaAreas?.map(a=>a.areaId||a.key).join(" | "),s.peaAreas?.map(a=>a.name).join(" | ")])]);
}
export function siteCsv(rows: { data: Site; opex: string | null }[], includeOpex: boolean) {
  return csv([["Site Code", "ชื่อไซต์", "ภาค", "พื้นที่", "จังหวัด", "เกรด", "ประเภท", "เจ้าของ", "ละติจูด", "ลองจิจูด", ...(includeOpex ? ["OPEX รายปี"] : [])], ...rows.map(({ data: s, opex }) => [s.code||s.key, s.name, s.regional, s.area, s.province, s.grade, s.type, s.owner, s.latitude, s.longitude, ...(includeOpex ? [opex] : [])])]);
}
export function routeKml(segments: Segment[], areas: Area[] = [], groups:string[] = [], selectedArea?:string) {
  if(segments.length>5000)throw new Error("ส่งออกได้สูงสุด 5,000 ช่วง กรุณากรองข้อมูล");
  type Folder={children:Map<string,Folder>;items:string[]};
  const root:Folder={children:new Map(),items:[]};
  for(const [i,s] of segments.entries()){
    const primary=s.peaAreas?.find(a=>a.key===selectedArea)??s.peaAreas?.slice().sort((a,b)=>b.coverageRatio-a.coverageRatio)[0];
    const hierarchy=resolvePeaArea(primary??{name:"ไม่พบพื้นที่ PEA"});
    const path=[...hierarchy.path,s.provinces.join(" | ")||s.province||"ไม่ระบุจังหวัด",s.status];
    let node=root;
    for(const part of path){if(!node.children.has(part))node.children.set(part,{children:new Map(),items:[]});node=node.children.get(part)!;}
    const data={code:s.key,status:s.status,overlap:s.overlapType,overlapGroup:groups[i]??"",province:s.provinces.join(" | ")||s.province,diameter:s.diameter??"",poles:s.poles??"",source:s.sourceFile,peaAreas:s.peaAreas?.map(a=>a.name).join(" | ")??"",peaAreaIds:s.peaAreas?.map(a=>a.areaId||a.key).join(" | ")??"",hierarchyConfirmed:hierarchy.confirmed};
    node.items.push(`<Placemark><name>${xmlEscape(s.name)}</name><ExtendedData>${Object.entries(data).map(([key,value])=>`<Data name="${key}"><value>${xmlEscape(value)}</value></Data>`).join("")}</ExtendedData><LineString><coordinates>${s.coords.map(p=>`${p[0]},${p[1]},0`).join(" ")}</coordinates></LineString></Placemark>`);
  }
  const render=(node:Folder):string=>node.items.join("")+[...node.children].map(([name,child])=>`<Folder><name>${xmlEscape(name)}</name>${render(child)}</Folder>`).join("");
  const areaKeys=new Set(segments.flatMap(s=>s.peaAreas?.map(a=>a.key)??[]));
  const polygons=areas.filter(a=>areaKeys.has(a.key)).map(a=>`<Placemark><name>${xmlEscape(a.name)}</name><Polygon>${a.geometry.coordinates.map((ring,i)=>`<${i?"innerBoundaryIs":"outerBoundaryIs"}><LinearRing><coordinates>${ring.map(p=>`${p[0]},${p[1]},0`).join(" ")}</coordinates></LinearRing></${i?"innerBoundaryIs":"outerBoundaryIs"}>`).join("")}</Polygon></Placemark>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>${render(root)}<Folder><name>พื้นที่ PEA</name>${polygons}</Folder></Document></kml>`;
}
export async function routeKmz(segments: Segment[], areas: Area[] = [],groups:string[]=[],selectedArea?:string) { return new JSZip().file("doc.kml", routeKml(segments,areas,groups,selectedArea)).generateAsync({ type: "uint8array", compression: "DEFLATE" }); }
const sourceCsvHeaders=["เขตการไฟฟ้าย่อย(RD03)","เขตการไฟฟ้าหลัก(RD03)","จังหวัด(RD03)","ชื่อเส้นทาง(RD03)","tag ของสายสื่อสาร(RD03)","ประเภทสาย(RD03)","เส้นผ่านศูนย์กลาง(มม.)(RD03)","จำนวนเสา ทั้งหมด(RD03)\n(ต้น)","จำนวนเสา ในพื้นที่(RD03)\n(ต้น)","พิกัดต้นทาง (RD03)","พิกัดปลายทาง (RD03)","รหัส(Maxi)","ชื่อ(Maxi)\u00a0","Type(Maxi)","Core(Maxi)","Status(Maxi)","Diameter(Maxi)","พิกัดต้นทาง(Maxi)","พิกัดปลายทาง(Maxi)","จังหวัด(Maxi)","เขตการไฟฟ้าหลัก(Maxi)","ระยะทางเส้นทาง(Maxi) (เมตร)","ระยะทางเส้นทาง(Maxi) (กม.)","ระยะทางทับซ้อนจริง (เมตร)","% ทับซ้อนเทียบ RD03"];
export async function pairedSourceCsv(lines:RouteLine[],threshold:number,polesPerKm:string|null,areas:Area[],trim=false,selectedKeys?:Set<string>,selectedArea?:string) {
  if(lines.length>5000)throw new Error("ส่งออกจับคู่ได้สูงสุด 5,000 เส้นทาง กรุณากรองข้อมูล");
  const annotated=annotateGeography(lines.map(line=>({...line,status:"new" as const,overlapType:"none" as const,length:lineLength(line.coords)})),areas);
  const {matchSourcesInWorker}=await import("./analysis-server");
  const matches=await matchSourcesInWorker(annotated,threshold,selectedKeys,trim);
  const property=(line:RouteLine|null,pattern:RegExp)=>Object.entries(line?.metadata??{}).find(([k])=>pattern.test(k))?.[1]??"";
  const geo=new Map(annotated.map(line=>[line.key,line]));
  const provinces=(line:RouteLine|null)=>line?(geo.get(line.key)?.provinces??[line.province]).join(" | "):"";
  const region=(line:RouteLine|null)=>{const province=line?geo.get(line.key)?.province:undefined;const entry=Object.entries(peaRegions).find(([,list])=>province&&list.includes(province));return entry?`กฟ${entry[0]}`:"";};
  const coord=(line:RouteLine|null,end=false)=>{if(!line)return "";const p=line.coords[end?line.coords.length-1:0];return `${p[1].toFixed(6)}, ${p[0].toFixed(6)}`;};
  const rows=matches.filter(row=>!selectedKeys||Boolean((row.rd03Line&&selectedKeys.has(row.rd03Line.key))||(row.maxiLine&&selectedKeys.has(row.maxiLine.key)))).map(({rd03Line:r,maxiLine:m,overlapMeters,overlapPercent})=>{
    const poles=r?(r.poles??(polesPerKm?new Decimal(String(lineLength(r.coords))).div(1000).mul(polesPerKm).ceil().toFixed(0):"")):"";
    const coverage=selectedArea&&r?geo.get(r.key)?.peaAreas?.find(a=>a.key===selectedArea)?.coverageRatio??0:1;
    const polesInArea=poles===""?"":new Decimal(poles).mul(coverage).ceil().toFixed(0);
    const office=r?geo.get(r.key)?.peaAreas?.find(a=>a.key===selectedArea)??geo.get(r.key)?.peaAreas?.slice().sort((a,b)=>b.coverageRatio-a.coverageRatio)[0]:undefined;
    const officePath=office?resolvePeaArea(office).path:[];
    const rawLength=property(m,/^calculated[_\s-]*fiber[_\s-]*length$/i)||property(m,/^calculated$/i);
    const match=rawLength.trim().match(/^((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*(?:m|meters?|เมตร)?$/i);
    const length=match?new Decimal(match[1].replaceAll(",","")):null;
    return [officePath.at(-1)??"",officePath.length>1?officePath[1]:region(r),provinces(r),r?property(r,/^originalName$/i)||r.name:"",property(r,/^tag$/i),property(r,/cable[_\s-]*type|^type$/i),r?.diameter??"",poles,polesInArea,coord(r),coord(r,true),property(m,/^code|route_code$/i),m?property(m,/^originalName$/i)||m.name:"",property(m,/^type|cable_type$/i),property(m,/^core|core_count$/i),m?.cableStatus??"",m?.diameter??"",coord(m),coord(m,true),provinces(m),region(m),length?.toFixed(2)??"",length?.div(1000).toFixed(3)??"",overlapMeters===""?"":overlapMeters.toFixed(2),overlapPercent===""?"":overlapPercent.toFixed(2)];
  });
  return csv([sourceCsvHeaders,...rows]);
}
