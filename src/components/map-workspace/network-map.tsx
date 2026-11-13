"use client";
import { useEffect,useRef,useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Field as FormField } from "./ui";
import type { RouteLine,Segment,Site } from "@/modules/permission-out/domain";
import type { Area } from "@/modules/permission-out/geography";
import "leaflet/dist/leaflet.css";
export type MapSite=Site&{datasetId:string};
type ReferenceFeature={key:string;name:string;coords?:[number,number][];geometry?:{type:"Polygon";coordinates:[number,number][][]}};
type MapProps={title:string;segments?:Segment[];sites?:MapSite[];areas?:Area[];routes?:RouteLine[];selectedRoute?:RouteLine|null;selectedSite?:MapSite|null;onRouteSelect?:(route:RouteLine)=>void;onSiteSelect?:(site:MapSite)=>void;loadReferences?:()=>Promise<{items:ReferenceFeature[];limited:boolean}>;detail?:React.ReactNode;onDetailClose?:()=>void;filterOverlay?:React.ReactNode;toolbarTarget?:HTMLElement|null};
const empty:never[]=[];
const statusLabel={new:"New — เพิ่มใหม่",same:"Same — เหมือนเดิม",remove:"Remove — นำออก"};
export function NetworkMap({title,segments=empty,sites=empty,areas=empty,routes=empty,selectedRoute,selectedSite,onRouteSelect,onSiteSelect,loadReferences,detail,onDetailClose,filterOverlay,toolbarTarget}:MapProps){
 const element=useRef<HTMLDivElement>(null),mapRef=useRef<import("leaflet").Map|null>(null),boundsRef=useRef<import("leaflet").LatLngBounds|null>(null);
 const events=useRef({onRouteSelect,onSiteSelect});useEffect(()=>{events.current={onRouteSelect,onSiteSelect};},[onRouteSelect,onSiteSelect]);
 const [failed,setFailed]=useState(false),[expanded,setExpanded]=useState(false),[base,setBase]=useState("street"),[showAreas,setShowAreas]=useState(true),[showReferences,setShowReferences]=useState(false),[references,setReferences]=useState<ReferenceFeature[]>([]),[referenceLimited,setReferenceLimited]=useState(false),[referenceError,setReferenceError]=useState("");
 const [visible,setVisible]=useState({new:true,same:true,remove:true}),[mode,setMode]=useState("sites"),[fitVersion,setFitVersion]=useState(0);
 const detailRef=useRef<HTMLElement>(null),detailOpen=Boolean(detail);
 const [themeRevision,setThemeRevision]=useState(0);
 useEffect(()=>{const observer=new MutationObserver(()=>setThemeRevision(v=>v+1));observer.observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});return()=>observer.disconnect();},[]);
 useEffect(()=>{if(!detailOpen)return;const opener=document.activeElement instanceof HTMLElement?document.activeElement:null;detailRef.current?.focus();return()=>{if(opener?.isConnected)opener.focus();};},[detailOpen]);
 useEffect(()=>{if(!showReferences||!loadReferences)return;let active=true;loadReferences().then(r=>{if(active){setReferences(r.items);setReferenceLimited(r.limited);setReferenceError("");}}).catch(()=>{if(active)setReferenceError("โหลดชั้นข้อมูลอ้างอิงไม่สำเร็จ กรุณาลองอีกครั้ง");});return()=>{active=false;};},[showReferences,loadReferences]);
 useEffect(()=>{if(!expanded)return;const opener=document.activeElement instanceof HTMLElement?document.activeElement:null;const close=(e:KeyboardEvent)=>{if(e.key==="Escape"){setExpanded(false);opener?.focus();}};document.addEventListener("keydown",close);return()=>document.removeEventListener("keydown",close);},[expanded]);
 useEffect(()=>{const timer=setTimeout(()=>mapRef.current?.invalidateSize(),0);return()=>clearTimeout(timer);},[expanded,detail]);
 useEffect(()=>{
  let active=true;let map:import("leaflet").Map|undefined;
  import("leaflet").then(L=>{
   if(!active||!element.current)return;
   const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
   map=L.map(element.current,{preferCanvas:true,scrollWheelZoom:false,zoomControl:false,zoomAnimation:!reduced,fadeAnimation:!reduced}).setView([13.75,100.5],6);mapRef.current=map;
   L.control.zoom({zoomInTitle:"ซูมเข้า",zoomOutTitle:"ซูมออก"}).addTo(map);
   if(base!=="none"){
    const tiles=L.tileLayer(base==="satellite"?"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}":"https://tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:base==="satellite"?"© Esri":"© OpenStreetMap",maxZoom:19});tiles.on("tileerror",()=>{if(active)setFailed(true);});tiles.addTo(map);
   }
   // Canvas needs resolved colors, not literal CSS var() strings.
   const token=(name:string)=>getComputedStyle(element.current!).getPropertyValue(name).trim();
   const layers:import("leaflet").Layer[]=[];
   if(showAreas)for(const area of areas){const layer=L.polygon(area.geometry.coordinates.map(r=>r.map(p=>[p[1],p[0]] as [number,number])),{color:token("--color-info"),weight:1,fillOpacity:.07});const text=document.createElement("span");text.textContent=area.name;layer.bindPopup(text);layers.push(layer);}
   if(showReferences)for(const feature of references){const layer=feature.coords?L.polyline(feature.coords.map(p=>[p[1],p[0]] as [number,number]),{color:token("--color-text-muted"),weight:2}):feature.geometry?L.polygon(feature.geometry.coordinates.map(r=>r.map(p=>[p[1],p[0]] as [number,number])),{color:token("--color-text-muted"),weight:1,fillOpacity:.08}):null;if(layer){const text=document.createElement("span");text.textContent=feature.name;layer.bindPopup(text);layers.push(layer);}}
   const drawRoute=(s:RouteLine,status?:Segment["status"])=>{const layer=L.polyline(s.coords.map(p=>[p[1],p[0]] as [number,number]),{color:token(status==="remove"?"--color-danger":status==="same"?"--color-info":status==="new"?"--color-success":"--color-brand"),weight:4});const button=document.createElement("button");button.type="button";button.className="ui-button ui-button-secondary";button.textContent=s.name+(status?` · ${statusLabel[status]}`:"");button.onclick=()=>events.current.onRouteSelect?.(s);layer.bindPopup(button).on("click",()=>events.current.onRouteSelect?.(s));layers.push(layer);};
   for(const route of routes.slice(0,5000))drawRoute(route);
   for(const route of segments.slice(0,5000))if(visible[route.status])drawRoute(route,route.status);
   const valid=sites.filter(s=>s.latitude!==null&&s.longitude!==null);
   if(mode==="overview"){
    const groups=new Map<string,MapSite[]>();for(const s of valid){const key=s.province||"ไม่ระบุจังหวัด";groups.set(key,[...(groups.get(key)??[]),s]);}
    for(const [province,rows]of groups){const lat=rows.reduce((n,s)=>n+s.latitude!,0)/rows.length,lng=rows.reduce((n,s)=>n+s.longitude!,0)/rows.length;const marker=L.circleMarker([lat,lng],{radius:Math.min(30,8+Math.sqrt(rows.length)),color:token("--color-brand"),fillOpacity:.5});const text=document.createElement("span");text.textContent=`${province} · ${rows.length} ไซต์ (จุดกึ่งกลางกลุ่ม)`;marker.bindTooltip(text).on("click",()=>map?.fitBounds(L.latLngBounds(rows.map(s=>[s.latitude!,s.longitude!] as [number,number])),{maxZoom:13}));layers.push(marker);}
   }else for(const s of valid){const radius=mode==="density"?Math.min(35,8+Math.sqrt(Number(s.customers)||0)*2):6;const marker=L.circleMarker([s.latitude!,s.longitude!],{radius,color:token(mode==="density"?"--color-warning":"--color-brand"),fillOpacity:mode==="density"?.25:.65});const button=document.createElement("button");button.type="button";button.className="ui-button ui-button-secondary";button.textContent=`${s.code||s.key} · ${s.name}`;button.onclick=()=>events.current.onSiteSelect?.(s);marker.bindPopup(button).on("click",()=>events.current.onSiteSelect?.(s));layers.push(marker);}
   if(layers.length){const group=L.featureGroup(layers).addTo(map);boundsRef.current=group.getBounds();map.fitBounds(boundsRef.current,{padding:[24,24],maxZoom:15});}else boundsRef.current=null;
  }).catch(()=>{if(active)setFailed(true);});
  return()=>{active=false;map?.remove();mapRef.current=null;};
 },[segments,sites,areas,routes,base,showAreas,showReferences,references,visible,mode,fitVersion,themeRevision]);
 useEffect(()=>{const map=mapRef.current;if(!map)return;if(selectedRoute)map.fitBounds(selectedRoute.coords.map(p=>[p[1],p[0]] as [number,number]),{padding:[50,50],maxZoom:16});else if(selectedSite?.latitude!==null&&selectedSite?.latitude!==undefined&&selectedSite.longitude!==null)map.setView([selectedSite.latitude,selectedSite.longitude],15);},[selectedRoute,selectedSite]);
 const controls=<><FormField label="แผนที่พื้นหลัง"><select value={base} onChange={e=>{setBase(e.target.value);setFailed(false);}}><option value="street">ถนน</option><option value="satellite">ภาพถ่ายดาวเทียม</option><option value="none">ไม่ใช้ภาพพื้นหลัง</option></select></FormField><Button onClick={()=>{if(boundsRef.current)mapRef.current?.fitBounds(boundsRef.current,{padding:[24,24],maxZoom:15});else setFitVersion(v=>v+1);}}>พอดีจอ</Button><Button aria-pressed={expanded} onClick={()=>setExpanded(v=>!v)}>{expanded?"ออกจากแผนที่ขยาย":"ขยายแผนที่"}</Button></>;
 return <section className={`ui-map-surface${expanded?" ui-map-expanded":""}`} aria-label={`${title} — พื้นที่ทำงาน`}>
  <div className="ui-map-heading">
  <div className="ui-map-toolbar ui-form-controls"><strong>{title}</strong>{(!toolbarTarget||expanded)&&controls}</div>
  {toolbarTarget&&!expanded&&createPortal(<div className="ui-map-toolbar ui-form-controls">{controls}</div>,toolbarTarget)}
  <div className="ui-map-layers" role="group" aria-label="ชั้นข้อมูลแผนที่">{segments.length>0&&Object.entries(statusLabel).map(([key,text])=><label key={key}><input type="checkbox" checked={visible[key as keyof typeof visible]} onChange={e=>setVisible({...visible,[key]:e.target.checked})}/>{text}</label>)}{areas.length>0&&<label><input type="checkbox" checked={showAreas} onChange={e=>setShowAreas(e.target.checked)}/>ขอบเขต PEA</label>}{loadReferences&&<label><input type="checkbox" checked={showReferences} onChange={e=>setShowReferences(e.target.checked)}/>ถนนและอาคารอ้างอิง</label>}{sites.length>0&&<FormField label="รูปแบบข้อมูลไซต์"><select value={mode} onChange={e=>setMode(e.target.value)}><option value="sites">ตำแหน่งไซต์</option><option value="overview">ภาพรวมตามจังหวัด</option><option value="density">ความหนาแน่นถ่วงน้ำหนักลูกค้า</option></select></FormField>}</div>
  </div>
  <div className={`ui-map-frame${filterOverlay?" ui-map-filter-frame":""}`}><div ref={element} className="ui-map-view" role="region" aria-label={title}/>{filterOverlay}{detail&&<aside ref={detailRef} tabIndex={-1} className="ui-panel ui-map-detail" aria-label="รายละเอียดบนแผนที่" onKeyDown={e=>{if(e.key==="Escape"&&onDetailClose){e.stopPropagation();onDetailClose();}}}>{detail}</aside>}</div>
  {failed&&<p role="status">โหลดภาพพื้นหลังแผนที่ไม่สำเร็จ ยังเลือกข้อมูลบนแผนที่และดูรายการได้</p>}{referenceError&&<p role="alert" className="ui-field-error">{referenceError}</p>}{showReferences&&referenceLimited&&<p>ชั้นอ้างอิงแสดงสูงสุด 5,000 รายการ</p>}
  {!segments.length&&!sites.length&&!routes.length&&<p role="status">ยังไม่มีข้อมูลบนแผนที่ เลือกชุดข้อมูลหรือนำเข้าเพื่อเริ่มทำงาน</p>}{segments.length>5000&&<p>แผนที่แสดง 5,000 ช่วงแรก กรุณากรองเพิ่ม ตารางและรายงานยังใช้ผลตามตัวกรองทั้งหมด</p>}
 </section>;
}
