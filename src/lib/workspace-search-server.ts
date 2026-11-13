import "server-only";
import { randomUUID } from "node:crypto";
import { getAllAccessContexts } from "./access";
import { modules } from "./module-registry";
import { readWorkQueue } from "./work-queue-server";
import { listPermissionBuildings } from "./permission-building-server";
import { parseBuildingQuery } from "./building-query";
import { searchDepositWorkItems } from "./deposit-v2-server";
import { searchCarBookings } from "./car-booking-service";
import { listPoLines } from "@/modules/po-tracking/service";
import { listRequests } from "@/modules/duct-rental/server/requests";
import { listProjects as listRouteProjects, listSites as listRouteSites } from "@/modules/permission-out/service";
type Result = { id: string; title: string; description: string; href: string; moduleId: string };
export async function searchWorkspace(query: string) {
  const accessByModule = await getAllAccessContexts();
  const accessRows = modules.map(module => ({ module, access: accessByModule[module.id] }));
  const results = await Promise.allSettled(accessRows.filter(row => row.access.allowed).map(async ({ module, access }) => {
    const result = (id: string, title: string, description: string, href: string): Result => ({ id: `${module.id}:${id}`, title, description, href, moduleId: module.id });
    switch (module.id) {
      case "permission-out": {
        const projects=await listRouteProjects({userId:access.userId},query);
        return projects.slice(0,10).map(p=>result(p.id,p.title,"โครงการวิเคราะห์เส้นทาง",`/permission-out?project=${p.id}`));
      }
      case "site-facility":{const sites=await listRouteSites({userId:access.userId},{q:query});return sites.rows.slice(0,10).map(s=>result(`${s.datasetId}:${s.key}`,s.data.name||s.key,s.key,`/site-facility?q=${encodeURIComponent(s.key)}`));}
      case "work": return (await readWorkQueue(access, query)).map(item => result(item.id, item.title, [item.code, item.statusLabel].filter(Boolean).join(" · "), item.href));
      case "buildings": {
        const page = await listPermissionBuildings(parseBuildingQuery({ q: query.slice(0, 120), limit: "20" }), access);
        if (page.state !== "ready") throw new Error("BUILDINGS_UNAVAILABLE");
        return page.items.map(item => result(item.id, item.nameTh, [item.code, item.status].filter(Boolean).join(" · "), `/buildings/${item.id}`));
      }
      case "guarantees": return (await searchDepositWorkItems(query, access)).map(item => result(item.id, item.place || item.cid || "เงินประกัน", [item.cid, item.status].filter(Boolean).join(" · "), `/guarantees/${item.id}`));
      case "car-booking": return (await searchCarBookings({ actorId: access.userId, displayName: access.displayName, requestId: randomUUID() }, query)).map(item => result(item.id, item.destination || "การจองรถ", item.employeeName || item.status, "/car-booking"));
      case "po-tracking": return (await listPoLines({ userId: access.userId, subject: access.subject }, { q: query, pageSize: 20 })).rows.map(item => result(item.id, `${item.poNumber} · ${item.materialCode}`, item.description, `/po-tracking/${item.id}`));
      case "duct-rental": return (await listRequests({ query, limit: 20 }, { actorId: access.userId, requestId: randomUUID() })).rows.map(item => result(item.id, item.projectName || item.code, `${item.code} · ${item.routeName}`, `/duct-rental/${item.id}`));
      default: return [] as Result[];
    }
  }));
  const batches = results.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
  const merged: Result[] = [];
  for (let index = 0; index < 20 && merged.length < 20; index++) for (const batch of batches) if (batch[index] && merged.length < 20) merged.push(batch[index]);
  return { results: merged, ready: results.some(result => result.status === "fulfilled"), partial: results.some(result => result.status === "rejected") };
}
