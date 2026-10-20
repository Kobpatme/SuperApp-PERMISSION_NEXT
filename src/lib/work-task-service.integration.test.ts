import { config } from "dotenv";
import { and, eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { auditLogs, outboxMessages, profiles, taskNotes, tasks, taskTransitions, teams } from "@/db/schema";
import type { Database, DatabaseTransaction } from "@/db";
import type { AuthorizationSubject } from "@/lib/authorization";
const testDb = vi.hoisted(() => vi.fn());
vi.mock("@/db", () => ({ getDb: testDb }));
import { mutateWorkTask } from "@/lib/work-task-service";
import { saveWorkAdmin } from "@/lib/work-admin-service";
import { previewWorkRecalculation,confirmDeadlineRecalculation } from "@/lib/work-recalculation";
import { createWorkBatch } from "@/lib/work-create-service";
import { readWorkKpiCatalog,resolveTaskKpi } from "@/lib/work-kpi-catalog";
import { kpiRuleVersions,userTeams } from "@/db/schema";
describe.skipIf(process.env.PARITY_INTEGRATION !== "1")("task transactions on isolated PostgreSQL", () => {
  it("allows only one winner for concurrent independent task transactions",async()=>{
    config({path:".env.local",quiet:true});const target=new URL(process.env.DATABASE_URL!);
    if(!["localhost","127.0.0.1","[::1]"].includes(target.hostname))throw new Error("Local fixture database required");
    target.pathname="/permission_next_parity_test";process.env.DATABASE_URL=target.href;
    const actual=await vi.importActual<typeof import("@/db")>("@/db");const db=actual.getDb();testDb.mockReturnValue(db);
    const userId=crypto.randomUUID(),teamId=crypto.randomUUID(),taskId=crypto.randomUUID();
    await db.transaction(async tx=>{await tx.insert(profiles).values({id:userId,email:`${userId}@example.test`});await tx.insert(teams).values({id:teamId,code:teamId,name:"Concurrent fixture"});await tx.insert(tasks).values({id:taskId,title:"Concurrent fixture",ownerId:userId,teamId,status:"in_progress"});});
    const actor:AuthorizationSubject={userId,teamIds:[teamId],grants:[{permission:"work.task.update",scope:"OWN"},{permission:"work.note.create",scope:"OWN"}]};
    const results=await Promise.allSettled(["first","second"].map(body=>mutateWorkTask({kind:"note",taskId,expectedVersion:1,idempotencyKey:crypto.randomUUID(),body},{actor,requestId:crypto.randomUUID(),correlationId:crypto.randomUUID()})));
    expect(results.filter(r=>r.status==="fulfilled")).toHaveLength(1);const rejected=results.find(r=>r.status==="rejected") as PromiseRejectedResult;expect(rejected.reason).toMatchObject({status:409});
    expect(await db.select().from(taskNotes).where(eq(taskNotes.taskId,taskId))).toHaveLength(1);
    expect((await db.select().from(tasks).where(eq(tasks.id,taskId)))[0].version).toBe(2);
  });
  async function fixture(run: (tx: DatabaseTransaction, actor: AuthorizationSubject, id: string) => Promise<void>) {
    config({ path: ".env.local", quiet: true });
    const target = new URL(process.env.DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) throw new Error("Local fixture database required");
    target.pathname = "/permission_next_parity_test"; process.env.DATABASE_URL = target.href;
    const actual = await vi.importActual<typeof import("@/db")>("@/db");
    const rollback = new Error("rollback fixture");
    try { await actual.getDb().transaction(async tx => {
      testDb.mockReturnValue(tx as unknown as Database);
      const actorId = crypto.randomUUID(), teamId = crypto.randomUUID(), id = crypto.randomUUID();
      await tx.insert(profiles).values({ id: actorId, email: `${actorId}@example.test` });
      await tx.insert(teams).values({ id: teamId, code: teamId, name: "ทีมทดสอบ" });
      await tx.insert(tasks).values({ id, ownerId: actorId, teamId, title: "งานทดสอบ", status: "in_progress", note: "legacy" });
      await tx.insert(userTeams).values({ userId:actorId,teamId });
      const actor: AuthorizationSubject = { userId: actorId, teamIds: [teamId], grants: ["work.task.read", "work.task.update", "work.note.create", "work.task.manage", "work.task.delete","work.task.assign","work.task.create","kpi.rule.manage","core.holiday.manage"].map(permission => ({ permission, scope: "TEAM" })) };
      await run(tx, actor, id); throw rollback;
    }); } catch (error) { if (error !== rollback) throw error; }
  }
  it("replays without duplicating audit/transition/outbox and returns 409 for stale versions", async () => {
    await fixture(async (tx, actor, id) => {
      const command = { kind: "transition", taskId: id, expectedVersion: 1, toStatus: "completed", reason: "เสร็จแล้ว", idempotencyKey: crypto.randomUUID() };
      const ctx = { actor, requestId: crypto.randomUUID(), correlationId: crypto.randomUUID() };
      expect(await mutateWorkTask(command, ctx)).toMatchObject({ version: 2, replayed: false });
      expect(await mutateWorkTask(command, ctx)).toMatchObject({ version: 2, replayed: true });
      expect(await tx.select().from(taskTransitions).where(eq(taskTransitions.taskId, id))).toHaveLength(1);
      expect(await tx.select().from(auditLogs).where(eq(auditLogs.entityId, id))).toHaveLength(1);
      expect(await tx.select().from(outboxMessages).where(eq(outboxMessages.aggregateId, id))).toHaveLength(1);
      await expect(mutateWorkTask({ ...command, idempotencyKey: crypto.randomUUID() }, ctx)).rejects.toMatchObject({ status: 409 });
      await expect(mutateWorkTask({ ...command, reason: "different" }, ctx)).rejects.toMatchObject({ status: 409 });
    });
  });
  it("appends completed notes, preserves legacy text and supports audited recovery", async () => {
    await fixture(async (tx, actor, id) => {
      await tx.update(tasks).set({ status: "completed", completedAt: new Date() }).where(eq(tasks.id, id));
      const ctx = { actor, requestId: crypto.randomUUID(), correlationId: crypto.randomUUID() };
      const base = { taskId: id, expectedVersion: 1, idempotencyKey: crypto.randomUUID() };
      await mutateWorkTask({ ...base, kind: "note", body: "ใหม่" }, ctx);
      expect(await tx.select().from(taskNotes).where(eq(taskNotes.taskId, id))).toHaveLength(1);
      expect((await tx.select().from(tasks).where(eq(tasks.id, id)))[0]).toMatchObject({ note: "legacy", status: "completed", version: 2 });
      await mutateWorkTask({ ...base, expectedVersion: 2, idempotencyKey: crypto.randomUUID(), kind: "delete", reason: "ทดสอบ" }, ctx);
      expect((await tx.select().from(tasks).where(eq(tasks.id, id)))[0].deletedAt).not.toBeNull();
      await mutateWorkTask({ ...base, expectedVersion: 3, idempotencyKey: crypto.randomUUID(), kind: "restore", reason: "กู้คืน" }, ctx);
      expect((await tx.select().from(tasks).where(eq(tasks.id, id)))[0].deletedAt).toBeNull();
    });
  });
  it("denies wrong team and rolls back state if evidence cannot be written", async () => {
    await fixture(async (tx, actor, id) => {
      const command = { taskId: id, expectedVersion: 1, idempotencyKey: crypto.randomUUID(), kind: "note", body: "ใหม่" };
      const ctx = { actor: { ...actor, grants:actor.grants.map(g=>({...g,scope:"TEAM" as const})),teamIds: [] }, requestId: crypto.randomUUID(), correlationId: crypto.randomUUID() };
      await expect(mutateWorkTask(command, ctx)).rejects.toMatchObject({ status: 403 });
      await expect(mutateWorkTask(command, { ...ctx, actor, requestId: undefined as unknown as string })).rejects.toThrow();
      expect((await tx.select().from(tasks).where(eq(tasks.id, id)))[0].version).toBe(1);
      expect(await tx.select().from(taskNotes).where(eq(taskNotes.taskId, id))).toHaveLength(0);
    });
  });
  it("appends rule versions, resolves personal weights and replays creation without duplicate tasks",async()=>{
    await fixture(async(tx,actor)=>{
      const ctx={actor,requestId:crypto.randomUUID()},teamId=actor.teamIds[0];
      const rule={teamId,mainKpi:"งานทดสอบ",subKpi:"ตรวจเอกสาร",slaDays:2,mainWeight:"100",expectedVersion:0,active:true};
      await saveWorkAdmin("rule",rule,ctx);
      let catalog=await readWorkKpiCatalog(tx);const first=catalog.find(r=>r.config.teamId===teamId)!;
      await saveWorkAdmin("rule",{...rule,metricId:first.metricId,expectedVersion:1,slaDays:3},ctx);
      expect(await tx.select().from(kpiRuleVersions).where(eq(kpiRuleVersions.metricId,first.metricId))).toHaveLength(2);
      catalog=await readWorkKpiCatalog(tx);const latest=catalog.find(r=>r.metricId===first.metricId)!;
      await saveWorkAdmin("personal",{userId:actor.userId,teamId,expectedVersion:0,assignments:[{metricId:latest.metricId,weight:"100",enabled:true}]},ctx);
      expect(await resolveTaskKpi({teamId,userId:actor.userId,ruleVersionId:latest.id},tx)).toMatchObject({kpiWeight:"100",personalVersion:1});
      const input={jobs:"JOB-TEST",teamId,assigneeId:actor.userId,ruleVersionId:latest.id,idempotencyKey:crypto.randomUUID()};
      await expect(createWorkBatch({...input,jobs:"JOB-TEST\nJOB-TEST"},"personal",ctx)).rejects.toThrow("INVALID_JOBS");
      const firstCreate=await createWorkBatch(input,"personal",ctx);expect(await createWorkBatch(input,"personal",ctx)).toMatchObject({id:firstCreate.id,replayed:true});
      await expect(createWorkBatch({...input,jobs:"JOB-CHANGED"},"personal",ctx)).rejects.toMatchObject({status:409});
      const created=await tx.select().from(tasks).where(and(eq(tasks.ownerId,actor.userId),eq(tasks.jobCode,"JOB-TEST")));
      expect(created).toHaveLength(1);expect(created[0]).toMatchObject({sourceKind:"personal",slaRuleVersionId:latest.id});
    });
  });
  it("binds previews to the actor/config/task versions and applies deadlines with replay safety",async()=>{
    await fixture(async(tx,actor,id)=>{
      const ctx={actor,requestId:crypto.randomUUID()},teamId=actor.teamIds[0];
      await saveWorkAdmin("rule",{teamId,mainKpi:"งานทดสอบ",subKpi:"SLA",slaDays:2,mainWeight:"100",expectedVersion:0,active:true},ctx);
      await tx.update(tasks).set({mainKpi:"งานทดสอบ",subKpi:"SLA"}).where(eq(tasks.id,id));
      const preview=await previewWorkRecalculation("deadlines",ctx);expect(preview.rows).toHaveLength(1);
      await expect(confirmDeadlineRecalculation(preview.id,{...ctx,actor:{...actor,userId:crypto.randomUUID()}})).rejects.toThrow("PREVIEW_INVALID");
      await tx.update(tasks).set({version:2}).where(eq(tasks.id,id));
      await expect(confirmDeadlineRecalculation(preview.id,ctx)).rejects.toMatchObject({status:409});
      const fresh=await previewWorkRecalculation("deadlines",ctx);
      expect(await confirmDeadlineRecalculation(fresh.id,ctx)).toMatchObject({updated:1,replayed:false});
      expect(await confirmDeadlineRecalculation(fresh.id,ctx)).toMatchObject({updated:1,replayed:true});
      expect((await tx.select().from(tasks).where(eq(tasks.id,id)))[0].version).toBe(3);
      const migration=await previewWorkRecalculation("kpi_migration",ctx);
      await expect(confirmDeadlineRecalculation(migration.id,ctx)).rejects.toThrow("PREVIEW_INVALID");
    });
  });
  it("extends held deadlines using working days and active holidays",async()=>{
    await fixture(async(tx,actor,id)=>{
      const ctx={actor,requestId:crypto.randomUUID(),correlationId:crypto.randomUUID()};
      await tx.update(tasks).set({dueAt:new Date("2026-10-09T17:00:00+07:00")}).where(eq(tasks.id,id));
      await mutateWorkTask({taskId:id,expectedVersion:1,idempotencyKey:crypto.randomUUID(),kind:"transition",toStatus:"blocked",reason:"พัก"},{...ctx,occurredAt:new Date("2026-10-05T10:00:00+07:00")});
      await mutateWorkTask({taskId:id,expectedVersion:2,idempotencyKey:crypto.randomUUID(),kind:"transition",toStatus:"in_progress",reason:"ต่อ"},{...ctx,occurredAt:new Date("2026-10-07T10:00:00+07:00")});
      const [task]=await tx.select().from(tasks).where(eq(tasks.id,id));expect(task.dueAt?.toISOString()).toBe("2026-10-13T10:00:00.000Z");expect(task.holdData.hold_days_total).toBe(2);
    });
  });
  it("persists details with optimistic versioning and keeps the existing KPI snapshot",async()=>{
    await fixture(async(tx,actor,id)=>{
      const ctx={actor,requestId:crypto.randomUUID(),correlationId:crypto.randomUUID()};
      const command={kind:"edit" as const,taskId:id,expectedVersion:1,idempotencyKey:crypto.randomUUID(),title:"แก้ไขรายละเอียด",description:"รายละเอียดใหม่",priority:"high" as const,dueAt:"2026-10-20T17:00:00+07:00",ownerId:actor.userId,jobCode:"EDIT-TEST",mainKpi:"",subKpi:""};
      expect(await mutateWorkTask(command,ctx)).toMatchObject({version:2});
      expect((await tx.select().from(tasks).where(eq(tasks.id,id)))[0]).toMatchObject({title:command.title,description:command.description,priority:"high",jobCode:"EDIT-TEST",status:"in_progress"});
      await expect(mutateWorkTask({...command,idempotencyKey:crypto.randomUUID()},ctx)).rejects.toMatchObject({status:409});
    });
  });
  it("rejects duplicate calendar dates and stale holiday updates without losing the original",async()=>{
    await fixture(async(tx,actor)=>{
      const ctx={actor:{...actor,grants:[...actor.grants,{permission:"core.holiday.manage",scope:"ALL" as const}]},requestId:crypto.randomUUID()};const value={holidayDate:"2099-01-05",name:"วันทดสอบ",source:"company",isActive:true};
      const {id}=await saveWorkAdmin("holiday",value,ctx);
      await expect(saveWorkAdmin("holiday",value,{...ctx,requestId:crypto.randomUUID()})).rejects.toThrow();
      await expect(saveWorkAdmin("holiday",{...value,id,expectedVersion:2},ctx)).rejects.toMatchObject({status:409});
      await saveWorkAdmin("holiday",{...value,id,expectedVersion:1,isActive:false},ctx);
      const {holidays}=await import("@/db/work-admin-schema");expect((await tx.select().from(holidays).where(eq(holidays.id,id)))[0]).toMatchObject({version:2,isActive:false});
    });
  });
});
