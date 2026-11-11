import { readFile } from "node:fs/promises";
import { parse } from "dotenv";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getDb, type Database } from "@/db";
import { poLines, profiles } from "@/db/schema";
import { databaseSslOptions } from "@/lib/database-ssl.mjs";
import { createPoTestClone } from "../../../tests/fixtures/po-test-clone";
import type { AuthorizationSubject } from "@/lib/authorization";
import { correctPoReceipt, createManualPo, getPoLine, getPoReport, listPoLines, PoDomainError, recordPoReceipt, updateManualPoLine, updatePoLine } from "./service";

const enabled = process.env.PO_TRACKING_STAGING_TEST === "1";
const marker = `POTEST-${Date.now()}-${randomUUID().slice(0, 8)}`;
const cloneName = `po_tracking_test_${Date.now()}`;
let db: Database;
let admin: postgres.Sql;
let runId: string;
let lineA: string;
let lineB: string;
let actorId: string;
let adminActor: { userId: string; subject: AuthorizationSubject };
let reader: { userId: string; subject: AuthorizationSubject };

function subject(grants: string[]): AuthorizationSubject {
  return { userId: actorId, teamIds: [], grants: grants.map((permission) => ({ permission, scope: "ALL" as const })), isPlatformAdmin: false };
}

/** Isolated database clone: migrations, grants and roles are real; nothing is
 * written to the staging database and the clone is dropped afterwards. */
beforeAll(async () => {
  if (!enabled) return;
  const env = parse(await readFile(".env.local", "utf8"));
  process.env.DATABASE_URL ??= env.DATABASE_URL;
  process.env.DATABASE_URL_MIGRATE ??= env.DATABASE_URL_MIGRATE;
  const runtime = new URL(process.env.DATABASE_URL!);
  expect(runtime.pathname).toBe("/permission_superapp_staging_20261104_1157");
  const elevated = new URL(process.env.DATABASE_URL_MIGRATE!);
  elevated.pathname = "/postgres";
  admin = postgres(elevated.href, { ...databaseSslOptions(), max: 1, prepare: false });
  await createPoTestClone(cloneName, elevated, runtime);
  runtime.pathname = `/${cloneName}`;
  const cloneOperatorUrl = new URL(elevated); cloneOperatorUrl.pathname = `/${cloneName}`;
  const cloneOperator = postgres(cloneOperatorUrl.href, { max: 1 });
  try { await cloneOperator.unsafe(await readFile("supabase/migrations/0066_po_unknown_price.sql", "utf8")); }
  finally { await cloneOperator.end(); }
  process.env.DATABASE_URL = runtime.href;
  delete (globalThis as typeof globalThis & { permissionNextSql?: unknown }).permissionNextSql;
  db = getDb();
  const [profile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.status, "active")).limit(1);
  if (!profile) throw new Error("No active profile available for the staging clone fixture");
  actorId = profile.id;
  adminActor = { userId: actorId, subject: subject([
    "po_tracking.po.read", "po_tracking.po.manage", "po_tracking.receipt.record",
    "po_tracking.receipt.correct", "po_tracking.price.read", "po_tracking.report.read", "po_tracking.import.manage",
  ]) };
  reader = { userId: actorId, subject: subject(["po_tracking.po.read"]) };

  runId = randomUUID();
  await db.execute(sql`insert into public.source_import_runs
    (id, source_system, entity_type, source_snapshot, status, source_count, imported_count, anomaly_count, checksum, started_at, finished_at)
    values (${runId}, 'po-tracking-test', 'po_line', ${marker}, 'reconciled', 2, 2, 0, ${marker}, now(), now())`);
  lineA = randomUUID();
  lineB = randomUUID();
  await db.insert(poLines).values([
    { id: lineA, importRunId: runId, sourceId: `${marker}!1`, sourceRowNumber: 1, poNumber: `${marker}-A`,
      materialCode: `${marker}-MAT-A`, description: "Isolated PO receipt fixture A", unit: "PC", orderedQty: "10",
      initialReceivedQty: "4", unitPrice: "100", poAmount: "1000", poReleaseDate: "2026-10-01", lastGrDate: "2026-10-05",
      etaDate: "2026-11-01", orderCode: "TESTORDER", vendorCode: "999", vendorName: "Test Vendor" },
    { id: lineB, importRunId: runId, sourceId: `${marker}!2`, sourceRowNumber: 2, poNumber: `${marker}-B`,
      materialCode: `${marker}-MAT-B`, description: "Isolated incomplete quantity fixture B", unit: "PC", orderedQty: null,
      initialReceivedQty: null, unitPrice: "50", poAmount: null, poReleaseDate: "2026-10-02" },
  ]);
}, 30_000);

afterAll(async () => {
  if (!enabled || !admin) return;
  await admin.unsafe(`drop database if exists ${cloneName} with (force)`);
  await admin.end();
});

describe.skipIf(!enabled)("PO tracking service against an isolated staging clone", () => {
  it("hides prices without the price grant and keeps totals server-side", async () => {
    const { listPoLines } = await import("./service");
    const page = await listPoLines(reader, { q: marker });
    expect(page.total).toBe(2);
    expect(page.priceVisible).toBe(false);
    expect(page.rows.every((row) => row.unitPrice === null && row.poAmount === null)).toBe(true);
    const detail = await getPoLine(reader, lineA);
    expect(detail?.line.unitPrice).toBeNull();
    expect(detail?.line.totals.outstanding?.toString()).toBe("6");
    const priced = await getPoLine(adminActor, lineA);
    expect(priced?.line.unitPrice).toBe("100.0000");
  });

  it("records multiple receipts with dates and references, deriving outstanding each time", async () => {
    await recordPoReceipt(adminActor, { lineId: lineA, receivedOn: "2026-11-01", quantity: "3", reference: `${marker}-R1`, note: "ล็อตแรก" });
    let detail = await getPoLine(adminActor, lineA);
    expect(detail?.line.totals.received?.toString()).toBe("7");
    expect(detail?.line.totals.outstanding?.toString()).toBe("3");
    expect(detail?.line.totals.delivery).toBe("partial");
    await recordPoReceipt(adminActor, { lineId: lineA, receivedOn: "2026-11-02", quantity: "3", reference: `${marker}-R2`, note: "" });
    detail = await getPoLine(adminActor, lineA);
    expect(detail?.line.totals.received?.toString()).toBe("10");
    expect(detail?.line.totals.outstanding?.toString()).toBe("0");
    expect(detail?.line.totals.delivery).toBe("received");
    expect(detail?.receipts.map((item) => item.reference)).toEqual([`${marker}-R1`, `${marker}-R2`]);
  });

  it("rejects over-receipt, invalid quantities, incomplete lines and unauthorized actors", async () => {
    await expect(recordPoReceipt(adminActor, { lineId: lineA, receivedOn: "2026-11-03", quantity: "1", reference: `${marker}-R3`, note: "" }))
      .rejects.toMatchObject({ code: "OVER_RECEIPT" });
    await expect(recordPoReceipt(adminActor, { lineId: lineA, receivedOn: "2026-11-03", quantity: "0", reference: `${marker}-R4`, note: "" }))
      .rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(recordPoReceipt(adminActor, { lineId: lineB, receivedOn: "2026-11-03", quantity: "1", reference: `${marker}-R5`, note: "" }))
      .rejects.toMatchObject({ code: "LINE_INCOMPLETE" });
    await expect(recordPoReceipt(reader, { lineId: lineA, receivedOn: "2026-11-03", quantity: "1", reference: `${marker}-R6`, note: "" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("corrects by void and replacement, keeping both rows and the audit trail", async () => {
    const detail = await getPoLine(adminActor, lineA);
    const first = detail!.receipts[0];
    await expect(correctPoReceipt(adminActor, { receiptId: first.id, reason: "x" })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    const { replacementId } = await correctPoReceipt(adminActor, {
      receiptId: first.id, reason: "นับจำนวนผิด",
      replacement: { receivedOn: "2026-11-01", quantity: "2", reference: `${marker}-R1FIX`, note: "แก้ยอด" },
    });
    const after = await getPoLine(adminActor, lineA);
    expect(after?.receipts).toHaveLength(3);
    const voided = after!.receipts.find((item) => item.id === first.id)!;
    expect(voided.voidedAt).not.toBeNull();
    expect(voided.voidReason).toBe("นับจำนวนผิด");
    expect(voided.voidedByName).toBeTruthy();
    const replacement = after!.receipts.find((item) => item.id === replacementId)!;
    expect(replacement.replacesReceiptId).toBe(first.id);
    expect(after?.line.totals.received?.toString()).toBe("9");
    expect(after?.line.totals.outstanding?.toString()).toBe("1");
    await expect(correctPoReceipt(adminActor, { receiptId: first.id, reason: "ซ้ำ" })).rejects.toMatchObject({ code: "RECEIPT_ALREADY_VOID" });
    await expect(db.execute(sql`update public.po_receipts set quantity = 99 where id = ${first.id}::uuid`)).rejects.toThrow();
    await expect(db.execute(sql`delete from public.po_receipts where id = ${replacement.id}::uuid`)).rejects.toThrow();
    const audit = await db.execute<{ action: string; replacementId: string | null }>(sql`
      select action, after->>'replacementReceiptId' as "replacementId" from public.audit_logs
      where module_id = 'po-tracking' and entity_id in (${first.id}, ${replacementId}) order by created_at`);
    expect([...audit].map((row) => row.action)).toEqual(["po.receipt.record", "po.receipt.correct"]);
    expect([...audit].at(-1)?.replacementId).toBe(replacementId);
  });

  it("updates ETA/status/note with optimistic versioning and rejects both ETA forms", async () => {
    await updatePoLine(adminActor, { lineId: lineA, version: 1, status: "on_hold", etaDate: "", etaText: "รอผู้ขายยืนยัน", note: "โทรตามแล้ว" });
    const detail = await getPoLine(adminActor, lineA);
    expect(detail?.line.status).toBe("on_hold");
    expect(detail?.line.etaText).toBe("รอผู้ขายยืนยัน");
    expect(detail?.line.note).toBe("โทรตามแล้ว");
    expect(detail?.line.version).toBe(2);
    await expect(updatePoLine(adminActor, { lineId: lineA, version: 1, status: "open", etaDate: "", etaText: "", note: "" }))
      .rejects.toMatchObject({ code: "STALE_VERSION" });
    await expect(updatePoLine(adminActor, { lineId: lineA, version: 2, status: "open", etaDate: "2026-11-20", etaText: "พร้อมส่ง", note: "" }))
      .rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("keeps imported source fields immutable and reports by unit", async () => {
    await expect(db.execute(sql`update public.po_lines set ordered_qty = 999 where id = ${lineA}::uuid`)).rejects.toThrow();
    await expect(db.execute(sql`delete from public.po_lines where id = ${lineA}::uuid`)).rejects.toThrow();
    const { getPoReport } = await import("./service");
    const report = await getPoReport({ userId: actorId, subject: subject(["po_tracking.report.read", "po_tracking.price.read", "po_tracking.import.manage"]) });
    expect(report.importRun?.status).toBe("reconciled");
    expect(report.units.find((unit) => unit.unit === "PC")!.lines).toBeGreaterThanOrEqual(2);
    await expect(getPoReport(reader)).rejects.toBeInstanceOf(PoDomainError);
  });

  it("renders real imported rows and report totals from the clone", async () => {
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { createElement } = await import("react");
    const { PoTrackingList, PoTrackingReport } = await import("@/features/po-tracking/po-tracking-list");
    const { listPoLines, getPoReport } = await import("./service");
    const all = await listPoLines(adminActor, {});
    expect(all.total).toBe(239);
    expect(all.rows).toHaveLength(50);
    const page = await listPoLines(adminActor, { q: "4032500121" });
    expect(page.rows).toHaveLength(2);
    expect(page.rows[0]?.sourceId).toBe("PO 26-10-26!3");
    const report = await getPoReport(adminActor);
    expect(report.counts.lines).toBe(239);
    expect(report.counts.incompleteLines).toBe(126);
    expect(report.units.find((unit) => unit.unit === "M")?.ordered).toBe("1206000.0000");
    const listHtml = renderToStaticMarkup(createElement(PoTrackingList, { data: page, report, today: "2026-11-10" }));
    expect(listHtml).toContain("4032500121");
    expect(listHtml).toContain("U02CFARSS-0012-BE0");
    expect(listHtml).toContain("ข้อมูลจำนวนไม่ครบ");
    const reportHtml = renderToStaticMarkup(createElement(PoTrackingReport, { report }));
    expect(reportHtml).toContain("ยอดตามหน่วยนับ");
    expect(reportHtml).toContain("d4f9057e4ecb");
  });

  it("creates a multi-line manual PO with no import lineage and one audit record", async () => {
    const poNumber = `${marker}-MANUAL`;
    const created = await createManualPo(adminActor, {
      poNumber, vendorCode: "01128119", vendorName: "Manual Vendor", orderCode: "MAN-ORDER", note: "",
      lines: [
        { materialCode: `${marker}-M1`, description: "ท่อแมนนวล", unit: "M", orderedQty: "100", unitPrice: "35.98", poReleaseDate: "2026-11-10", etaDate: "", etaText: "", note: "" },
        { materialCode: `${marker}-P1`, description: "ข้องอแมนนวล", unit: "PC", orderedQty: "20", unitPrice: "12.5", poReleaseDate: "2026-11-10", etaDate: "", etaText: "", note: "" },
      ],
    });
    expect(created.lineIds).toHaveLength(2);
    const list = await listPoLines(adminActor, { q: poNumber });
    expect(list.total).toBe(2);
    expect(list.rows.every((row) => row.origin === "manual" && row.sourceId === null)).toBe(true);
    expect(list.rows.map((row) => row.unit).sort()).toEqual(["M", "PC"]);
    expect(list.rows.find((row) => row.unit === "M")!.vendorCode).toBe("01128119");
    const detail = await getPoLine(adminActor, created.lineIds[0]);
    expect(detail?.importRun).toBeNull();
    expect(detail?.line.origin).toBe("manual");
    expect(detail?.line.totals.outstanding?.toString()).toBe("100");
    const audit = await db.execute<{ action: string; lineCount: number }>(sql`
      select action, (after->>'lineCount')::int as "lineCount" from public.audit_logs
      where module_id = 'po-tracking' and entity_id = ${created.lineIds[0]}`);
    expect([...audit].map((row) => [row.action, row.lineCount])).toEqual([["po.line.create", 2]]);
    const report = await getPoReport(adminActor);
    expect(report.units.find((unit) => unit.unit === "M")!.lines).toBeGreaterThan(1);
    expect(report.units.find((unit) => unit.unit === "PC")!.lines).toBeGreaterThan(1);
    expect(report.units.find((unit) => unit.unit === "M")!.ordered).not.toBe(report.units.find((unit) => unit.unit === "PC")!.ordered);
    const [lineage] = await db.execute<{ imported: number; manual: number; raw: number }>(sql`
      select (select count(*)::int from public.po_lines where origin = 'import') as imported,
        (select count(*)::int from public.po_lines where origin = 'manual') as manual,
        (select count(*)::int from public.source_import_rows) as raw`);
    expect(Number(lineage.imported)).toBe(239);
    expect(Number(lineage.manual)).toBe(2);
    expect(Number(lineage.raw)).toBe(237);
  });

  it("records receipts on a manual line, rejects over-receipt and locks the unit", async () => {
    const list = await listPoLines(adminActor, { q: `${marker}-MANUAL`, unit: "M" });
    const lineId = list.rows[0].id;
    await recordPoReceipt(adminActor, { lineId, receivedOn: "2026-11-09", quantity: "30", reference: `${marker}-MR1`, note: "" });
    let detail = await getPoLine(adminActor, lineId);
    expect(detail?.line.totals.received?.toString()).toBe("30");
    expect(detail?.line.totals.outstanding?.toString()).toBe("70");
    await expect(recordPoReceipt(adminActor, { lineId, receivedOn: "2026-11-09", quantity: "71", reference: `${marker}-MR2`, note: "" }))
      .rejects.toMatchObject({ code: "OVER_RECEIPT" });
    await expect(updateManualPoLine(adminActor, {
      lineId, version: 1, poNumber: `${marker}-MANUAL`, materialCode: `${marker}-M1`, description: "ท่อแมนนวล",
      unit: "PC", orderedQty: "120", initialReceivedQty: "0", unitPrice: "40", poReleaseDate: "2026-11-10",
      lastGrDate: "", etaDate: "", etaText: "", orderCode: "MAN-ORDER", vendorCode: "01128119",
      vendorName: "Manual Vendor", status: "open", note: "",
    })).rejects.toMatchObject({ code: "UNIT_LOCKED" });
  });

  it("edits manual master data with optimistic versioning and computes the PO amount", async () => {
    const list = await listPoLines(adminActor, { q: `${marker}-MANUAL`, unit: "M" });
    const lineId = list.rows[0].id;
    await updateManualPoLine(adminActor, {
      lineId, version: 1, poNumber: `${marker}-MANUAL`, materialCode: `${marker}-M1-EDIT`, description: "ท่อแมนนวลแก้ไข",
      unit: "M", orderedQty: "120", initialReceivedQty: "0", unitPrice: "40", poReleaseDate: "2026-11-10",
      lastGrDate: "", etaDate: "", etaText: "รอตรวจรับ", orderCode: "MAN-ORDER", vendorCode: "01128119",
      vendorName: "Manual Vendor", status: "on_hold", note: "แก้ไขข้อมูลหลัก",
    });
    const detail = await getPoLine(adminActor, lineId);
    expect(detail?.line.materialCode).toBe(`${marker}-M1-EDIT`);
    expect(detail?.line.version).toBe(2);
    expect(detail?.line.status).toBe("on_hold");
    expect(detail?.line.etaText).toBe("รอตรวจรับ");
    expect(detail?.line.poAmount).toBe("4800.00");
    expect(detail?.line.totals.outstanding?.toString()).toBe("90");
    expect(detail?.line.sourceId).toBeNull();
    await expect(updateManualPoLine(adminActor, {
      lineId, version: 1, poNumber: `${marker}-MANUAL`, materialCode: `${marker}-M1-EDIT`, description: "ท่อแมนนวลแก้ไข",
      unit: "M", orderedQty: "120", initialReceivedQty: "0", unitPrice: "40", poReleaseDate: "2026-11-10",
      lastGrDate: "", etaDate: "", etaText: "รอตรวจรับ", orderCode: "MAN-ORDER", vendorCode: "01128119",
      vendorName: "Manual Vendor", status: "on_hold", note: "แก้ไขข้อมูลหลัก",
    })).rejects.toMatchObject({ code: "STALE_VERSION" });
    const audit = await db.execute<{ action: string }>(sql`
      select action from public.audit_logs where module_id = 'po-tracking' and entity_id = ${lineId} order by created_at`);
    expect([...audit].filter((row) => row.action === "po.line.update")).toHaveLength(1);
  });

  it("keeps imported lines immutable through both the manual editor and direct SQL", async () => {
    await expect(updateManualPoLine(adminActor, {
      lineId: lineA, version: 1, poNumber: `${marker}-A`, materialCode: `${marker}-MAT-A`, description: "Isolated PO receipt fixture A",
      unit: "PC", orderedQty: "99", initialReceivedQty: "4", unitPrice: "100", poReleaseDate: "2026-10-01",
      lastGrDate: "", etaDate: "", etaText: "", orderCode: "TESTORDER", vendorCode: "999",
      vendorName: "Test Vendor", status: "open", note: "",
    })).rejects.toMatchObject({ code: "IMPORTED_IMMUTABLE" });
    await expect(db.execute(sql`update public.po_lines set ordered_qty = 999 where id = ${lineA}::uuid`)).rejects.toThrow();
  });

  it("denies manual PO creation without the approved manage and price grants", async () => {
    const input = {
      poNumber: `${marker}-DENIED`, vendorCode: "", vendorName: "", orderCode: "", note: "",
      lines: [{ materialCode: `${marker}-D`, description: "denied", unit: "PC" as const, orderedQty: "1", unitPrice: "1", poReleaseDate: "2026-11-10", etaDate: "", etaText: "", note: "" }],
    };
    await expect(createManualPo(reader, input)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(createManualPo({ userId: actorId, subject: subject(["po_tracking.po.manage"]) }, input)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("creates unknown-price manual PO and adds a price later without fabricating zero", async () => {
    const input = { poNumber: `${marker}-UNKNOWN`, vendorCode: "", vendorName: "", orderCode: "PROJECT-01", note: "",
      lines: [{ materialCode: "UNKNOWN-MAT", description: "รอราคา", unit: "PC" as const, orderedQty: "10", unitPrice: "", poReleaseDate: "2026-11-11", etaDate: "", etaText: "", note: "" }] };
    const created = await createManualPo(adminActor, input);
    let detail = await getPoLine(adminActor, created.lineIds[0]);
    expect(detail?.line.unitPrice).toBeNull();
    expect(detail?.line.poAmount).toBeNull();
    const report = await getPoReport(adminActor);
    expect(report.units.find(unit => unit.unit === "PC")?.unknownAmountLines).toBeGreaterThanOrEqual(1);
    await updateManualPoLine(adminActor, { ...input.lines[0], lineId: created.lineIds[0], version: 1, poNumber: input.poNumber,
      unitPrice: "12.50", initialReceivedQty: "0", lastGrDate: "", orderCode: "PROJECT-01", vendorCode: "", vendorName: "", status: "open" });
    detail = await getPoLine(adminActor, created.lineIds[0]);
    expect(detail?.line.unitPrice).toBe("12.5000");
    expect(detail?.line.poAmount).toBe("125.00");
  });
});
