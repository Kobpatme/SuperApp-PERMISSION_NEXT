import { getAccessContext } from "@/lib/access";
import { requireApiIdentity } from "@/lib/request-context";
import { PermissionOutError, archiveProject, commentNotifications, createFormula, downloadSourceFile, getProject, getSite, listAssignmentTeams, listDatasets, listFormulas, listProjects, listReferenceFeatures, listSites, listVersions, publishDataset, runAnalysis, siteComments, siteFilterOptions,stageDataset, updateSite } from "./service";
import { filterSchema } from "./domain";
import { pairedSourceCsv,routeCsv, routeKml, routeKmz, siteCsv } from "./export";
import { getDb } from "@/db";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { listPublishedRoutes } from "./service";

const noStore = { "Cache-Control": "private, no-store" };
let activeUploads=0;
/** Next's internal URL can use the listen address. Browser Host identifies the
 * destination; never trust a client-supplied X-Forwarded-Host as an origin. */
export function sameOrigin(request:Request) {
  try {
    const supplied=request.headers.get("origin");if(!supplied)return false;
    const internal=new URL(request.url),host=request.headers.get("host");
    const expected=host?new URL(`${internal.protocol}//${host}`):internal;
    if(expected.username||expected.password||(host&&(expected.pathname!=="/"||expected.search||expected.hash))||!["http:","https:"].includes(expected.protocol))return false;
    return supplied===expected.origin;
  }catch{return false;}
}
async function boundedBody(request: Request, max: number) {
  if (Number(request.headers.get("content-length")) > max) throw new PermissionOutError("ไฟล์หรือคำขอมีขนาดใหญ่เกินกำหนด", 413);
  const reader = request.body?.getReader(); if (!reader) throw new PermissionOutError("ไม่พบข้อมูลคำขอ");
  const chunks: Uint8Array[] = []; let size = 0;
  for (;;) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > max) { await reader.cancel(); throw new PermissionOutError("ไฟล์หรือคำขอมีขนาดใหญ่เกินกำหนด", 413); } chunks.push(value); }
  return Buffer.concat(chunks);
}
async function downloadPermit(userId: string, ownerId: string, teamId: string | null) {
  return getDb().transaction(async tx => { await tx.execute(sql`select set_config('app.user_id',${userId},true)`); const [r] = await tx.execute<{ ok: boolean }>(sql`select public.pout_access('permission_out.report.export',${ownerId}::uuid,${teamId}::uuid) as ok`); if (!r?.ok) throw new PermissionOutError("ไม่มีสิทธิ์ส่งออก", 403); });
}
export async function permissionOutApi(request: Request, path: string[],moduleId:"permission-out"|"site-facility"="permission-out") {
  try {
    const identity = await requireApiIdentity(); if (!identity.ok) return identity.response;
    const access = await getAccessContext(moduleId);
    if (!access.allowed || access.userId !== identity.user.id) throw new PermissionOutError("ไม่มีสิทธิ์เข้าใช้งานโมดูลนี้", 403);
    const actor = { userId: identity.user.id,module:moduleId }, url = new URL(request.url), [resource, id, action] = path;
    const allowed=moduleId==="site-facility"?["teams","site-options","source","notifications","datasets","sites","comments","import","publish"]:["teams","references","network","source","datasets","formulas","projects","import","analysis","publish"];
    if(!allowed.includes(resource))throw new PermissionOutError("ไม่พบคำสั่งในโมดูลนี้",404);
    if (request.method === "GET") {
      const query = Object.fromEntries(url.searchParams);
      if(resource==="network")return Response.json(await listPublishedRoutes(actor),{headers:noStore});
      if (resource === "teams") return Response.json(await listAssignmentTeams(actor),{headers:noStore});
      if (resource === "references") return Response.json(await listReferenceFeatures(actor),{headers:noStore});
      if (resource === "site-options") return Response.json(await siteFilterOptions(actor),{headers:noStore});
      if(resource==="source"&&id){const file=await downloadSourceFile(actor,id);const extension=/\.(xlsx|kml|kmz)$/i.exec(file.filename)?.[1].toLowerCase()??"bin";return new Response(Uint8Array.from(file.contents),{headers:{...noStore,"Content-Type":"application/octet-stream","Content-Disposition":`attachment; filename="source-${id}.${extension}"`}});}
      if (resource === "notifications") return Response.json(await commentNotifications(actor),{headers:noStore});
      if (resource === "datasets") return Response.json(id ? await listVersions(actor, id) : await listDatasets(actor), { headers: noStore });
      if (resource === "formulas") return Response.json(await listFormulas(actor), { headers: noStore });
      if (resource === "projects" && !id) return Response.json(await listProjects(actor, query.q, Number(query.page ?? 1)), { headers: noStore });
      if (resource === "projects" && id) {
        const project = await getProject(actor, id, filterSchema.parse(query));
        if (action === "export") {
          await downloadPermit(actor.userId, project.ownerId, project.teamId);
          const format = z.enum(["csv","source-csv","kml","kmz"]).parse(query.format ?? "csv");
          const {groupSegmentsInWorker}=await import("./analysis-server");
          const groups=format==="source-csv"?[]:await groupSegmentsInWorker(project.snapshot.segments,project.snapshot.options.threshold,project.snapshot.options.interval);
          const body = format === "source-csv" ? await pairedSourceCsv([...project.snapshot.sourceLines.base,...project.snapshot.sourceLines.compare],project.snapshot.options.threshold,project.snapshot.formula?.parameters.polesPerKm??null,project.snapshot.areas,query.trim==="1",new Set(project.snapshot.segments.map(s=>s.key)),query.area) : format === "csv" ? routeCsv(project.snapshot.segments,groups) : format === "kml" ? routeKml(project.snapshot.segments,project.snapshot.areas,groups,query.area) : await routeKmz(project.snapshot.segments,project.snapshot.areas,groups,query.area);
          return new Response(body as BodyInit, { headers: { ...noStore, "Content-Type": format.endsWith("csv") ? "text/csv; charset=utf-8" : format === "kml" ? "application/vnd.google-earth.kml+xml" : "application/vnd.google-earth.kmz", "Content-Disposition": `attachment; filename="permission-out-${id}.${format.endsWith("csv") ? "csv" : format}"` } });
        }
        return Response.json(project, { headers: noStore });
      }
      if (resource === "sites") {
        if(id&&!["export","map"].includes(id))return Response.json(await getSite(actor,id,url.searchParams.get("key")??""),{headers:noStore});
        const result = await listSites(actor, query, id === "export",id === "map");
        if (id === "export") return new Response(siteCsv(result.rows, result.yearly !== null), { headers: { ...noStore, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="sites.csv"' } });
        return Response.json(result, { headers: noStore });
      }
      if (resource === "comments" && id) return Response.json(await siteComments(actor, id, url.searchParams.get("key") ?? ""), { headers: noStore });
    }
    if (request.method === "POST") {
      if (!sameOrigin(request)) throw new PermissionOutError("คำขอไม่ถูกต้อง", 403);
      if (["import", "analysis"].includes(resource)) {
        if(activeUploads>=2)throw new PermissionOutError("มีงานนำเข้าหรือวิเคราะห์กำลังทำงานอยู่ กรุณาลองอีกครั้ง",429);
        activeUploads++;
        try {
        const buffer = await boundedBody(request, 105 * 1024 * 1024);
        const form = await new Request(request.url, { method: "POST", headers: { "Content-Type": request.headers.get("content-type") ?? "" }, body: buffer }).formData();
        if (resource === "import") {
          const file = form.get("file"); if (!(file instanceof File)) throw new PermissionOutError("เลือกไฟล์สำหรับนำเข้า");
          const kind = z.enum(["pea","ufm","road","building","sites"]).parse(form.get("kind"));
          if((kind==="sites")!==(moduleId==="site-facility"))throw new PermissionOutError("ประเภทชุดข้อมูลไม่ตรงกับโมดูล",403);
          return Response.json(await stageDataset(actor, { name: String(form.get("name") ?? ""), kind,teamId:form.get("teamId")?String(form.get("teamId")):null, datasetId: form.get("datasetId") ? String(form.get("datasetId")) : undefined }, file), { headers: noStore });
        }
        return Response.json(await runAnalysis(actor, JSON.parse(String(form.get("input"))), form.getAll("baseFiles").filter((v): v is File => v instanceof File && !!v.size), form.getAll("compareFiles").filter((v): v is File => v instanceof File && !!v.size)), { headers: noStore });
        }finally{activeUploads--;}
      }
      const body = JSON.parse((await boundedBody(request, 1024 * 1024)).toString("utf8"));
      if(resource==="projects"&&id&&action==="archive")return Response.json(await archiveProject(actor,id,z.number().int().positive().parse(body.expectedVersion)),{headers:noStore});
      if (resource === "notifications") return Response.json(await commentNotifications(actor,true),{headers:noStore});
      if (resource === "publish") {
        const input = z.object({ datasetId: z.string().uuid(), versionId: z.string().uuid(), expectedVersion: z.number().int().positive() }).parse(body);
        return Response.json(await publishDataset(actor, input.datasetId, input.versionId, input.expectedVersion), { headers: noStore });
      }
      if (resource === "formulas") return Response.json(await createFormula(actor, body), { headers: noStore });
      if (resource === "sites" && id) {
        const input = z.object({ key: z.string().min(1).max(120), site: z.unknown(), expectedVersion: z.number().int().min(0),baseVersion:z.string().uuid(), archived: z.boolean().default(false),opex:z.string().regex(/^\d{1,12}(?:\.\d{1,2})?$/).nullable().optional() }).parse(body);
        return Response.json(await updateSite(actor, id, input.key, input.site, input.expectedVersion,input.baseVersion, input.archived,input.opex), { headers: noStore });
      }
      if (resource === "comments" && id) return Response.json(await siteComments(actor, id, z.string().parse(body.key), z.string().parse(body.body)), { headers: noStore });
    }
    return Response.json({ error: "ไม่พบคำสั่งที่ต้องการ" }, { status: 404, headers: noStore });
  } catch (error) {
    if (error instanceof PermissionOutError) return Response.json({ error: error.message }, { status: error.status, headers: noStore });
    if (error instanceof z.ZodError || error instanceof SyntaxError) return Response.json({ error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง" }, { status: 400, headers: noStore });
    // Parser errors are deliberately authored Thai messages; database/driver
    // errors (including nested SQL) are never reflected to the browser.
    if (error instanceof Error && !('cause' in error) && !('code' in error) && /^[ก-๙]/.test(error.message)) return Response.json({ error: error.message }, { status: 400, headers: noStore });
    return Response.json({ error: "ระบบยังไม่พร้อมใช้งาน กรุณาลองใหม่หรือติดต่อผู้ดูแล" }, { status: 503, headers: noStore });
  }
}
