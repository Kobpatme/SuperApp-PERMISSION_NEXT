import { readFile } from "node:fs/promises";
import { poTestEnvironment } from "../../../tests/fixtures/po-test-environment";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getDb } from "@/db";
import { previewPoExcel, confirmPoExcel } from "./excel-service";
import type { PoActor } from "./service";
import { excelTestRow, makePoWorkbook } from "../../../tests/fixtures/po-excel";
import { createPoTestClone } from "../../../tests/fixtures/po-test-clone";

const enabled = process.env.PO_EXCEL_INTEGRATION === "1";
const cloneName = `po_excel_test_${Date.now()}`;
let operator: postgres.Sql;
let actor: PoActor;
function file(po: string, overrides: Record<string, string> = {}) {
  const bytes = makePoWorkbook([{ ...excelTestRow(po), ...overrides }], [...Object.keys(excelTestRow()), "Note"]);
  return new File([Uint8Array.from(bytes)], "test.xlsx");
}
beforeAll(async () => {
  if (!enabled) return;
  const env = await poTestEnvironment();
  const runtime = new URL(env.DATABASE_URL), elevated = new URL(env.DATABASE_URL_MIGRATE);
  if (!["/permission_superapp_staging_20261104_1157", "/permission_next_po_test"].includes(runtime.pathname) || ![runtime, elevated].every(u => ["127.0.0.1", "localhost"].includes(u.hostname))) throw new Error("Local staging clone required");
  elevated.pathname = "/postgres";
  operator = postgres(elevated.href, { max: 1, prepare: false });
  await createPoTestClone(cloneName, elevated, runtime);
  const cloneOperatorUrl = new URL(elevated); cloneOperatorUrl.pathname = `/${cloneName}`;
  const cloneOperator = postgres(cloneOperatorUrl.href, { max: 1 });
  try { await cloneOperator.unsafe(await readFile("supabase/migrations/0066_po_unknown_price.sql", "utf8")); }
  finally { await cloneOperator.end(); }
  runtime.pathname = `/${cloneName}`;
  process.env.DATABASE_URL = runtime.href;
  delete (globalThis as typeof globalThis & { permissionNextSql?: unknown }).permissionNextSql;
  const [profile] = await getDb().execute<{ id: string }>(sql`select id from profiles where status='active' limit 1`);
  actor = { userId: profile.id, subject: { userId: profile.id, teamIds: [], isPlatformAdmin: false,
    grants: ["po_tracking.import.manage", "po_tracking.po.manage", "po_tracking.price.read"].map(permission => ({ permission, scope: "ALL" as const })) } };
}, 30000);
afterAll(async () => {
  if (!enabled || !operator) return;
  await operator.unsafe(`drop database if exists ${cloneName} with (force)`);
  await operator.end();
});
describe.skipIf(!enabled)("Excel import in isolated PostgreSQL clone", () => {
  it("rejects unauthorized users before reading or writing upload data", async () => {
    await expect(previewPoExcel({ ...actor, subject: null }, file("EXCEL-DENIED"))).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(confirmPoExcel({ ...actor, subject: null }, file("EXCEL-DENIED"), "x", [2])).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("previews without writes, creates source lineage and audit atomically, and blocks replay", async () => {
    const upload = file("EXCEL-CREATE");
    const preview = await previewPoExcel(actor, upload);
    expect(preview.decisions[0].kind).toBe("new");
    const [before] = await getDb().execute<{ n: number }>(sql`select count(*)::int n from po_lines where po_number='EXCEL-CREATE'`);
    expect(before.n).toBe(0);
    expect(await confirmPoExcel(actor, upload, preview.digest, [2])).toEqual({ added: 1, updated: 0 });
    const [stored] = await getDb().execute<{ n: number; audit: number; lineage: number }>(sql`select
      (select count(*)::int from po_lines where po_number='EXCEL-CREATE') n,
      (select count(*)::int from audit_logs a join po_lines l on a.entity_id=l.id::text where l.po_number='EXCEL-CREATE' and a.action='po.excel.create') audit,
      (select count(*)::int from source_import_rows r join po_lines l on r.target_entity_id=l.id where l.po_number='EXCEL-CREATE') lineage`);
    expect(stored).toEqual({ n: 1, audit: 1, lineage: 1 });
    await expect(confirmPoExcel(actor, upload, preview.digest, [2])).rejects.toThrow("เปลี่ยน");
    expect((await previewPoExcel(actor, upload)).decisions[0].kind).toBe("unchanged");
  });
  it("updates only ETA/note and preserves master data, receipts and previous audit", async () => {
    const upload = file("EXCEL-CREATE", { ETA: "รอส่ง", Note: "ติดตามแล้ว" });
    const preview = await previewPoExcel(actor, upload);
    expect(preview.decisions[0].kind).toBe("update");
    expect(await confirmPoExcel(actor, upload, preview.digest, [2])).toEqual({ added: 0, updated: 1 });
    const [row] = await getDb().execute<{ eta: string; note: string; price: string; quantity: string; version: number }>(sql`select eta_text eta,note,unit_price::text price,ordered_qty::text quantity,version from po_lines where po_number='EXCEL-CREATE'`);
    expect(row).toEqual({ eta: "รอส่ง", note: "ติดตามแล้ว", price: "35.9800", quantity: "10.0000", version: 2 });
  });
  it("imports an unknown price as NULL, distinguishes zero and protects immutable imported prices", async () => {
    const upload = file("EXCEL-UNKNOWN", { "Unit Price": "", "PO Amount": "" });
    const preview = await previewPoExcel(actor, upload);
    expect(preview.errors).toEqual([]);
    expect(await confirmPoExcel(actor, upload, preview.digest, [2])).toEqual({ added: 1, updated: 0 });
    const [row] = await getDb().execute<{ price: string | null; amount: string | null }>(sql`select unit_price::text price,po_amount::text amount from po_lines where po_number='EXCEL-UNKNOWN'`);
    expect(row).toEqual({ price: null, amount: null });
    await expect(getDb().execute(sql`update po_lines set unit_price=0,version=version+1 where po_number='EXCEL-UNKNOWN'`)).rejects.toThrow();
    const zero = file("EXCEL-ZERO", { "Unit Price": "0", "PO Amount": "0" });
    const zeroPreview = await previewPoExcel(actor, zero);
    await confirmPoExcel(actor, zero, zeroPreview.digest, [2]);
    const [priced] = await getDb().execute<{ price: string }>(sql`select unit_price::text price from po_lines where po_number='EXCEL-ZERO'`);
    expect(priced.price).toBe("0.0000");
  });
  it("refuses financial conflicts even when selected by a forged confirmation", async () => {
    const upload = file("EXCEL-CREATE", { "Unit Price": "100" });
    const preview = await previewPoExcel(actor, upload);
    expect(preview.decisions[0].kind).toBe("conflict");
    await expect(confirmPoExcel(actor, upload, preview.digest, [2])).rejects.toThrow("ขัดแย้ง");
  });
  it("rejects a stale preview when another user edits the line", async () => {
    const upload = file("EXCEL-CREATE", { ETA: "เปลี่ยน ETA" });
    const preview = await previewPoExcel(actor, upload);
    await getDb().execute(sql`update po_lines set version=version+1,note='concurrent edit' where po_number='EXCEL-CREATE'`);
    await expect(confirmPoExcel(actor, upload, preview.digest, [2])).rejects.toThrow("เปลี่ยน");
  });
  it("serializes simultaneous confirmations so only one creates the same PO line", async () => {
    const upload = file("EXCEL-CONCURRENT");
    const preview = await previewPoExcel(actor, upload);
    const results = await Promise.allSettled([confirmPoExcel(actor, upload, preview.digest, [2]), confirmPoExcel(actor, upload, preview.digest, [2])]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    const [row] = await getDb().execute<{ n: number }>(sql`select count(*)::int n from po_lines where po_number='EXCEL-CONCURRENT'`);
    expect(row.n).toBe(1);
  });
  it("does not block unrelated receipt writers with a whole-table lock", async () => {
    const env = await poTestEnvironment(), url = new URL(env.DATABASE_URL_MIGRATE); url.pathname = `/${cloneName}`;
    const blocker = postgres(url.href, { max: 1, prepare: false });
    const connection = await blocker.reserve();
    try {
      await connection`begin`;
      await connection`lock table public.po_receipts in row exclusive mode`;
      const upload = file("EXCEL-UNRELATED-LOCK");
      const preview = await previewPoExcel(actor, upload);
      await expect(confirmPoExcel(actor, upload, preview.digest, [2])).resolves.toMatchObject({ added: 1 });
    } finally { await connection`rollback`; connection.release(); await blocker.end(); }
  }, 10000);
  it("rolls back PO, source lineage and run if the central audit cannot be written", async () => {
    const env = await poTestEnvironment();
    const elevated = new URL(env.DATABASE_URL_MIGRATE); elevated.pathname = `/${cloneName}`;
    const fixture = postgres(elevated.href, { max: 1, prepare: false });
    try {
      await fixture.unsafe(`create function public.po_excel_test_audit_failure() returns trigger language plpgsql as $$ begin
        if new.action='po.excel.create' then raise exception 'synthetic audit failure'; end if; return new; end $$;
        create trigger po_excel_test_audit_failure before insert on public.audit_logs for each row execute function public.po_excel_test_audit_failure()`);
      const upload = file("EXCEL-ROLLBACK");
      const preview = await previewPoExcel(actor, upload);
      const [before] = await getDb().execute<{ runs: number; lineage: number }>(sql`select
        (select count(*)::int from source_import_runs) runs,(select count(*)::int from source_import_rows) lineage`);
      await expect(confirmPoExcel(actor, upload, preview.digest, [2])).rejects.toThrow();
      const [after] = await getDb().execute<{ runs: number; lineage: number; lines: number }>(sql`select
        (select count(*)::int from source_import_runs) runs,(select count(*)::int from source_import_rows) lineage,
        (select count(*)::int from po_lines where po_number='EXCEL-ROLLBACK') lines`);
      expect(after).toEqual({ ...before, lines: 0 });
    } finally {
      await fixture.unsafe("drop trigger if exists po_excel_test_audit_failure on public.audit_logs; drop function if exists public.po_excel_test_audit_failure()");
      await fixture.end();
    }
  });
});
