"use client";
import Link from "next/link";
import {useCallback,useEffect,useRef,useState,type FormEvent} from "react";
import {useSearchParams} from "next/navigation";
import {PageHeader} from "@/components/ui/page-header";
import {DatasetWorkspace} from "@/components/map-workspace/dataset-workspace";
import {NetworkMap,type MapSite} from "@/components/map-workspace/network-map";
import {styles,Field,ErrorMessage,Button,readWorkspaceApi} from "@/components/map-workspace/ui";
import type {Site,RouteLine} from "@/modules/permission-out/domain";
const api="/api/site-facility/";
const readApi=<T,>(path:string,init?:RequestInit)=>readWorkspaceApi<T>(api,path,init);
const post=<T,>(path:string,value:unknown)=>readApi<T>(path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(value)});
type SiteResult={rows:{datasetId:string;baseVersion:string;key:string;data:Site;editVersion:number;opex:string|null}[];total:number;withoutCoordinates:number;yearly:string|null;monthly:string|null;groups:{name:string;count:number;yearly:string}[];page:number};
export function SiteFacilityWorkspace({view="sites",permissions,canViewRoutes=false}:{view?:string;permissions:string[];canViewRoutes?:boolean}){
 const can=(code:string)=>permissions.includes("*")||permissions.includes(`site_facility.${code}`);
 return <main className={styles.workspace} data-ui-screen="site-facility">
  <PageHeader title={view==="datasets"?"ชุดข้อมูล Site Facility":"Site Facility & Design"} description="MOD 2 — ค้นหาและทำงานกับโครงสร้างพื้นฐานไซต์บนแผนที่" parent={{label:"ภาพรวม",href:"/"}}/>
  <nav className="ui-tabs" aria-label="ส่วนงาน Site Facility">{[["","แผนที่ไซต์"],["reports","รายงานไซต์"],...(can("dataset.manage")?[["datasets","ชุดข้อมูลไซต์"]]:[])].map(([path,title])=><Link key={path} href={`/site-facility${path?"/"+path:""}`} aria-current={(path||"sites")===view?"page":undefined}>{title}</Link>)}</nav>
  {view==="datasets"?(can("dataset.manage")?<DatasetWorkspace moduleId="site-facility" canPublish={can("dataset.publish")} canDownload={can("opex.read")}/>:<p>คุณไม่มีสิทธิ์จัดการชุดข้อมูลไซต์</p>):<Sites canRead={can("site.read")} canUpdate={can("site.update")} canComment={can("comment.create")} canExport={can("report.export")} canViewRoutes={canViewRoutes} showReport={view==="reports"}/>}
 </main>;
}
function Sites({ canRead, canUpdate, canComment, canExport,canViewRoutes,showReport=false }: { canRead: boolean; canUpdate: boolean; canComment: boolean; canExport: boolean;canViewRoutes:boolean;showReport?:boolean }) {
  const initialParams = useSearchParams();
  const [facets,setFacets]=useState<Record<string,string[]>>({});
  useEffect(()=>{let active=true;readApi<Record<string,string[]>>("site-options").then(r=>{if(active)setFacets(r);}).catch(()=>{});return()=>{active=false;};},[]);
  const [mapRows,setMapRows]=useState<MapSite[]>([]),[mapLimited,setMapLimited]=useState(false);
  const [notices,setNotices]=useState<{id:string;key:string;body:string}[]>([]);
  useEffect(()=>{let active=true;const refresh=()=>readApi<typeof notices>("notifications").then(r=>{if(active)setNotices(r);}).catch(()=>{});void refresh();const timer=setInterval(()=>{if(document.visibilityState==="visible")void refresh();},60000);return()=>{active=false;clearInterval(timer);};},[]);
  const [query, setQuery] = useState<Record<string, string>>({ q: initialParams.get("q") ?? "", page: "1" }), [result, setResult] = useState<SiteResult | null>(null), [error, setError] = useState(""), [busy, setBusy] = useState(false), [selected, setSelected] = useState<SiteResult["rows"][number] | null>(null), [revision, setRevision] = useState(0);
  useEffect(() => { if (!canRead) return; let active = true; Promise.all([readApi<SiteResult>(`sites?${new URLSearchParams(query)}`),readApi<SiteResult & {mapLimited:boolean}>(`sites/map?${new URLSearchParams(query)}`)]).then(([r,m]) => { if (active) { setResult(r); setMapRows(m.rows.map(row=>({...row.data,datasetId:row.datasetId})));setMapLimited(m.mapLimited);setError(""); } }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(false); }); return () => { active = false; }; }, [query, revision, canRead]);
  const [focused,setFocused]=useState<MapSite|null>(null),[routes,setRoutes]=useState<RouteLine[]>([]),[showRoutes,setShowRoutes]=useState(false),[routeError,setRouteError]=useState("");
  useEffect(()=>{if(!showRoutes||!canViewRoutes)return;let active=true;readWorkspaceApi<{items:RouteLine[]}>("/api/permission-out/","network").then(r=>{if(active){setRoutes(r.items);setRouteError("");}}).catch(()=>{if(active)setRouteError("โหลดเส้นทาง MOD 1 ไม่สำเร็จ กรุณาตรวจสิทธิ์หรือเปิดใช้งานโมดูล");});return()=>{active=false;};},[showRoutes,canViewRoutes]);
  const openSite=useCallback(async(site:MapSite)=>{setFocused(site);try{setSelected(await readApi<SiteResult["rows"][number]>(`sites/${site.datasetId}?${new URLSearchParams({key:site.key})}`));}catch(e){setError((e as Error).message);}},[]);
  if (!canRead) return <p>คุณไม่มีสิทธิ์ดูข้อมูลไซต์</p>;
  return <>
    <div className={styles.workbench}>
      <aside className={styles.sidebar} aria-label="ตัวกรอง Site Facility">
        <h2>ค้นหาและกรองไซต์</h2>
        <div className={styles.columns}>{[["q","ค้นหา Site Code หรือชื่อ"],["regional","ภาค"],["area","พื้นที่"],["province","จังหวัด"],["grade","เกรด"],["type","ประเภท"],["owner","เจ้าของ"]].map(([key, title]) => <Field key={key} label={title}><input list={key==="q"?undefined:`pout-${key}-options`} value={query[key] ?? ""} onChange={e => setQuery({ ...query, [key]: e.target.value, page: "1" })} />{key!=="q"&&<datalist id={`pout-${key}-options`}>{facets[key]?.map(value=><option key={value} value={value}/>)}</datalist>}</Field>)}</div><ErrorMessage error={error} /><details><summary>ความคิดเห็นใหม่ {notices.length >= 100 ? "100+" : notices.length}</summary><ul>{notices.map(n=><li key={n.id}><Button onClick={()=>setQuery({...query,q:n.key,page:"1"})}>{n.key}</Button> {n.body}</li>)}</ul><Button onClick={()=>post<typeof notices>("notifications",{}).then(setNotices).catch(e=>setError(e.message))}>อ่านทั้งหมดแล้ว</Button></details>

        <Button onClick={()=>setQuery({q:"",page:"1"})}>ล้างตัวกรองไซต์</Button>
        {canViewRoutes&&<label><input type="checkbox" checked={showRoutes} onChange={e=>setShowRoutes(e.target.checked)}/>แสดงเส้นทาง PEA / UFM จาก MOD 1</label>}
        <ErrorMessage error={routeError}/>
        {result&&<><p role="status">พบ {result.total.toLocaleString("th-TH")} ไซต์ · ไม่มีพิกัด {result.withoutCoordinates.toLocaleString("th-TH")}</p>{result.yearly !== null && <details open={showReport||undefined}><summary>รายงาน OPEX ตามกลุ่ม</summary><Field label="จัดกลุ่มรายงาน"><select value={query.groupBy ?? "province"} onChange={e=>setQuery({...query,groupBy:e.target.value,page:"1"})}><option value="province">จังหวัด</option><option value="area">พื้นที่</option><option value="owner">เจ้าของ</option><option value="grade">เกรด</option><option value="type">ประเภท</option></select></Field><div className={styles.table}><table className="ui-table"><caption>OPEX รายปีตามตัวกรองทั้งหมด</caption><thead><tr><th scope="col">กลุ่ม</th><th scope="col">ไซต์</th><th scope="col">บาทต่อปี</th></tr></thead><tbody>{result.groups?.map(g=><tr key={g.name}><th scope="row">{g.name || "ไม่ระบุ"}</th><td>{g.count}</td><td>{g.yearly}</td></tr>)}</tbody></table></div></details>}</>}
      </aside>
      <div className={styles.canvas}>
        <NetworkMap title="แผนที่ Site Facility" sites={mapRows} routes={showRoutes?routes:undefined} selectedSite={focused} onSiteSelect={openSite}/>
        <p>เลือกจุดไซต์บนแผนที่หรือรายการด้านล่างเพื่อเปิดรายละเอียด{mapLimited?" · แผนที่แสดงสูงสุด 5,000 ไซต์ กรุณากรองเพิ่ม":""}</p>
        {result?.yearly!==null&&result?.yearly!==undefined&&<p>OPEX รายปี {result.yearly} บาท · รายเดือน {result.monthly} บาท (ตามตัวกรองทั้งหมด)</p>}
        {canExport&&<a className="ui-button ui-button-secondary" href={`${api}sites/export?${new URLSearchParams(query)}`}>ส่งออก CSV ตามตัวกรองทั้งหมด</a>}
      </div>
    </div>
    {result&&<section className={styles.panel} aria-busy={busy}><h2>รายการ Site Facility</h2>      <div className={styles.table} tabIndex={0} role="region" aria-label="รายการไซต์"><table className="ui-table"><caption>Site Facility — หน้า {result.page}</caption><thead><tr>{["Site Code","ชื่อ","จังหวัด","เกรด","ประเภท",...(result.yearly !== null ? ["OPEX รายปี"] : [])].map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{result.rows.map(row => <tr key={`${row.datasetId}:${row.key}`}><th scope="row"><Button className={styles.linkButton} onClick={() => {setFocused({...row.data,datasetId:row.datasetId});setSelected(row);}}>{row.data.code||row.key}</Button></th><td>{row.data.name}</td><td>{row.data.province}</td><td>{row.data.grade}</td><td>{row.data.type}</td>{result.yearly !== null && <td>{row.opex ?? "ไม่ระบุ"}</td>}</tr>)}</tbody></table>{!result.rows.length && <p>ไม่พบไซต์ตามตัวกรอง</p>}</div><div className={styles.actions}><Button disabled={result.page <= 1 || busy} onClick={() => setQuery({ ...query, page: String(result.page - 1) })}>ก่อนหน้า</Button><span>หน้า {result.page} / {Math.max(1, Math.ceil(result.total / 50))}</span><Button disabled={result.page * 50 >= result.total || busy} onClick={() => setQuery({ ...query, page: String(result.page + 1) })}>ถัดไป</Button></div></section>}
        {selected && <SiteDetail row={selected} canUpdate={canUpdate} canComment={canComment} canOpex={result?.yearly!==null} onClose={() => setSelected(null)} onSaved={() => { setSelected(null); setRevision(r => r + 1); }} />}

  </>;
}

function SiteDetail({ row, canUpdate, canComment, canOpex, onClose, onSaved }: { row: SiteResult["rows"][number]; canUpdate: boolean; canComment: boolean;canOpex:boolean; onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), [error, setError] = useState(""), [busy, setBusy] = useState(false), [comments, setComments] = useState<{ id: string; body: string; actor: string }[]>([]);
  const load = useCallback(() => readApi<{ id: string; body: string; actor: string }[]>(`comments/${row.datasetId}?${new URLSearchParams({ key: row.key })}`), [row]);
  useEffect(() => {
    const element=dialog.current,opener=document.activeElement instanceof HTMLElement?document.activeElement:null;
    let active=true;element?.showModal();load().then(rows=>{if(active)setComments(rows);}).catch(e=>{if(active)setError(e.message);});
    return()=>{active=false;if(element?.open)element.close();if(opener?.isConnected)opener.focus();};
  }, [load]);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = new FormData(e.currentTarget); setBusy(true); setError("");
    try { await post(`sites/${row.datasetId}`, { key: row.key, expectedVersion: row.editVersion, baseVersion:row.baseVersion,...(canOpex?{opex:form.get("opex")||null}:{}), site: { ...row.data, ...Object.fromEntries(form), latitude: form.get("latitude") ? Number(form.get("latitude")) : null, longitude: form.get("longitude") ? Number(form.get("longitude")) : null } }); onSaved(); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  async function comment(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const form = e.currentTarget, data = new FormData(form); setBusy(true); try { await post(`comments/${row.datasetId}`, { key: row.key, body: data.get("body") }); setComments(await load()); form.reset(); } catch (err) { setError((err as Error).message); } finally { setBusy(false); } }
  return <dialog ref={dialog} className={styles.dialog} data-dialog-size="wide" onCancel={onClose} onClose={onClose} aria-labelledby="site-title"><div className={styles.actions}><h2 id="site-title">{row.data.code||row.key} — {row.data.name}</h2><Button onClick={onClose} aria-label="ปิดรายละเอียดไซต์">ปิด</Button></div><ErrorMessage error={error} /><form onSubmit={save}><div className={styles.columns}>{[["code","Site Code"],["name","ชื่อไซต์"],["regional","ภาค"],["area","พื้นที่"],["province","จังหวัด"],["grade","เกรด"],["type","Type of Digit"],["siteType","Site Type"],["district","อำเภอ / เขต"],["nodeEquipment","อุปกรณ์โครงข่าย"],["customers","จำนวนลูกค้า"],["remark","หมายเหตุ"],["owner","เจ้าของ"],["latitude","ละติจูด"],["longitude","ลองจิจูด"]].map(([name, title]) => <Field key={name} label={title}><input name={name} defaultValue={String(row.data[name as keyof Site] ?? "")} readOnly={!canUpdate} /></Field>)}{canOpex&&<Field label="OPEX รายปี (บาท)"><input name="opex" defaultValue={row.opex??""} readOnly={!canUpdate} inputMode="decimal" pattern="[0-9]+([.][0-9]{1,2})?"/></Field>}</div>{Object.keys(row.data.properties).length > 0 && <details><summary>ข้อมูลประกอบจากไฟล์</summary><dl>{Object.entries(row.data.properties).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v || "—"}</dd></div>)}</dl></details>}{canUpdate && <Button type="submit" disabled={busy}>บันทึกการแก้ไข</Button>}</form>{canUpdate&&<Button disabled={busy} onClick={async()=>{if(!window.confirm("เก็บไซต์ออกจากรายการของเวอร์ชันนี้ โดยคงข้อมูลต้นฉบับและความคิดเห็นไว้?"))return;setBusy(true);try{await post(`sites/${row.datasetId}`,{key:row.key,site:row.data,expectedVersion:row.editVersion,baseVersion:row.baseVersion,archived:true});onSaved();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}}>เก็บไซต์เข้าประวัติ</Button>}<h3>ความคิดเห็น</h3><ul className={styles.list}>{comments.map(c => <li key={c.id}><p>{c.body}</p><small>{c.actor}</small></li>)}</ul>{canComment && <form onSubmit={comment}><Field label="ความคิดเห็นใหม่"><textarea name="body" required maxLength={2000} /></Field><Button type="submit" disabled={busy}>เพิ่มความคิดเห็น</Button></form>}</dialog>;
}
