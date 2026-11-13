import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { z } from "zod";
import Decimal from "decimal.js";
import { getDb, type DatabaseTransaction } from "@/db";
import { runMaterialChange } from "@/lib/material-change";
import { algorithmVersion, analysisOptionsSchema, calculateFees, filterSchema, filterSegments, formulaSchema, routeSchema, siteSchema, sourceSha, summarizeDiff, type Formula, type Segment, type Site } from "./domain";
import { analyzeInWorker } from "./analysis-server";
import { parseUpload, type DatasetKind } from "./import";
import { annotateGeography, type Area } from "./geography";

export class PermissionOutError extends Error {
  constructor(message: string, readonly status = 400) { super(message); }
}
export type Actor = { userId: string; module?: "permission-out"|"site-facility" };
const siteActor=(actor:Actor):Actor=>({...actor,module:"site-facility"});
const capability=(actor:Actor,action:string)=>`${actor.module==="site-facility"?"site_facility":"permission_out"}.${action}`;
const uuid = z.string().uuid();
const json = (value: unknown) => sql`${JSON.stringify(value)}::jsonb`;
async function context<T>(actor: Actor, work: (tx: DatabaseTransaction) => Promise<T>) {
  uuid.parse(actor.userId);
  return getDb().transaction(async tx => {
    await tx.execute(sql`select set_config('app.user_id',${actor.userId},true)`);
    return work(tx);
  });
}
async function permit(tx: DatabaseTransaction, actor: Actor, action: string, owner: string | null = actor.userId, team: string | null = null) {
  const [row] = await tx.execute<{ allowed: boolean }>(sql`select public.pout_access(${capability(actor,action)},${owner}::uuid,${team}::uuid) as allowed`);
  if (!row?.allowed) throw new PermissionOutError("ไม่มีสิทธิ์ดำเนินการ หรือโมดูลยังไม่เปิดใช้งาน", 403);
}
async function change<T>(tx: DatabaseTransaction, actor: Actor, action: string, id: string, metadata: Record<string, unknown>, work: () => Promise<T>) {
  const eventId = randomUUID(),moduleId=actor.module??"permission-out",prefix=moduleId==="site-facility"?"site_facility":"permission_out";
  return runMaterialChange({
    audit: { actorId: actor.userId, moduleId, action, entityType: "permission_out", entityId: id, requestId: eventId, metadata },
    activity: { actorId: actor.userId, ownerId: actor.userId, moduleId, eventType: `${prefix}.${action}.v1`, eventVersion: 1, entityType: "permission_out", entityId: id, occurredAt: new Date(), sourceSystem: "permission_next", sourceEventId: eventId, correlationId: eventId, kpiEligible: false, payload: { id, action } },
    outbox: { topic: `${prefix}.${action}.v1`, aggregateType: "permission_out", aggregateId: id, idempotencyKey: eventId, payload: { id } },
  }, work, tx);
}
export type DatasetView = { id: string; name: string; kind: DatasetKind; activeVersion: string | null; version: number };
export async function listDatasets(actor: Actor) {
  return context(actor, async tx => [...await tx.execute<DatasetView>(sql`select id,name,kind,active_version_id as "activeVersion",version from public.pout_datasets where (kind='sites')=${actor.module==="site-facility"} order by name,id limit 500`)]);
}
export async function listAssignmentTeams(actor:Actor) {
  return context(actor,async tx=>[...await tx.execute<{id:string;name:string}>(sql`select t.id,t.name from public.teams t where t.is_active and (public.is_platform_admin() or exists(select 1 from public.user_teams u where u.team_id=t.id and u.user_id=${actor.userId}) or exists(select 1 from public.user_role_assignments a join public.role_permissions p on p.role_id=a.role_id and p.permission_code=${capability(actor,actor.module==='site-facility'?'dataset.manage':'project.manage')} join public.data_scope_grants g on g.assignment_id=a.id where a.user_id=${actor.userId} and a.valid_from<=now() and (a.valid_until is null or a.valid_until>now()) and g.scope_type='SELECTED_TEAMS' and g.selected_team_id=t.id and (g.permission_code is null or g.permission_code=p.permission_code))) order by t.name limit 500`)]);
}
export async function listReferenceFeatures(actor:Actor) {
  return context(actor,async tx=>{
    const rows=[...await tx.execute<{key:string;name:string;coords?:[number,number][];geometry?:Area["geometry"]}>(sql`select d.id::text||':'||r.source_key as key,r.data->>'name' as name,r.data->'coords' as coords,r.data->'geometry' as geometry from public.pout_datasets d join public.pout_rows r on r.version_id=d.active_version_id where d.kind in ('road','building') order by d.id,r.source_key limit 5001`)];
    return {items:rows.slice(0,5000),limited:rows.length>5000};
  });
}
export async function listPublishedRoutes(actor:Actor){
 return context(actor,async tx=>{
  const rows=[...await tx.execute<{data:z.infer<typeof routeSchema>;versionId:string}>(sql`select r.data,r.version_id as "versionId" from public.pout_datasets d join public.pout_rows r on r.version_id=d.active_version_id where d.kind in ('pea','ufm') and jsonb_typeof(r.data->'coords')='array' order by d.id,r.source_key limit 5001`)];
  return {items:rows.slice(0,5000).map(r=>({...r.data,key:`${r.versionId}:${r.data.key}`})),limited:rows.length>5000};
 });
}
export async function siteFilterOptions(actor:Actor) {
  actor=siteActor(actor);
  return context(actor,async tx=>{
    const rows=await tx.execute<{key:string;values:string[]}>(sql`select field.key,array_agg(distinct field.value order by field.value) as values from public.pout_datasets d join public.pout_rows r on r.version_id=d.active_version_id left join public.pout_site_edits e on e.dataset_id=d.id and e.source_key=r.source_key and e.base_version_id=r.version_id cross join lateral jsonb_each_text(jsonb_build_object('regional',coalesce(e.data,r.data)->>'regional','area',coalesce(e.data,r.data)->>'area','province',coalesce(e.data,r.data)->>'province','grade',coalesce(e.data,r.data)->>'grade','type',coalesce(e.data,r.data)->>'type','owner',coalesce(e.data,r.data)->>'owner')) field where d.kind='sites' and not coalesce(e.archived,false) and public.pout_access('permission_out.site.read',d.owner_id,d.team_id) and field.value<>'' group by field.key`);
    return Object.fromEntries(rows.map(r=>[r.key,r.values.slice(0,2000)]));
  });
}
export async function stageDataset(actor: Actor, input: { datasetId?: string; name: string; kind: DatasetKind;teamId?:string|null }, file: File) {
  if(actor.module && (actor.module==="site-facility") !== (input.kind==="sites"))throw new PermissionOutError("ประเภทชุดข้อมูลไม่ตรงกับโมดูล",403);
  actor=input.kind==="sites"?siteActor(actor):actor;
  const values = z.object({ datasetId: uuid.optional(), name: z.string().trim().min(1).max(200), kind: z.enum(["pea","ufm","road","building","sites"]),teamId:uuid.nullable().default(null) }).parse(input);
  await context(actor, tx => permit(tx, actor, "dataset.manage", null));
  if (values.kind === "sites") await context(actor, tx => permit(tx, actor, "opex.read", null));
  if(!values.datasetId&&values.teamId&&!(await listAssignmentTeams(actor)).some(t=>t.id===values.teamId))throw new PermissionOutError("ไม่มีสิทธิ์เลือกทีมนี้",403);
  const parsed = await parseUpload(file, values.kind);
  return context(actor, async tx => {
    await permit(tx, actor, "dataset.manage", null);
    if (values.kind === "sites") await permit(tx, actor, "opex.read", null);
    let datasetId = values.datasetId ?? randomUUID();
    // Serializes import creation/checksum checks without exposing source rows.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${values.datasetId ? `pout-dataset:${datasetId}` : `pout-name:${actor.userId}:${values.kind}:${values.name}`}))`);
    if (!values.datasetId) {
      await tx.execute(sql`insert into public.pout_datasets(id,name,kind,owner_id,team_id) values(${datasetId},${values.name},${values.kind},${actor.userId},${values.teamId}) on conflict(owner_id,name,kind) do nothing`);
      const [found] = await tx.execute<{id:string}>(sql`select id from public.pout_datasets where owner_id=${actor.userId} and name=${values.name} and kind=${values.kind}`);
      datasetId = found.id;
    }
    const [dataset] = await tx.execute<{ id: string; kind: string; active: string | null }>(sql`select id,kind,active_version_id as active from public.pout_datasets where id=${datasetId} for update`);
    if (!dataset || dataset.kind !== values.kind) throw new PermissionOutError("ไม่พบชุดข้อมูลหรือประเภทไม่ตรงกัน", 404);
    const [existing] = await tx.execute<{ id: string; report: Record<string, unknown> }>(sql`select id,report from public.pout_versions where dataset_id=${datasetId} and checksum=${parsed.checksum} and (id=${dataset.active}::uuid or baseline_version_id is not distinct from ${dataset.active}::uuid) order by created_at desc limit 1`);
    if (existing) return { datasetId, versionId: existing.id, report: existing.report, reused: true };
    const previous = dataset.active ? [...await tx.execute<{ key: string; data: unknown }>(sql`select r.source_key as key, ${values.kind==="sites"?sql`jsonb_build_object('data',r.data,'private',p.data)`:sql`r.data`} as data from public.pout_rows r left join public.pout_private_rows p using(version_id,source_key) where r.version_id=${dataset.active}`)] : [];
    const report = { ...summarizeDiff(previous, parsed.rows.map(r => ({ key: r.key, data: values.kind==="sites"?{ data: r.data, private: r.privateData }:r.data }))), withoutCoordinates: parsed.rows.filter(r => values.kind === "sites" && r.data.latitude === null).length, sourceSha, checksum: parsed.checksum };
    const versionId = randomUUID();
    return change(tx, actor, "dataset.staged", versionId, { datasetId, ...report }, async () => {
      await tx.execute(sql`insert into public.pout_versions(id,dataset_id,checksum,filename,baseline_version_id,report,created_by) values(${versionId},${datasetId},${parsed.checksum},${parsed.filename},${dataset.active},${json(report)},${actor.userId})`);
      for (let start = 0; start < parsed.rows.length; start += 250) {
        const batch = parsed.rows.slice(start, start + 250);
        await tx.execute(sql`insert into public.pout_rows(version_id,source_key,data) select ${versionId},x.key,x.data from jsonb_to_recordset(${json(batch)}) as x(key text,data jsonb)`);
        await tx.execute(sql`insert into public.pout_private_rows(version_id,source_key,data) select ${versionId},x.key,x."privateData" from jsonb_to_recordset(${json(batch)}) as x(key text,"privateData" jsonb)`);
      }
      await tx.execute(sql`insert into public.pout_source_files(version_id,contents) values(${versionId},${parsed.buffer})`);
      return { datasetId, versionId, report, reused: false };
    });
  });
}
export async function listVersions(actor: Actor, datasetId: string) {
  uuid.parse(datasetId);
  return context(actor, async tx => { await permit(tx, actor, "dataset.manage", null); return [...await tx.execute<{ id: string; state: string; filename: string; report: Record<string, unknown>; createdAt: string }>(sql`select id,state,filename,report,created_at::text as "createdAt" from public.pout_versions where dataset_id=${datasetId} and exists(select 1 from public.pout_datasets d where d.id=dataset_id and (d.kind='sites')=${actor.module==="site-facility"}) order by created_at desc,id limit 100`)]; });
}
export async function downloadSourceFile(actor:Actor,versionId:string) {
  uuid.parse(versionId);
  return context(actor,async tx=>{
    await permit(tx,actor,"dataset.manage",null);if(actor.module==="site-facility")await permit(tx,actor,"opex.read",null);
    const [file]=await tx.execute<{filename:string;contents:Buffer}>(sql`select v.filename,f.contents from public.pout_source_files f join public.pout_versions v on v.id=f.version_id where v.id=${versionId} and exists(select 1 from public.pout_datasets d where d.id=v.dataset_id and (d.kind='sites')=${actor.module==="site-facility"})`);
    if(!file)throw new PermissionOutError("ไม่พบไฟล์ต้นฉบับ",404);
    return change(tx,actor,"source.downloaded",versionId,{},async()=>file);
  });
}
export async function publishDataset(actor: Actor, datasetId: string, versionId: string, expectedVersion: number) {
  uuid.parse(datasetId); uuid.parse(versionId); z.number().int().positive().parse(expectedVersion);
  return context(actor, async tx => {
    await permit(tx, actor, "dataset.publish", null);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`pout-dataset:${datasetId}`}))`);
    const [dataset] = await tx.execute<{ active: string | null; version: number }>(sql`select active_version_id as active,version from public.pout_datasets where id=${datasetId} and (kind='sites')=${actor.module==="site-facility"} for update`);
    if (!dataset) throw new PermissionOutError("ไม่พบชุดข้อมูล", 404);
    if (dataset.active === versionId) return { published: true };
    if (dataset.version !== expectedVersion) throw new PermissionOutError("ชุดข้อมูลถูกเปลี่ยนแล้ว กรุณาโหลดใหม่", 409);
    const [version] = await tx.execute<{ state: string; baseline: string | null }>(sql`select state,baseline_version_id as baseline from public.pout_versions where id=${versionId} and dataset_id=${datasetId}`);
    if (!version || (version.state === "staging" && version.baseline !== dataset.active)) throw new PermissionOutError("ข้อมูลฐานเปลี่ยนหลังนำเข้า กรุณาตรวจความต่างใหม่", 409);
    return change(tx, actor, version.state === "archived" ? "dataset.rolled_back" : "dataset.published", versionId, { datasetId, previousVersion: dataset.active }, async () => {
      if (dataset.active) await tx.execute(sql`update public.pout_versions set state='archived' where id=${dataset.active}`);
      await tx.execute(sql`update public.pout_versions set state='published' where id=${versionId}`);
      await tx.execute(sql`update public.pout_datasets set active_version_id=${versionId},version=version+1 where id=${datasetId}`);
      return { published: true };
    });
  });
}
export async function listFormulas(actor: Actor) {
  return context(actor, async tx => [...await tx.execute<{ id: string; parameters: Formula }>(sql`select id,parameters from public.pout_formulas order by created_at desc,id limit 100`)]);
}
export async function createFormula(actor: Actor, input: unknown) {
  const formula = formulaSchema.parse(input), id = randomUUID();
  return context(actor, async tx => { await permit(tx, actor, "formula.manage", null); return change(tx, actor, "formula.created", id, { formula }, async () => { await tx.execute(sql`insert into public.pout_formulas(id,parameters,created_by) values(${id},${json(formula)},${actor.userId})`); return { id }; }); });
}
export const analysisInputSchema = z.object({ title: z.string().trim().min(1).max(200),teamId:uuid.nullable().default(null),sourceProjectId:uuid.nullable().default(null), baseVersions: z.array(uuid).max(30).default([]), compareVersions: z.array(uuid).max(30).default([]), options: analysisOptionsSchema, idempotencyKey: uuid });
export type ProjectSnapshot = { sourceSha: string; algorithmVersion: string; inputDigest: string; sourceLines: {base:z.infer<typeof routeSchema>[];compare:z.infer<typeof routeSchema>[]}; options: z.infer<typeof analysisOptionsSchema>; baseVersions: string[]; compareVersions: string[]; files: { filename: string; checksum: string; side: string }[]; segments: Segment[]; areas: Area[]; formula: { id: string; parameters: Formula } | null };
export async function runAnalysis(actor: Actor, raw: unknown, baseFiles: File[] = [], compareFiles: File[] = []) {
  const input = analysisInputSchema.parse(raw);
  if (baseFiles.length + compareFiles.length > 20) throw new PermissionOutError("เลือกได้สูงสุด 20 ไฟล์");
  await context(actor, tx => permit(tx, actor, "analysis.run",actor.userId,input.teamId));
  if(input.teamId && !(await listAssignmentTeams(actor)).some(t=>t.id===input.teamId))throw new PermissionOutError("ไม่มีสิทธิ์มอบโครงการให้ทีมที่เลือก",403);
  const uploads:{rows:Awaited<ReturnType<typeof parseUpload>>["rows"];checksum:string;filename:string;side:string}[]=[];
  let uploadPoints=0,uploadRows=0;
  for(const {file,side} of [...baseFiles.map(file=>({file,side:"base"})),...compareFiles.map(file=>({file,side:"compare"}))]){
    const parsed=await parseUpload(file,"ufm");uploadRows+=parsed.rows.length;uploadPoints+=parsed.rows.reduce((n,r)=>n+(Array.isArray(r.data.coords)?r.data.coords.length:0),0);
    if(uploadRows>20000||uploadPoints>500000)throw new PermissionOutError("ข้อมูลรวมเกิน 20,000 เส้นทางหรือ 500,000 จุด กรุณาแบ่งชุดข้อมูล");
    uploads.push({rows:parsed.rows,checksum:parsed.checksum,filename:parsed.filename,side});
  }
  const inputDigest = createHash("sha256").update(JSON.stringify({input,files:uploads.map(u=>({checksum:u.checksum,side:u.side}))})).digest("hex");
  return context(actor, async tx => {
    await permit(tx, actor, "analysis.run",actor.userId,input.teamId); await permit(tx, actor, "project.manage",actor.userId,input.teamId);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`pout-analysis:${actor.userId}:${input.idempotencyKey}`}))`);
    const [existing] = await tx.execute<{ id: string; digest:string }>(sql`select id,snapshot->>'inputDigest' as digest from public.pout_projects where owner_id=${actor.userId} and idempotency_key=${input.idempotencyKey}`);
    if (existing) { if(existing.digest!==inputDigest)throw new PermissionOutError("รหัสคำขอเดิมถูกใช้กับข้อมูลอื่น กรุณาสร้างคำขอใหม่",409); return { id: existing.id }; }
    const [sourceProject]=input.sourceProjectId?await tx.execute<{snapshot:ProjectSnapshot}>(sql`select snapshot from public.pout_projects where id=${input.sourceProjectId} and not archived`):[];
    if(input.sourceProjectId&&!sourceProject)throw new PermissionOutError("ไม่พบโครงการต้นทางหรือไม่มีสิทธิ์",403);
    let loadedRows=uploadRows,loadedPoints=uploadPoints;
    const load = async (ids: string[], side: string) => {
      const data: unknown[] = uploads.filter(u => u.side === side).flatMap(u => u.rows.map(row => ({...row.data,key:`upload:${u.checksum.slice(0,16)}:${row.key}`})));
      if(sourceProject)data.push(...(side==="base"?sourceProject.snapshot.sourceLines.base:sourceProject.snapshot.sourceLines.compare));
      for (const id of ids) {
        const [allowed] = await tx.execute<{ id: string }>(sql`select v.id from public.pout_versions v join public.pout_datasets d on d.id=v.dataset_id where v.id=${id} and d.active_version_id=v.id and d.kind in ('pea','ufm')`);
        if (!allowed) throw new PermissionOutError("ชุดข้อมูลที่เลือกไม่พร้อมใช้งานหรือไม่มีสิทธิ์", 403);
        const [size]=await tx.execute<{count:number;points:number}>(sql`select count(*)::int as count,coalesce(sum(jsonb_array_length(data->'coords')),0)::int as points from public.pout_rows where version_id=${id} and data?'coords'`);
        loadedRows+=size.count;loadedPoints+=size.points;if(loadedRows>20000||loadedPoints>500000)throw new PermissionOutError("ข้อมูลรวมเกินขีดจำกัด กรุณาแบ่งชุดข้อมูล");
        const rows = await tx.execute<{ data: Record<string,unknown> }>(sql`select data from public.pout_rows where version_id=${id} order by source_key`); data.push(...rows.map(r => ({...r.data,key:`version:${id}:${String(r.data.key)}`})));
      }
      return data.filter(d => d && typeof d === "object" && "coords" in d).map(d => routeSchema.parse(d));
    };
    const base = await load(input.baseVersions, "base"), compare = await load(input.compareVersions, "compare");
    if (!base.length && !compare.length) throw new PermissionOutError("เลือกไฟล์หรือชุดข้อมูลเส้นทางอย่างน้อยหนึ่งชุด");
    if (base.length + compare.length > 20000) throw new PermissionOutError("จำนวนเส้นทางเกิน 20,000 กรุณาแบ่งชุดข้อมูล");
    if([...base,...compare].reduce((n,line)=>n+line.coords.length,0)>500000)throw new PermissionOutError("จำนวนพิกัดเกิน 500,000 จุด กรุณาแบ่งชุดข้อมูล");
    const [formula] = await tx.execute<{ id: string; parameters: Formula }>(sql`select id,parameters from public.pout_formulas where (parameters->>'effectiveFrom')::timestamptz<=now() order by (parameters->>'effectiveFrom')::timestamptz desc,created_at desc,id limit 1`);
    const areaRows = await tx.execute<{ data: Area }>(sql`select r.data||jsonb_build_object('key',d.id::text||':'||r.source_key) as data from public.pout_rows r join public.pout_datasets d on d.active_version_id=r.version_id where d.kind='pea' and r.data->'geometry'->>'type'='Polygon' limit 2001`);
    if(areaRows.length>2000)throw new PermissionOutError("พื้นที่อ้างอิงเกิน 2,000 แห่ง กรุณาแบ่งชุดข้อมูลก่อนวิเคราะห์");
    const areas = areaRows.map(r => r.data);
    const segments = annotateGeography(await analyzeInWorker(base, compare, input.options),areas);
    const matched = new Set(segments.flatMap(s => s.peaAreas?.map(a => a.key) ?? []));
    const snapshot: ProjectSnapshot = { sourceSha, algorithmVersion, inputDigest, sourceLines:{base,compare}, ...input, files: [...(sourceProject?.snapshot.files??[]),...uploads.map(u => ({ filename: u.filename, checksum: u.checksum, side: u.side }))], segments, areas: areas.filter(a => matched.has(a.key)), formula: formula ?? null };
    const id = randomUUID();
    return change(tx, actor, "analysis.completed", id, { inputDigest: createHash("sha256").update(JSON.stringify(input)).digest("hex"), segments: snapshot.segments.length }, async () => {
      await tx.execute(sql`insert into public.pout_projects(id,title,owner_id,team_id,snapshot,idempotency_key) values(${id},${input.title},${actor.userId},${input.teamId},${json(snapshot)},${input.idempotencyKey})`);
      return { id };
    });
  });
}
export type ProjectView = { id: string; title: string; ownerId: string; teamId: string | null; version: number; snapshot: ProjectSnapshot; createdAt: string };
export async function getProject(actor: Actor, id: string, rawFilter: unknown = {}) {
  uuid.parse(id); const filter = filterSchema.parse(rawFilter);
  return context(actor, async tx => {
    const [project] = await tx.execute<ProjectView>(sql`select id,title,owner_id as "ownerId",team_id as "teamId",version,snapshot,created_at::text as "createdAt" from public.pout_projects where id=${id} and not archived`);
    if (!project) throw new PermissionOutError("ไม่พบโครงการหรือไม่มีสิทธิ์", 404);
    const segments = filterSegments(project.snapshot.segments, filter);
    const areaKeys=new Set(segments.flatMap(s=>s.peaAreas?.map(a=>a.key)??[]));
    return { ...project, snapshot: { ...project.snapshot, segments,areas:project.snapshot.areas.filter(a=>areaKeys.has(a.key)) }, fee: project.snapshot.formula ? calculateFees(segments, project.snapshot.formula.parameters) : null, totalSegments: project.snapshot.segments.length };
  });
}
export async function listProjects(actor: Actor, q = "", page = 1) {
  z.number().int().min(1).max(100000).parse(page);
  return context(actor, async tx => [...await tx.execute<{ id: string; title: string; createdAt: string; total: number }>(sql`select id,title,created_at::text as "createdAt",count(*) over()::int as total from public.pout_projects where not archived and title ilike ${`%${q.slice(0, 200).replace(/[\\%_]/g, "\\$&")}%`} order by created_at desc,id limit 50 offset ${(page - 1) * 50}`)]);
}
export async function archiveProject(actor:Actor,id:string,expectedVersion:number) {
  uuid.parse(id);z.number().int().positive().parse(expectedVersion);
  return context(actor,async tx=>{
    const [project]=await tx.execute<{owner:string;team:string|null;version:number}>(sql`select owner_id as owner,team_id as team,version from public.pout_projects where id=${id} and not archived for update`);
    if(!project)throw new PermissionOutError("ไม่พบโครงการ",404);
    await permit(tx,actor,"project.manage",project.owner,project.team);
    if(project.version!==expectedVersion)throw new PermissionOutError("ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่",409);
    return change(tx,actor,"project.archived",id,{},async()=>{await tx.execute(sql`update public.pout_projects set archived=true,version=version+1 where id=${id}`);return {archived:true};});
  });
}
export const siteQuerySchema = z.object({ sourceKey:z.string().max(200).optional(), datasetId: uuid.optional(), q: z.string().max(200).default(""), regional: z.string().max(100).default(""), area: z.string().max(100).default(""), province: z.string().max(100).default(""), grade: z.string().max(100).default(""), type: z.string().max(100).default(""), owner: z.string().max(200).default(""), groupBy: z.enum(["province","area","owner","grade","type"]).default("province"), page: z.coerce.number().int().min(1).max(100000).default(1) });
type SiteRow = { datasetId: string;baseVersion:string; key: string; data: Site; editVersion: number; opex: string | null };
export async function listSites(actor: Actor, raw: unknown = {}, exportAll = false, mapAll = false) {
  actor=siteActor(actor);
  const query = siteQuerySchema.parse(raw);
  return context(actor, async tx => {
    const conditions = [sql`d.kind='sites'`, sql`not coalesce(e.archived,false)`, sql`public.pout_access('permission_out.site.read',d.owner_id,d.team_id)`];
    if (query.datasetId) conditions.push(sql`d.id=${query.datasetId}`);
    if(query.sourceKey)conditions.push(sql`r.source_key=${query.sourceKey}`);
    const data = sql`coalesce(e.data,r.data)`;
    for (const key of ["regional","area","province","grade","type","owner"] as const) if (query[key]) conditions.push(sql`${data}->>${key}=${query[key]}`);
    if (query.q) conditions.push(sql`(${data}->>'name' ilike ${`%${query.q.replace(/[\\%_]/g, "\\$&")}%`} or ${data}->>'code' ilike ${`%${query.q.replace(/[\\%_]/g, "\\$&")}%`} or r.source_key ilike ${`%${query.q.replace(/[\\%_]/g, "\\$&")}%`})`);
    const where = sql.join(conditions, sql` and `);
    if (exportAll) {
      const [allowed] = await tx.execute<{ok:boolean}>(sql`select public.pout_access('site_facility.report.export',${actor.userId}::uuid) or exists(select 1 from public.pout_datasets d where public.pout_access('site_facility.report.export',d.owner_id,d.team_id)) as ok`);
      if (!allowed?.ok) throw new PermissionOutError("ไม่มีสิทธิ์ส่งออก",403);
      conditions.push(sql`public.pout_access('site_facility.report.export',d.owner_id,d.team_id)`);
    }
    const from = sql`from public.pout_datasets d join public.pout_rows r on r.version_id=d.active_version_id left join public.pout_site_edits e on e.dataset_id=d.id and e.source_key=r.source_key and e.base_version_id=r.version_id left join public.pout_private_rows p on p.version_id=r.version_id and p.source_key=r.source_key left join public.pout_site_finance_edits f on f.dataset_id=d.id and f.source_key=r.source_key and f.base_version_id=r.version_id`;
    const amount=sql`case when f.source_key is not null then f.opex else (p.data->>'opex')::numeric end`;
    const [summary] = await tx.execute<{ total: number; withoutCoordinates: number; yearly: string | null }>(sql`select count(*)::int as total,count(*) filter(where ${data}->>'latitude' is null)::int as "withoutCoordinates",sum(${amount})::text as yearly ${from} where ${where}`);
    const rows = [...await tx.execute<SiteRow>(sql`select d.id as "datasetId",r.version_id as "baseVersion",r.source_key as key,${mapAll ? sql`(${data}-'properties') || '{"properties":{}}'::jsonb` : data} as data,coalesce(e.version,0)::int as "editVersion",${mapAll ? sql`null::text` : sql`(${amount})::text`} as opex ${from} where ${sql.join(conditions, sql` and `)} order by r.source_key,d.id limit ${exportAll ? 20001 : mapAll ? 5000 : 50} offset ${exportAll || mapAll ? 0 : (query.page - 1) * 50}`)];
    if (exportAll && rows.length > 20000) throw new PermissionOutError("ผลลัพธ์เกิน 20,000 รายการ กรุณากรองข้อมูลก่อนส่งออก");
    const [financial] = await tx.execute<{ allowed: boolean }>(sql`select public.pout_access('permission_out.opex.read') as allowed`);
    const groups = financial?.allowed && !mapAll ? [...await tx.execute<{ name: string; count: number; yearly: string }>(sql`select coalesce(${data}->>${query.groupBy},'') as name,count(*)::int as count,coalesce(sum(${amount}),0)::text as yearly ${from} where ${where} group by 1 order by name limit 20001`)] : [];
    return { rows: rows.map(r => ({ ...r, opex: financial?.allowed ? r.opex : null })), total: summary?.total ?? 0, withoutCoordinates: summary?.withoutCoordinates ?? 0, yearly: financial?.allowed && !mapAll ? summary?.yearly ?? "0" : null, monthly: financial?.allowed && !mapAll ? new Decimal(summary?.yearly ?? 0).div(12).toFixed(2) : null, groups, mapLimited: mapAll && (summary?.total ?? 0) > 5000, page: query.page };
  });
}
export async function updateSite(actor: Actor, datasetId: string, key: string, input: unknown, expectedVersion: number, expectedBaseVersion:string,archived = false,opex?:string|null) {
  actor=siteActor(actor);
  uuid.parse(datasetId);uuid.parse(expectedBaseVersion); const parsedSite = siteSchema.parse(input),site={...parsedSite,code:parsedSite.code||parsedSite.key}; z.number().int().min(0).parse(expectedVersion);
  if (site.key !== key) throw new PermissionOutError("เปลี่ยน Site Code ไม่ได้");
  return context(actor, async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock_shared(hashtext(${`pout-dataset:${datasetId}`}))`);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`pout-site:${datasetId}:${key}`}))`);
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`pout-code:${datasetId}:${site.code}`}))`);
    const [dataset] = await tx.execute<{ owner: string; team: string | null; active: string }>(sql`select owner_id as owner,team_id as team,active_version_id as active from public.pout_datasets where id=${datasetId} and kind='sites'`);
    if (!dataset) throw new PermissionOutError("ไม่พบชุดข้อมูลไซต์", 404);
    await permit(tx, actor, "site.read", dataset.owner, dataset.team); await permit(tx, actor, "site.update", dataset.owner, dataset.team);
    if(dataset.active!==expectedBaseVersion)throw new PermissionOutError("มีชุดข้อมูลเวอร์ชันใหม่ กรุณาโหลดข้อมูลไซต์อีกครั้ง",409);
    const [duplicate]=await tx.execute(sql`select r.source_key from public.pout_rows r left join public.pout_site_edits e on e.dataset_id=${datasetId} and e.source_key=r.source_key and e.base_version_id=r.version_id where r.version_id=${dataset.active} and r.source_key<>${key} and not coalesce(e.archived,false) and coalesce(nullif(coalesce(e.data,r.data)->>'code',''),r.source_key)=${site.code} limit 1`);
    if(duplicate)throw new PermissionOutError("Site Code ซ้ำกับไซต์อื่นในเวอร์ชันนี้",409);
    const [original] = await tx.execute<{ data: Site }>(sql`select data from public.pout_rows where version_id=${dataset.active} and source_key=${key}`);
    if (!original) throw new PermissionOutError("ไม่พบไซต์", 404);
    const [edit] = await tx.execute<{ version: number;data:Site }>(sql`select version,data from public.pout_site_edits where dataset_id=${datasetId} and source_key=${key} and base_version_id=${dataset.active} for update`);
    if ((edit?.version ?? 0) !== expectedVersion) throw new PermissionOutError("ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่", 409);
    if(opex!==undefined){z.string().regex(/^\d{1,12}(?:\.\d{1,2})?$/).nullable().parse(opex);await permit(tx,actor,"opex.read",null);}
    const before=edit?.data??original.data;
    return change(tx, actor, archived ? "site.archived" : "site.updated", datasetId, { key, expectedVersion,baseVersion:dataset.active,before:{...before,properties:undefined},after:{...site,properties:undefined},opexChanged:opex!==undefined }, async () => {
      await tx.execute(sql`insert into public.pout_site_edits(dataset_id,source_key,base_version_id,data,version,archived,changed_by) values(${datasetId},${key},${dataset.active},${json({ ...site, properties: original.data.properties })},${expectedVersion + 1},${archived},${actor.userId}) on conflict(dataset_id,source_key,base_version_id) do update set data=excluded.data,version=excluded.version,archived=excluded.archived,changed_by=excluded.changed_by,changed_at=now()`);
      if(opex!==undefined)await tx.execute(sql`insert into public.pout_site_finance_edits(dataset_id,source_key,base_version_id,opex,changed_by,history) values(${datasetId},${key},${dataset.active},${opex},${actor.userId},jsonb_build_array(jsonb_build_object('actor',${actor.userId}::text,'at',now(),'value',${opex}::text))) on conflict(dataset_id,source_key,base_version_id) do update set opex=excluded.opex,changed_by=excluded.changed_by,history=pout_site_finance_edits.history||excluded.history`);
      if(site.remark&&site.remark!==before.remark&&!archived){const [canComment]=await tx.execute<{ok:boolean}>(sql`select public.pout_access('permission_out.comment.create',${dataset.owner}::uuid,${dataset.team}::uuid) as ok`);if(canComment?.ok)await tx.execute(sql`insert into public.pout_comments(dataset_id,source_key,body,actor_id) values(${datasetId},${key},${`อัปเดตหมายเหตุ: ${site.remark}`.slice(0,2000)},${actor.userId})`);}
      return { version: expectedVersion + 1 };
    });
  });
}
export async function siteComments(actor: Actor, datasetId: string, key: string, body?: string) {
  actor=siteActor(actor);
  uuid.parse(datasetId); z.string().min(1).max(200).parse(key);
  return context(actor, async tx => {
    const [dataset] = await tx.execute<{ owner: string; team: string | null }>(sql`select owner_id as owner,team_id as team from public.pout_datasets d where id=${datasetId} and kind='sites' and exists(select 1 from public.pout_rows r where r.version_id=d.active_version_id and r.source_key=${key})`);
    if (!dataset) throw new PermissionOutError("ไม่พบไซต์", 404);
    await permit(tx, actor, "site.read", dataset.owner, dataset.team);
    if (body !== undefined) {
      const message = z.string().trim().min(1).max(2000).parse(body); await permit(tx, actor, "comment.create", dataset.owner, dataset.team);
      const id = randomUUID();
      await change(tx, actor, "comment.created", id, { datasetId, key }, () => tx.execute(sql`insert into public.pout_comments(id,dataset_id,source_key,body,actor_id) values(${id},${datasetId},${key},${message},${actor.userId})`));
    }
    return [...await tx.execute<{ id: string; body: string; actor: string; createdAt: string }>(sql`select c.id,c.body,p.display_name as actor,c.created_at::text as "createdAt" from public.pout_comments c join public.profiles p on p.id=c.actor_id where dataset_id=${datasetId} and source_key=${key} order by c.created_at desc,c.id limit 100`)];
  });
}
export async function commentNotifications(actor: Actor, markRead = false) {
  actor=siteActor(actor);
  return context(actor, async tx => {
    if (markRead) {
      await tx.execute(sql`insert into public.pout_comment_reads(user_id,dataset_id,seen_at) select ${actor.userId},d.id,now() from public.pout_datasets d where d.kind='sites' and public.pout_access('permission_out.site.read',d.owner_id,d.team_id) on conflict(user_id,dataset_id) do update set seen_at=excluded.seen_at`);
    }
    return [...await tx.execute<{ id:string; datasetId:string; key:string; body:string; createdAt:string }>(sql`select c.id,c.dataset_id as "datasetId",c.source_key as key,c.body,c.created_at::text as "createdAt" from public.pout_comments c join public.pout_datasets d on d.id=c.dataset_id left join public.pout_comment_reads r on r.dataset_id=d.id and r.user_id=${actor.userId} where public.pout_access('permission_out.site.read',d.owner_id,d.team_id) and c.actor_id<>${actor.userId} and c.created_at>coalesce(r.seen_at,'epoch'::timestamptz) and exists(select 1 from public.pout_rows s where s.version_id=d.active_version_id and s.source_key=c.source_key) order by c.created_at desc,c.id limit 100`)];
  });
}
export async function getSite(actor:Actor,datasetId:string,key:string){uuid.parse(datasetId);const rows=await listSites(actor,{datasetId,sourceKey:key});if(!rows.rows[0])throw new PermissionOutError("ไม่พบไซต์",404);return rows.rows[0];}
