import "server-only";
import { and, asc, desc, eq, gt, isNull, lte, or } from "drizzle-orm";
import { getDb } from "@/db";
import { profiles, roles, teams, tasks, userRoleAssignments, userTeams } from "@/db/schema";
import { adminAnnouncements, holidays, personalKpiVersions, systemLinkRoles, systemLinks, systemLinkTeams } from "@/db/work-admin-schema";
import { getIdentityAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { readWorkKpiCatalog } from "@/lib/work-kpi-catalog";
import { safeSystemUrl, visibleSystemLink } from "@/lib/work-admin-domain";
export async function getWorkAdminData() {
  const access = await getIdentityAccessContext();
  const granted = { calendar:!access.passwordChangeRequired && isAuthorized(access.subject,"core.holiday.manage"), systems:!access.passwordChangeRequired && isAuthorized(access.subject,"core.system_link.manage"), announcement:!access.passwordChangeRequired && isAuthorized(access.subject,"core.announcement.manage"), kpi:!access.passwordChangeRequired && access.permissions.includes("kpi.rule.manage") };
  const db = getDb();
  const [calendar,links,linkRoles,linkTeams,announcements,catalog,personals,teamRows,roleRows,peopleRows,deleted] = await Promise.all([
    granted.calendar ? db.select().from(holidays).orderBy(asc(holidays.holidayDate)) : [],
    granted.systems ? db.select().from(systemLinks).orderBy(asc(systemLinks.name)) : [],
    granted.systems ? db.select().from(systemLinkRoles) : [], granted.systems ? db.select().from(systemLinkTeams) : [],
    granted.announcement ? db.select().from(adminAnnouncements).orderBy(desc(adminAnnouncements.createdAt)) : [],
    granted.kpi ? readWorkKpiCatalog(db) : [], granted.kpi ? db.select().from(personalKpiVersions).orderBy(desc(personalKpiVersions.version)) : [],
    (granted.kpi || granted.systems) ? db.select({ id:teams.id,name:teams.name }).from(teams).where(eq(teams.isActive,true)) : [],
    granted.systems ? db.select({ id:roles.id,name:roles.name }).from(roles) : [],
    granted.kpi ? db.select({ id:profiles.id,name:profiles.displayName,teamId:userTeams.teamId }).from(profiles).innerJoin(userTeams,eq(userTeams.userId,profiles.id)).where(eq(profiles.status,"active")) : [],
    access.permissions.includes("work.task.delete") ? db.select().from(tasks).where(sqlDeleted()).orderBy(desc(tasks.deletedAt)).limit(100) : [],
  ]);
  const scopedCatalog = catalog.filter(r => isAuthorized(access.subject,"kpi.rule.manage",{ teamId:r.config.teamId,ownerId:access.userId }));
  return { granted, calendar:calendar.map(r => ({ id:r.id,holidayDate:r.holidayDate,name:r.name,source:r.source,isActive:r.isActive,version:r.version })),
    links:links.map(r => ({ id:r.id,name:r.name,description:r.description,url:r.url,icon:r.icon,status:r.status,visibleToAll:r.visibleToAll,version:r.version,roleIds:linkRoles.filter(a => a.linkId===r.id).map(a => a.roleId),teamIds:linkTeams.filter(a => a.linkId===r.id).map(a => a.teamId) })),
    announcements:announcements.map(r => ({ id:r.id,message:r.message,isActive:r.isActive,version:r.version })),
    catalog:scopedCatalog.map(r => ({ id:r.id,metricId:r.metricId,version:r.version,status:r.status,...r.config })),
    personals:personals.filter(r => isAuthorized(access.subject,"kpi.rule.manage",{ ownerId:r.userId,teamId:r.teamId })).map(r => ({ userId:r.userId,teamId:r.teamId,version:r.version,assignments:r.assignments })),
    teams:teamRows.filter(r => granted.systems || isAuthorized(access.subject,"kpi.rule.manage",{ teamId:r.id,ownerId:access.userId })),roles:roleRows,
    people:peopleRows.filter(r => isAuthorized(access.subject,"kpi.rule.manage",{ ownerId:r.id,teamId:r.teamId })).map(r => ({ ...r,name:r.name ?? "สมาชิกทีม" })),
    deleted:deleted.filter(r => isAuthorized(access.subject,"work.task.delete",r) && isAuthorized(access.subject,"work.task.manage",r)).map(r => ({ id:r.id,title:r.title,version:r.version })),
  };
}
import { isNotNull } from "drizzle-orm";
function sqlDeleted() { return isNotNull(tasks.deletedAt); }
export type WorkAdminData = Awaited<ReturnType<typeof getWorkAdminData>>;
export async function getHomeWorkMessages() {
  const access = await getIdentityAccessContext();
  if (!access.userId || access.passwordChangeRequired || !process.env.DATABASE_URL) return { announcements:[],links:[] };
  try {
    const now = new Date();
    const [announcements,links,roleAssignments,linkRoles,linkTeams] = await Promise.all([
      getDb().select({ id:adminAnnouncements.id,message:adminAnnouncements.message }).from(adminAnnouncements).where(eq(adminAnnouncements.isActive,true)).limit(20),
      getDb().select().from(systemLinks).orderBy(asc(systemLinks.name)).limit(200),
      getDb().select({ roleId:userRoleAssignments.roleId }).from(userRoleAssignments).where(and(eq(userRoleAssignments.userId,access.userId),lte(userRoleAssignments.validFrom,now),or(isNull(userRoleAssignments.validUntil),gt(userRoleAssignments.validUntil,now)))),
      getDb().select().from(systemLinkRoles),getDb().select().from(systemLinkTeams),
    ]);
    return { announcements,links:links.filter(r => safeSystemUrl(r.url) && visibleSystemLink({ ...r,roleIds:linkRoles.filter(a => a.linkId===r.id).map(a => a.roleId),teamIds:linkTeams.filter(a => a.linkId===r.id).map(a => a.teamId) },roleAssignments.map(r => r.roleId),access.subject?.teamIds ?? [])).map(r => ({ id:r.id,name:r.name,url:r.url,description:r.description,status:r.status })) };
  } catch { return { announcements:[],links:[] }; }
}
