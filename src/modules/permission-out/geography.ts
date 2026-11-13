import boundaries from "./province-boundaries.json";
import { lineLength, sampleLine, type Coordinate, type Segment } from "./domain";
// Administrative boundary reference preserved byte-for-value from
// Permission_Out.html PROVINCE_BOUNDARIES at source SHA 55380a5. No site data.
type ProvinceBoundary = [string, number[], number[][]];
export const provinceBoundaries = boundaries as ProvinceBoundary[];
export function pointInRing(point: Coordinate, ring: Coordinate[]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
export function findProvince(point: Coordinate) {
  for (const [name, box, rings] of provinceBoundaries) {
    if (point[0] < box[0] || point[0] > box[2] || point[1] < box[1] || point[1] > box[3]) continue;
    let inside = false;
    for (const ring of rings) {
      const coordinates: Coordinate[] = [];
      for (let i = 0; i < ring.length; i += 2) coordinates.push([ring[i],ring[i + 1]]);
      if (pointInRing(point, coordinates)) inside = !inside;
    }
    if (inside) return name;
  }
  // Source fallback considers six nearest bounding boxes, then nearest vertex.
  const candidates = provinceBoundaries.map(p => ({ p, d: Math.hypot(Math.max(p[1][0]-point[0],0,point[0]-p[1][2]),Math.max(p[1][1]-point[1],0,point[1]-p[1][3])) })).sort((a,b) => a.d-b.d).slice(0,6);
  let best = Infinity, name = "";
  for (const { p } of candidates) for (const ring of p[2]) for (let i = 0; i < ring.length; i += 2) {
    const distance = (ring[i]-point[0])**2 + (ring[i+1]-point[1])**2;
    if (distance < best) { best = distance; name = p[0]; }
  }
  return name;
}
export const peaRegions: Record<string,string[]> = {
  "น.1": ["เชียงใหม่","ลำพูน","ลำปาง","เชียงราย","แม่ฮ่องสอน","พะเยา"], "น.2": ["พิษณุโลก","สุโขทัย","ตาก","กำแพงเพชร","พิจิตร","อุตรดิตถ์","แพร่","น่าน"], "น.3": ["ลพบุรี","สิงห์บุรี","ชัยนาท","อุทัยธานี","เพชรบูรณ์"],
  "ฉ.1": ["ขอนแก่น","อุดรธานี","หนองบัวลำภู","เลย","หนองคาย","บึงกาฬ","สกลนคร","นครพนม"], "ฉ.2": ["อุบลราชธานี","ศรีสะเกษ","ยโสธร","ร้อยเอ็ด","มหาสารคาม","กาฬสินธุ์","อำนาจเจริญ","มุกดาหาร"], "ฉ.3": ["นครราชสีมา","ชัยภูมิ","บุรีรัมย์","สุรินทร์"],
  "ก.1": ["อ่างทอง","ปราจีนบุรี","นครนายก","สระแก้ว","พระนครศรีอยุธยา","ปทุมธานี","สระบุรี"], "ก.2": ["ฉะเชิงเทรา","ชลบุรี","ระยอง","จันทบุรี","ตราด"], "ก.3": ["นครปฐม","สมุทรสาคร","สุพรรณบุรี","กาญจนบุรี"],
  "ต.1": ["เพชรบุรี","ราชบุรี","สมุทรสงคราม","ประจวบคีรีขันธ์","ชุมพร","ระนอง"], "ต.2": ["นครศรีธรรมราช","ตรัง","กระบี่","สุราษฎร์ธานี","พังงา","ภูเก็ต"], "ต.3": ["นราธิวาส","ปัตตานี","สงขลา","สตูล","พัทลุง"],
};
export type Area = { key: string; name: string; geometry: { type: "Polygon"; coordinates: Coordinate[][] }; properties: Record<string,string> };
export function annotateGeography(segments: Segment[], areas: Area[]) {
  const areaGrid=new Map<string,Area[]>(),cellSize=0.5;
  let gridBudget=0;
  for(const area of areas){
    const ring=area.geometry.coordinates[0];if(!ring?.length)continue;
    const box=ring.reduce((b,p)=>[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])],[Infinity,Infinity,-Infinity,-Infinity]);
    const left=Math.floor(box[0]/cellSize),right=Math.floor(box[2]/cellSize),bottom=Math.floor(box[1]/cellSize),top=Math.floor(box[3]/cellSize);
    gridBudget+=(right-left+1)*(top-bottom+1);if(gridBudget>500000)throw new Error("พื้นที่อ้างอิงกว้างเกินกำหนด กรุณาแบ่งชุดข้อมูล");
    for(let x=left;x<=right;x++)for(let y=bottom;y<=top;y++){const key=`${x},${y}`,bucket=areaGrid.get(key)??[];bucket.push(area);areaGrid.set(key,bucket);}
  }
  return segments.map(segment => {
    const length = segment.length || lineLength(segment.coords), interval = Math.max(1000, Math.min(10000,length/12 || 5000));
    const points = [segment.coords[0], segment.coords[segment.coords.length - 1], ...sampleLine(segment.coords,interval)];
    const counts = new Map<string,number>();
    for (const point of points) { const province = findProvince(point); counts.set(province,(counts.get(province) ?? 0)+1); }
    const provinces = [...counts.keys()], primary = [...counts].sort((a,b) => b[1]-a[1])[0]?.[0] || segment.province;
    const samplePoints: Coordinate[] = [];
    for (let i = 1; i < segment.coords.length; i++) {
      const a = segment.coords[i-1], b = segment.coords[i], steps = Math.max(1,Math.ceil(Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1])) / 0.02));
      if (samplePoints.length + steps > 50000) throw new Error("พื้นที่เส้นทางกว้างเกินกำหนด กรุณาแบ่งชุดข้อมูล");
      for (let j=0;j<=steps;j++) samplePoints.push([a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps]);
    }
    const coveredCounts=new Map<Area,number>();
    for(const point of samplePoints)for(const area of areaGrid.get(`${Math.floor(point[0]/cellSize)},${Math.floor(point[1]/cellSize)}`)??[])if(pointInRing(point,area.geometry.coordinates[0])&&!area.geometry.coordinates.slice(1).some(hole=>pointInRing(point,hole)))coveredCounts.set(area,(coveredCounts.get(area)??0)+1);
    const matched = areas.flatMap(area => {const covered=coveredCounts.get(area)??0;return covered?[{key:area.key,name:area.name,coverageRatio:covered/samplePoints.length,areaId:Object.entries(area.properties).find(([k])=>/^(id|area[_ -]?id|office[_ -]?id|รหัส)$/i.test(k))?.[1]??area.key,officeType:Object.entries(area.properties).find(([k])=>/^(type|office[_ -]?type|ประเภท)$/i.test(k))?.[1]??""}]:[];});
    return { ...segment, province: primary, provinces, peaAreas: matched };
  });
}
