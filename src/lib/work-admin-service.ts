import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, type DatabaseTransaction } from "@/db";
import { kpiMetrics, kpiRuleVersions, profiles, teams, userTeams } from "@/db/schema";
import { adminAnnouncements, holidays, personalKpiVersions, systemLinkRoles, systemLinks, systemLinkTeams } from "@/db/work-admin-schema";
import { assertAuthorized, type AuthorizationSubject } from "@/lib/authorization";
import { runMaterialChange, type MaterialChange } from "@/lib/material-change";
import { holidayInputSchema, personalKpiSchema, systemLinkSchema, workKpiConfigSchema } from "@/lib/work-admin-domain";
import { readWorkKpiCatalog } from "@/lib/work-kpi-catalog";
import { ConcurrentWorkUpdateError } from "@/lib/work-task-service";
export const workAdminLock = (tx: DatabaseTransaction) => tx.execute(sql`select pg_advisory_xact_lock(710051)`);
export type WorkAdminContext = { actor: AuthorizationSubject; requestId: string };
type Kind = "holiday" | "rule" | "personal" | "system" | "announcement";
const ruleInput = workKpiConfigSchema.extend({ metricId: z.string().uuid().optional(), expectedVersion: z.number().int().min(0), active: z.boolean() });
const announcementInput = z.object({ id: z.string().uuid().optional(), expectedVersion: z.number().int().positive().optional(), message: z.string().trim().max(4000), isActive: z.boolean() });
export async function saveWorkAdmin(kind: Kind, raw: unknown, context: WorkAdminContext) {
  const input = kind === "holiday" ? holidayInputSchema.parse(raw) : kind === "rule" ? ruleInput.parse(raw) : kind === "personal" ? personalKpiSchema.parse(raw) : kind === "system" ? systemLinkSchema.parse(raw) : announcementInput.parse(raw);
  const permission = kind === "holiday" ? "core.holiday.manage" : kind === "system" ? "core.system_link.manage" : kind === "announcement" ? "core.announcement.manage" : "kpi.rule.manage";
  const resource = "teamId" in input ? { teamId: input.teamId, ownerId: "userId" in input ? input.userId : context.actor.userId } : {};
  assertAuthorized(context.actor, permission, resource);
  return getDb().transaction(async tx => {
    await workAdminLock(tx);
    const actorFields = { createdBy: context.actor.userId, updatedBy: context.actor.userId };
    const now = new Date();
    const id = "id" in input && input.id ? input.id : crypto.randomUUID();
    const eventId = crypto.randomUUID();
    const audit:MaterialChange["audit"] = { actorId: context.actor.userId, moduleId: "work", action: `admin.${kind}.save`, entityType: kind, entityId: id, requestId: context.requestId, after: input as Record<string, unknown> };
    return runMaterialChange({ audit,activity:{eventType:`work.admin.${kind}_changed.v1`,eventVersion:1,actorId:context.actor.userId,ownerId:context.actor.userId,teamId:"teamId" in input ? input.teamId:undefined,moduleId:"work",entityType:kind,entityId:id,occurredAt:now,sourceSystem:"permission_next",sourceEventId:eventId,correlationId:context.requestId,kpiEligible:false,payload:{kind}},outbox:{topic:`work.admin.${kind}_changed.v1`,idempotencyKey:`admin:${eventId}`,aggregateType:kind,aggregateId:id,payload:{id,kind}} }, async inner => {
      if (kind === "holiday") {
        const value = holidayInputSchema.parse(input);
        if (value.id) {
          const [current] = await inner.select().from(holidays).where(eq(holidays.id,value.id)).for("update");
          if (!current || current.version !== value.expectedVersion) throw new ConcurrentWorkUpdateError();
          audit.before={...current};
          await inner.update(holidays).set({ holidayDate:value.holidayDate,name:value.name,source:value.source,isActive:value.isActive,version:current.version+1,updatedBy:context.actor.userId,updatedAt:now }).where(eq(holidays.id,value.id));
        } else await inner.insert(holidays).values({ id, ...value, ...actorFields });
      } else if (kind === "rule") {
        const value = ruleInput.parse(input);
        if (!(await inner.select({ id: teams.id }).from(teams).where(and(eq(teams.id,value.teamId),eq(teams.isActive,true)))).length) throw new Error("TEAM_NOT_AVAILABLE");
        const metricId = value.metricId ?? crypto.randomUUID();
        const latest = (await readWorkKpiCatalog(inner)).find(r => r.metricId === metricId);
        if ((latest?.version ?? 0) !== value.expectedVersion) throw new ConcurrentWorkUpdateError();
        if(latest) audit.before={...latest};
        if (latest) assertAuthorized(context.actor,"kpi.rule.manage",{ teamId:latest.config.teamId });
        else if (value.metricId) throw new Error("KPI_NOT_AVAILABLE");
        if (!latest) await inner.insert(kpiMetrics).values({ id:metricId, code:`work-${metricId}`, name:`${value.mainKpi} / ${value.subKpi}`, unit:"คะแนน" });
        const config = workKpiConfigSchema.parse(value);
        await inner.insert(kpiRuleVersions).values({ id,metricId,version:value.expectedVersion+1,eventType:"work.task.completed.v1",status:value.active ? "active":"retired",effectiveFrom:now,createdBy:context.actor.userId,rule:{ work:config, conditions:[{path:"ruleVersionId",operator:"eq",value:id},{ path:"mainKpi",operator:"eq",value:config.mainKpi },{ path:"subKpi",operator:"eq",value:config.subKpi },{ path:"teamId",operator:"eq",value:config.teamId }],scoring:{ mode:"payload",path:"kpiWeight",multiplier:"1" } } });
      } else if (kind === "personal") {
        const value = personalKpiSchema.parse(input);
        const [person] = await inner.select().from(profiles).where(and(eq(profiles.id,value.userId),eq(profiles.status,"active")));
        const [member] = await inner.select().from(userTeams).where(and(eq(userTeams.userId,value.userId),eq(userTeams.teamId,value.teamId)));
        if (!person || !member) throw new Error("INVALID_OWNER");
        const [latest] = await inner.select().from(personalKpiVersions).where(and(eq(personalKpiVersions.userId,value.userId),eq(personalKpiVersions.teamId,value.teamId))).orderBy(desc(personalKpiVersions.version));
        if ((latest?.version ?? 0) !== value.expectedVersion) throw new ConcurrentWorkUpdateError();
        if(latest) audit.before={...latest};
        const catalog = await readWorkKpiCatalog(inner);
        if (value.assignments.some(a => !catalog.some(r => r.metricId === a.metricId && r.config.teamId === value.teamId && r.status === "active"))) throw new Error("KPI_NOT_AVAILABLE");
        await inner.insert(personalKpiVersions).values({ id,userId:value.userId,teamId:value.teamId,version:value.expectedVersion+1,assignments:value.assignments,...actorFields });
      } else if (kind === "system") {
        const value = systemLinkSchema.parse(input);
        const row = { name:value.name,description:value.description,url:value.url,icon:value.icon,status:value.status,visibleToAll:value.visibleToAll };
        if (value.id) {
          const [current] = await inner.select().from(systemLinks).where(eq(systemLinks.id,value.id)).for("update");
          if (!current || current.version !== value.expectedVersion) throw new ConcurrentWorkUpdateError();
          audit.before={...current};
          await inner.update(systemLinks).set({ ...row,version:current.version+1,updatedBy:context.actor.userId,updatedAt:now }).where(eq(systemLinks.id,value.id));
          await inner.delete(systemLinkRoles).where(eq(systemLinkRoles.linkId,value.id));
          await inner.delete(systemLinkTeams).where(eq(systemLinkTeams.linkId,value.id));
        } else await inner.insert(systemLinks).values({ id,...row,...actorFields });
        for (const roleId of new Set(value.roleIds)) await inner.insert(systemLinkRoles).values({ linkId:id,roleId,...actorFields });
        for (const teamId of new Set(value.teamIds)) await inner.insert(systemLinkTeams).values({ linkId:id,teamId,...actorFields });
      } else {
        const value = announcementInput.parse(input);
        if (value.isActive && !value.message) throw new Error("EMPTY_ANNOUNCEMENT");
        if (value.id) {
          const [current] = await inner.select().from(adminAnnouncements).where(eq(adminAnnouncements.id,value.id)).for("update");
          if (!current || current.version !== value.expectedVersion) throw new ConcurrentWorkUpdateError();
          audit.before={...current};
          await inner.update(adminAnnouncements).set({ message:value.message,isActive:value.isActive,version:current.version+1,updatedBy:context.actor.userId,updatedAt:now }).where(eq(adminAnnouncements.id,value.id));
        } else await inner.insert(adminAnnouncements).values({ id,message:value.message,isActive:value.isActive,...actorFields });
      }
      return { id };
    }, tx);
  });
}
