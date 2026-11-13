import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { readFile, readdir } from "node:fs/promises";
import { parse } from "dotenv";
import postgres from "postgres";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getDb } from "@/db";
import { createFormula, getProject, listDatasets, listProjects, listSites, publishDataset, runAnalysis, siteComments, siteFilterOptions,stageDataset, updateSite } from "./service";
import JSZip from "jszip";

const enabled = process.env.PERMISSION_OUT_DB_TEST === "1";
const fixtureName = `permission_out_test_${Date.now()}`;
const adminId = randomUUID(), readerId = randomUUID(), otherId = randomUUID(),routeOnlyId=randomUUID();
const teamId=randomUUID();
let operator: postgres.Sql, fixture: postgres.Sql, runtime: postgres.Sql, assignment: string;
let fixtureUrl:URL;
let datasetId: string, versionId: string, stage = "setup";
const admin = { userId: adminId }, reader = { userId: readerId },siteAdmin={userId:adminId,module:"site-facility" as const};
function databaseError(error: unknown): never { throw new Error(`Isolated Permission Out fixture failed at ${stage} (${(error as { code?: string }).code ?? "unknown"})`); }

beforeAll(async () => {
  if (!enabled) return;
  try {
    const env = process.env.PERMISSION_OUT_TEST_OPERATOR_URL ? {} : parse(await readFile(".env.local", "utf8"));
    const elevated = new URL(process.env.PERMISSION_OUT_TEST_OPERATOR_URL || env.DATABASE_URL_MIGRATE);
    if (!["localhost","127.0.0.1"].includes(elevated.hostname) || !/^permission_out_test_\d+$/.test(fixtureName)) throw new Error("Loopback isolated fixture required");
    elevated.pathname = "/postgres"; operator = postgres(elevated.href, { max: 1, onnotice: () => {} });
    await operator.unsafe(`create database ${fixtureName} template template0`);
    elevated.pathname = `/${fixtureName}`;fixtureUrl=new URL(elevated); fixture = postgres(elevated.href, { max: 1, onnotice: () => {} });
    await fixture`create table schema_migrations(name text primary key,applied_at timestamptz not null default now())`;
    for (const migration of (await readdir("supabase/migrations")).filter(n => /^\d.*\.sql$/.test(n)).sort()) { stage = migration; await fixture.begin(async tx => { await tx.unsafe(await readFile(`supabase/migrations/${migration}`, "utf8")); }); }
    stage = "seed";
    for (const id of [adminId,readerId,otherId,routeOnlyId]) { await fixture`insert into profiles(id,email,display_name) values(${id},${id+'@example.test'},'Permission Out fixture')`; await fixture`insert into local_credentials(user_id,password_hash,must_change_password) values(${id},'synthetic-not-loginable',false)`; }
    const [adminRole] = await fixture`select id from roles where code='platform_admin'`;
    await fixture`insert into user_role_assignments(user_id,role_id) values(${adminId},${adminRole.id})`;
    const [role] = await fixture`insert into roles(code,name) values(${`pout-test-${randomUUID()}`},'Permission Out test reader') returning id`;
    for (const capability of ["module.view","site.read","comment.create","report.export"]) await fixture`insert into role_permissions(role_id,permission_code) values(${role.id},${'site_facility.'+capability})`;
    const [assigned] = await fixture`insert into user_role_assignments(user_id,role_id) values(${readerId},${role.id}) returning id`; assignment = assigned.id;
    await fixture`insert into data_scope_grants(assignment_id,scope_type) values(${assignment},'ALL')`;
    await fixture`insert into teams(id,code,name) values(${teamId},${'pout-team-'+randomUUID()},'Synthetic route team')`;
    await fixture`insert into user_teams(user_id,team_id) values(${otherId},${teamId})`;
    const [teamRole]=await fixture`insert into roles(code,name) values(${'pout-team-role-'+randomUUID()},'Synthetic team writer') returning id`;
    for(const cap of ['module.view','analysis.run','project.manage'])await fixture`insert into role_permissions(role_id,permission_code) values(${teamRole.id},${'permission_out.'+cap})`;
    const [teamAssignment]=await fixture`insert into user_role_assignments(user_id,role_id) values(${otherId},${teamRole.id}) returning id`;
    await fixture`insert into data_scope_grants(assignment_id,scope_type) values(${teamAssignment.id},'TEAM')`;
    await fixture`insert into core_module_settings(module_id,enabled,changed_by) values('permission-out',true,${adminId}),('site-facility',true,${adminId})`;
    const [routeRole]=await fixture`insert into roles(code,name) values(${"pout-route-only-"+randomUUID()},'Route-only data administrator') returning id`;
    for(const cap of ["module.view","dataset.manage","dataset.publish","report.export","site.read","opex.read"])await fixture`insert into role_permissions(role_id,permission_code) values(${routeRole.id},${"permission_out."+cap})`;
    const [routeGrant]=await fixture`insert into user_role_assignments(user_id,role_id) values(${routeOnlyId},${routeRole.id}) returning id`;
    await fixture`insert into data_scope_grants(assignment_id,scope_type) values(${routeGrant.id},'ALL')`;
    runtime = postgres(elevated.href, { max: 3, prepare: false, connection: { options: "-c role=permission_core_runtime" }, onnotice: () => {} });
    (globalThis as typeof globalThis & { permissionNextSql?: postgres.Sql }).permissionNextSql = runtime;
    process.env.DATABASE_URL = elevated.href;
  } catch (error) { databaseError(error); }
}, 120000);
afterAll(async () => {
  if (!operator) return;
  await runtime?.end(); await fixture?.end();
  if (/^permission_out_test_\d+$/.test(fixtureName)) await operator.unsafe(`drop database if exists ${fixtureName} with (force)`);
  await operator.end();
});
async function workbook(code = "SITE-001", opex = "1200", latitude = "") {
  const headers = Array.from({ length: 70 }, (_, i) => i === 0 ? "Site Code" : i === 21 ? "Total OPEX (Yearly)" : `Header ${i}`);
  const cells = Array<string>(70).fill(""); cells[0] = code; cells[5] = "ไซต์จำลอง"; cells[9] = "กรุงเทพมหานคร"; cells[11] = latitude; cells[12] = latitude ? "100.5" : ""; cells[21] = opex;
  const column = (i: number) => i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(64 + Math.floor(i / 26)) + String.fromCharCode(65 + i % 26);
  const row = (values: string[], number: number) => `<row r="${number}">${values.map((v, i) => `<c r="${column(i)}${number}" t="inlineStr"><is><t>${v}</t></is></c>`).join("")}</row>`;
  const zip = new JSZip().file("xl/workbook.xml", '<workbook xmlns:r="r"><sheets><sheet name="Total Site" r:id="rId1"/></sheets></workbook>').file("xl/_rels/workbook.xml.rels", '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>').file("xl/worksheets/sheet1.xml", `<worksheet><sheetData>${row(headers,1)}${row(cells,2)}</sheetData></worksheet>`);
  zip.forEach((_path, entry) => { entry.date = new Date("2020-01-01T00:00:00Z"); });
  return new File([Uint8Array.from(await zip.generateAsync({ type: "uint8array" })).buffer], "sites.xlsx");
}
describe.skipIf(!enabled)("Permission Out real PostgreSQL with constrained runtime and synthetic data", () => {
  it("stages immutable private input, keeps active data empty and publishes atomically", async () => {
    const staged = await stageDataset(admin, { name: "Synthetic sites", kind: "sites" }, await workbook()); datasetId = staged.datasetId; versionId = staged.versionId;
    expect(staged.report).toMatchObject({ added: 1, withoutCoordinates: 1 });
    expect((await listSites(admin)).total).toBe(0);
    await publishDataset(siteAdmin, datasetId, versionId, 1);
    expect((await listSites(admin)).yearly).toBe("1200.00");
    const visible = await listSites(reader); expect(visible.rows).toHaveLength(1); expect(visible.rows[0].data.latitude).toBeNull();
    expect((await siteFilterOptions(reader)).province).toContain("กรุงเทพมหานคร");
    expect(visible.yearly).toBeNull(); expect(JSON.stringify(visible)).not.toContain("1200"); expect(JSON.stringify(visible)).not.toContain("OPEX");
  });
  it("reuses checksummed imports and preserves comments across publish and rollback", async () => {
    await siteComments(reader, datasetId, "SITE-001", "ความคิดเห็นจำลอง");
    const same = await stageDataset(admin, { datasetId, name: "Synthetic sites", kind: "sites" }, await workbook()); expect(same.reused).toBe(true); expect(same.versionId).toBe(versionId);
    const next = await stageDataset(admin, { datasetId, name: "Synthetic sites", kind: "sites" }, await workbook("SITE-001", "2400", "13.75"));
    expect(next.report).toMatchObject({ updated: 1, unchanged: 0 });
    await publishDataset(siteAdmin, datasetId, next.versionId, 2);
    expect((await listSites(admin)).yearly).toBe("2400.00");
    expect(await siteComments(reader, datasetId, "SITE-001")).toHaveLength(1);
    await publishDataset(siteAdmin, datasetId, versionId, 3);
    expect((await listSites(admin)).yearly).toBe("1200.00");
  });
  it("rejects cross-scope reads, revoked permissions and disabled modules using live database policy", async () => {
    await fixture`update data_scope_grants set scope_type='OWN' where assignment_id=${assignment}`;
    expect((await listSites(reader)).total).toBe(0);
    await fixture`update data_scope_grants set scope_type='ALL' where assignment_id=${assignment}`;
    await fixture`update core_module_settings set enabled=false where module_id='site-facility'`;
    expect(await listDatasets(reader)).toHaveLength(0);
    await expect(siteComments(reader, datasetId, "SITE-001", "forbidden")).rejects.toThrow();
    await fixture`update core_module_settings set enabled=true where module_id='site-facility'`;
    await fixture`update local_credentials set must_change_password=true where user_id=${readerId}`;
    expect((await listSites(reader)).total).toBe(0);
    await fixture`update local_credentials set must_change_password=false where user_id=${readerId}`;
    const [readerRole]=await fixture`select role_id from user_role_assignments where id=${assignment}`;
    await fixture`delete from role_permissions where role_id=${readerRole.role_id} and permission_code='site_facility.site.read'`;
    await runtime.begin(async tx=>{await tx`select set_config('app.user_id',${readerId},true)`;expect(await tx`select * from pout_rows where version_id=${versionId}`).toHaveLength(0);});
    await fixture`insert into role_permissions(role_id,permission_code) values(${readerRole.role_id},'site_facility.site.read')`;
  });
  it("separates module enablement, catalogs and dataset administration without copying legacy site grants",async()=>{
    const routeActor={userId:routeOnlyId};
    expect((await listSites(routeActor)).total).toBe(0);
    await expect(stageDataset(routeActor,{name:"Forbidden site",kind:"sites"},await workbook())).rejects.toThrow();
    await expect(publishDataset(routeActor,datasetId,versionId,4)).rejects.toThrow();
    const staged=await stageDataset(routeActor,{name:"Published route fixture",kind:"pea"},new File(['<kml><Placemark><name>Reference route</name><LineString><coordinates>100,13 100.001,13</coordinates></LineString></Placemark></kml>'],"reference.kml"));
    await publishDataset(routeActor,staged.datasetId,staged.versionId,1);
    expect((await listDatasets(routeActor)).map(d=>d.kind)).not.toContain("sites");
    expect(await listDatasets({...reader,module:"permission-out"})).toHaveLength(0);
    expect((await listDatasets({...reader,module:"site-facility"})).every(d=>d.kind==="sites")).toBe(true);
    await fixture`update core_module_settings set enabled=false where module_id='permission-out'`;
    expect((await listSites(reader)).total).toBe(1);
    expect(await listDatasets(routeActor)).toHaveLength(0);
    await fixture`update core_module_settings set enabled=true where module_id='permission-out'`;
    await fixture`update core_module_settings set enabled=false where module_id='site-facility'`;
    expect((await listSites(reader)).total).toBe(0);
    expect(await listDatasets(routeActor)).toHaveLength(1);
    await fixture`update core_module_settings set enabled=true where module_id='site-facility'`;
    await runtime.begin(async tx=>{await tx`select set_config('app.user_id',${routeOnlyId},true)`;expect(await tx`select * from pout_rows where version_id=${versionId}`).toHaveLength(0);expect(await tx`select * from pout_private_rows where version_id=${versionId}`).toHaveLength(0);});
    await expect(runtime.begin(async tx=>{await tx`select set_config('app.user_id',${routeOnlyId},true)`;await tx`update pout_datasets set kind='sites' where id=${staged.datasetId}`;})).rejects.toThrow();
  });
  it("requires update capability and rejects stale edits", async () => {
    const { rows } = await listSites(admin), row = rows[0];
    await expect(updateSite(reader, datasetId, row.key, row.data, 0,row.baseVersion)).rejects.toThrow();
    await updateSite(admin, datasetId, row.key, { ...row.data, name: "เปลี่ยนชื่อจำลอง",code:"ALIAS-001" }, 0,row.baseVersion);
    expect((await listSites(admin,{q:"ALIAS-001"})).total).toBe(1);
    await expect(updateSite(admin, datasetId, row.key, row.data, 0,row.baseVersion)).rejects.toThrow(/เปลี่ยน/);
    await updateSite(admin,datasetId,row.key,{...row.data,remark:"หมายเหตุจำลอง",customers:3},1,row.baseVersion,false,"1800.00");
    expect((await listSites(admin)).yearly).toBe("1800.00");expect((await listSites(reader)).yearly).toBeNull();
    expect((await siteComments(reader,datasetId,row.key)).some(c=>c.body.includes("หมายเหตุจำลอง"))).toBe(true);
  });
  it("persists exact formula snapshots and retry-safe scoped analysis with transactional events", async () => {
    await createFormula(admin, { name: "Synthetic approved policy", polesPerKm: "29", rate: "2.8", surchargePercent: "5", effectiveFrom: "2020-01-01T00:00:00Z", rounding: "summary_half_up_2" });
    const file = new File(['<kml><Placemark><name>Test route</name><ExtendedData><Data name="diameter"><value>10</value></Data></ExtendedData><LineString><coordinates>100,13 100.001,13</coordinates></LineString></Placemark></kml>'], "route.kml");
    const input = { title: "Synthetic route", options: { threshold: 5, interval: 5, dedupe: false }, idempotencyKey: randomUUID() };
    const project = await runAnalysis(admin, input, [file]);
    expect(await runAnalysis(admin, input, [file])).toEqual(project);
    await expect(runAnalysis(admin,{...input,title:"changed"},[file])).rejects.toThrow(/รหัสคำขอ/);
    expect(await listProjects(admin)).toHaveLength(1);
    const result = await getProject(admin, project.id); expect(result.snapshot.formula?.parameters.rate).toBe("2.8"); expect(result.fee?.total).toBeTruthy();
    await expect(getProject({ userId: otherId }, project.id)).rejects.toThrow();
    const [audit] = await fixture`select count(*)::int as count from audit_logs where module_id='permission-out' and entity_id=${project.id}`;
    const [activity] = await fixture`select count(*)::int as count from activity_events where module_id='permission-out' and entity_id=${project.id}`;
    expect(audit.count).toBe(1); expect(activity.count).toBe(1);
    const clone=await runAnalysis(admin,{...input,idempotencyKey:randomUUID(),sourceProjectId:project.id,title:"วิเคราะห์ใหม่จากผลเดิม"});
    expect(clone.id).not.toBe(project.id);expect((await getProject(admin,clone.id)).snapshot.segments).toEqual(result.snapshot.segments);
  });
  it("denies direct source/OPEX reads and immutable-row writes at the database boundary", async () => {
    await runtime.begin(async tx => { await tx`select set_config('app.user_id',${readerId},true)`; expect(await tx`select * from pout_private_rows`).toHaveLength(0); expect(await tx`select * from pout_source_files`).toHaveLength(0); });
    await expect(runtime.begin(async tx => { await tx`select set_config('app.user_id',${adminId},true)`; await tx`update pout_rows set data='{}'::jsonb`; })).rejects.toThrow();
  });
  it("supports team-scoped analysis and formula reads without granting access to personal projects",async()=>{
    const input={title:"Team-only route",teamId,idempotencyKey:randomUUID(),options:{threshold:5,interval:5,dedupe:false}};
    const file=new File(['<kml><Placemark><name>Team route</name><LineString><coordinates>100,13 100.001,13</coordinates></LineString></Placemark></kml>'],'team.kml');
    const project=await runAnalysis({userId:otherId},input,[file]);const result=await getProject({userId:otherId},project.id);
    expect(result.snapshot.formula).not.toBeNull();expect(result.teamId).toBe(teamId);
    await expect(runAnalysis({userId:otherId},{...input,teamId:randomUUID(),idempotencyKey:randomUUID()},[file])).rejects.toThrow();
  });
  it("serializes concurrent publish attempts and requires re-review of the losing staging version",async()=>{
    const [dataset]=await fixture`select version from pout_datasets where id=${datasetId}`;
    const a=await stageDataset(admin,{datasetId,name:"Synthetic sites",kind:"sites"},await workbook("SITE-001","3600"));
    const b=await stageDataset(admin,{datasetId,name:"Synthetic sites",kind:"sites"},await workbook("SITE-001","4800"));
    const results=await Promise.allSettled([publishDataset(siteAdmin,datasetId,a.versionId,dataset.version),publishDataset(siteAdmin,datasetId,b.versionId,dataset.version)]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    expect(results.filter(r=>r.status==='rejected')).toHaveLength(1);
    const loser=results[0].status==='rejected'?a:b;
    const fresh=await stageDataset(admin,{datasetId,name:"Synthetic sites",kind:"sites"},await workbook("SITE-001",loser===a?"3600":"4800"));
    expect(fresh.reused).toBe(false);expect(fresh.versionId).not.toBe(loser.versionId);
    await expect(updateSite(admin,datasetId,"SITE-001",(await listSites(admin)).rows[0].data,0,versionId)).rejects.toThrow(/เวอร์ชันใหม่/);
  });
  it("rolls back the business record when the material audit cannot commit",async()=>{
    const [before]=await fixture`select count(*)::int as count from pout_formulas`;
    await fixture.unsafe("create function pout_fixture_reject_audit() returns trigger language plpgsql as $$ begin if new.module_id='permission-out' then raise exception 'synthetic audit failure';end if;return new;end $$;create trigger pout_fixture_reject_audit before insert on audit_logs for each row execute function pout_fixture_reject_audit()");
    try {await expect(createFormula(admin,{name:"Must roll back",polesPerKm:"29",rate:"1",surchargePercent:"0",effectiveFrom:"2020-01-01T00:00:00Z",rounding:"summary_half_up_2"})).rejects.toThrow();}
    finally {await fixture.unsafe("drop trigger pout_fixture_reject_audit on audit_logs;drop function pout_fixture_reject_audit()");}
    const [after]=await fixture`select count(*)::int as count from pout_formulas`;expect(after.count).toBe(before.count);
  });
  it.skipIf(!process.env.PERMISSION_OUT_BUILD_DIR)("runs production Next pages and real APIs with synthetic sessions and constrained SQL role",async()=>{
    const root=resolve(process.env.PERMISSION_OUT_BUILD_DIR!);
    if(!root.startsWith(resolve(".data/permission-out-build-").slice(0,-1))||!existsSync(resolve(root,".next/BUILD_ID")))throw new Error("Verified isolated build required");
    const role=`pout_browser_${Date.now()}`;
    await operator.unsafe(`create role ${role} login noinherit nosuperuser nocreatedb nocreaterole nobypassrls`);
    await operator.unsafe(`grant permission_core_runtime to ${role} with inherit true,set true`);
    const appUrl=new URL(fixtureUrl);appUrl.username=role;appUrl.password="";
    const token=randomUUID()+randomUUID(),readerToken=randomUUID()+randomUUID();
    for(const [id,value] of [[adminId,token],[readerId,readerToken]])await fixture`insert into auth_sessions(user_id,token_hash,expires_at,last_seen_at) values(${id},${createHash('sha256').update(value).digest('hex')},now()+interval '1 hour',now())`;
    const probe=createServer();const port=await new Promise<number>(done=>probe.listen(0,"127.0.0.1",()=>{const address=probe.address();const p=typeof address==='object'&&address?address.port:0;probe.close(()=>done(p));}));
    const server=spawn(process.execPath,[resolve("node_modules/next/dist/bin/next"),"start","-p",String(port),"-H","127.0.0.1"],{cwd:root,windowsHide:true,stdio:"ignore",env:{...process.env,NODE_ENV:"production",DATABASE_URL:appUrl.href,NEXT_TELEMETRY_DISABLED:"1"}});
    const {chromium}=await import("@playwright/test");let browser:Awaited<ReturnType<typeof chromium.launch>>|undefined;
    const base=`http://127.0.0.1:${port}`;
    try {
      let ready=false;
      for(let i=0;i<120;i++){try{const r=await fetch(base+"/login");if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}
      expect(ready).toBe(true);
      const chrome="C:/Program Files/Google/Chrome/Application/chrome.exe";
      browser=await chromium.launch(process.platform==="win32"&&existsSync(chrome)?{executablePath:chrome}:{});
      const adminContext=await browser.newContext();await adminContext.addCookies([{name:"pn_session",value:token,url:base}]);
      const page=await adminContext.newPage();await page.route("https://tile.openstreetmap.org/**",r=>r.abort());
      await page.goto(base+"/permission-out");await expect.poll(()=>page.getByRole("heading",{name:"วิเคราะห์เส้นทาง PEA / UFM",exact:true}).count()).toBe(1);
      await page.getByLabel("ชื่อโครงการ",{exact:true}).fill("Browser synthetic project");
      await page.locator('input[name="baseFiles"]').setInputFiles({name:"RD03-browser.kml",mimeType:"application/xml",buffer:Buffer.from('<kml><Placemark><name>Browser route</name><LineString><coordinates>100,13 100.001,13</coordinates></LineString></Placemark></kml>')});
      const analysisResponse=page.waitForResponse(r=>r.url().includes("/api/permission-out/analysis")&&r.request().method()==="POST");
      await page.getByRole("button",{name:"วิเคราะห์และบันทึกโครงการ",exact:true}).click();
      const analysisHttp=await analysisResponse,analysisPayload=await analysisHttp.json();expect(analysisHttp.status(),JSON.stringify(analysisPayload)).toBe(200);
      await page.waitForURL(/project=/,{timeout:30000});
      await expect.poll(()=>page.getByRole("heading",{name:"Browser synthetic project",exact:true}).count()).toBe(1);
      const projectId=new URL(page.url()).searchParams.get("project")!;
      const exported=await adminContext.request.get(`${base}/api/permission-out/projects/${projectId}/export?format=kml`);expect(exported.ok()).toBe(true);expect(await exported.text()).toContain("Browser route");
      for(const format of ["csv","source-csv","source-csv&trim=1","kmz"]){const file=await adminContext.request.get(`${base}/api/permission-out/projects/${projectId}/export?format=${format}`);expect(file.status(),format).toBe(200);expect((await file.body()).length).toBeGreaterThan(20);}
      await page.goto(base+"/site-facility");await expect.poll(()=>page.getByRole("button",{name:"SITE-001",exact:true}).count()).toBe(1);
      await page.screenshot({path:resolve(".data/permission-out-real-sites.png"),fullPage:true});
      const readonly=await browser.newContext();await readonly.addCookies([{name:"pn_session",value:readerToken,url:base}]);
      const response=await readonly.request.get(base+"/api/site-facility/sites");expect(response.status()).toBe(200);expect(await response.text()).not.toContain("1200.00");
      const rejected=await readonly.request.post(base+"/api/permission-out/formulas",{headers:{Origin:base},data:{}});expect([400,403]).toContain(rejected.status());
      await fixture`update core_module_settings set enabled=false where module_id='site-facility'`;
      expect((await readonly.request.get(base+"/api/site-facility/sites")).status()).toBe(403);
      await fixture`update core_module_settings set enabled=true where module_id='site-facility'`;
    }finally{await browser?.close();if(server.exitCode===null)await new Promise<void>(done=>{const timer=setTimeout(done,5000);server.once("exit",()=>{clearTimeout(timer);done();});server.kill();});}
  },120000);
});
