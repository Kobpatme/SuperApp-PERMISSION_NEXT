import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { beforeAll, beforeEach, afterAll, describe, it, expect, vi } from "vitest";
import { createPoTestClone } from "../../tests/fixtures/po-test-clone";
import { poTestEnvironment } from "../../tests/fixtures/po-test-environment";
import type { AccessContext } from "./access";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/access", () => ({ getAccessContext: async () => access }));
import { getDb } from "@/db";
import { readWorkReportSummary } from "./work-report-server";
import { readWorkQueue } from "./work-queue-server";
import { readDepositList, readDepositListPage } from "./deposit-list-server";
import { depositListQuery } from "./deposit-list-query";
import { searchDepositWorkItems } from "./deposit-v2-server";
const enabled = process.env.SYSTEM_REVIEW_INTEGRATION === "1", name = `po_tracking_test_${Date.now()}`;
let operator: postgres.Sql, fixture: postgres.Sql, access: AccessContext;
let selectCount = 0;
const actorId = randomUUID(), otherId = randomUUID(), marker = `REVIEW-${randomUUID()}`;
beforeAll(async () => {
  if (!enabled) return;
  const env = await poTestEnvironment(), runtime = new URL(env.DATABASE_URL), admin = new URL(env.DATABASE_URL_MIGRATE); admin.pathname = "/postgres";
  operator = postgres(admin.href, { max: 1 }); await createPoTestClone(name, admin, runtime);
  const target = new URL(admin); target.pathname = `/${name}`; fixture = postgres(target.href, { max: 1 });
  runtime.pathname = `/${name}`; process.env.DATABASE_URL = runtime.href;
  delete (globalThis as typeof globalThis & { permissionNextSql?: unknown }).permissionNextSql;
  await fixture`insert into profiles(id,email,display_name) values(${actorId},${actorId + '@example.test'},'Review fixture'),(${otherId},${otherId + '@example.test'},'Other fixture')`;
  await fixture`insert into tasks(id,title,owner_id,status,kpi_weight,due_at,completed_at)
    select gen_random_uuid(),${marker} || case when n=619 then '-OLDEST' else '-'||n::text end,${actorId}::uuid,
      case when n<400 then 'completed' when n<600 then 'queued' else 'cancelled' end,
      case when n<400 then 1 when n<600 then 2 else 10 end,'2020-01-02'::timestamptz,case when n<400 then '2020-01-01'::timestamptz else null end
    from generate_series(0,619) n`;
  await fixture`insert into tasks(id,title,owner_id,status) values(gen_random_uuid(),${marker + '-OTHER'},${otherId},'queued')`;
  await fixture`insert into guarantee_work_items(id,owner_id,status,place,data,updated_at)
    select gen_random_uuid(),${actorId}::uuid,'new',${marker} || case when n=619 then '-OLDEST' else '-'||n::text end,jsonb_build_object('cid',${marker}||n,'status','new','deposit','1','owner','Review fixture'),'2020-01-01'::timestamptz from generate_series(0,619) n`;
  access = { userId: actorId, email: "fixture@example.test", displayName: "Fixture", allowed: true, permissions: [], passwordChangeRequired: false, isDevelopmentSession: false, subject: { userId: actorId, teamIds: [], grants: [{ permission: "work.task.read", scope: "ALL" }, { permission: "work.report.read", scope: "OWN" }, { permission: "guarantee.case.read", scope: "OWN" }] } };
  // Count domain task reads, excluding the driver's one-time pg_type discovery.
  // Never log SQL, parameters, URLs or data.
  (globalThis as typeof globalThis & { permissionNextSql?: postgres.Sql }).permissionNextSql = postgres(runtime.href, { max: 3, prepare: false, debug: (_connection, query) => { if (query.trim().toLowerCase().startsWith("select") && query.includes('from "tasks"')) selectCount++; } });
}, 60000);
beforeEach(() => { selectCount = 0; });
afterAll(async () => {
  if (!operator) return;
  await fixture?.end();
  const pool = (globalThis as typeof globalThis & { permissionNextSql?: postgres.Sql }).permissionNextSql; await pool?.end();
  await operator.unsafe(`drop database if exists ${name} with (force)`); await operator.end();
});
describe.skipIf(!enabled)("system review against an isolated database", () => {
  it("aggregates over 500 tasks and intersects read/report scopes", async () => {
    const summary = await readWorkReportSummary(access, { q: marker });
    expect(summary.report).toMatchObject({ taskCount: 620, overdue: 200, completion: 50, sla: 100 });
    expect(summary.weightedReport.totalWeight).toBe("800.000000");
    expect(selectCount).toBe(2);
  });
  it("finds matching tasks in SQL before applying the result limit", async () => {
    const result = await readWorkQueue(access, marker + "-OLDEST"); expect(result).toHaveLength(1);
    expect(result[0].href).toContain("record=");
    expect(selectCount).toBe(1);
  });
  it("walks equal-timestamp cursor pages without missing or duplicating old guarantees", async () => {
    const result = await readDepositList(depositListQuery.parse({ q: marker }));
    expect(result.filtered).toHaveLength(620); expect(new Set(result.filtered.map(row => row.id)).size).toBe(620);
    const page = await readDepositListPage(depositListQuery.parse({ q: marker, page: 31 }));
    expect(page.total).toBe(620); expect(page.items).toHaveLength(20); expect(page.page).toBe(31);
  });
  it("searches old guarantees directly and does not expose other owners", async () => {
    expect(await searchDepositWorkItems(marker + "-OLDEST")).toHaveLength(1);
    access = { ...access, userId: otherId, subject: { ...access.subject!, userId: otherId, grants: [{ permission: "guarantee.case.read", scope: "OWN" }] } };
    expect(await searchDepositWorkItems(marker)).toHaveLength(0);
  });
});
