import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as coreSchema from "@/db/schema";
import golden from "../../../../tests/fixtures/metrix-golden/validation.json";
import { ductRentalCapabilities } from "../capabilities";
import { createRequest, changeRequest, readRequest, listRequests } from "../server/requests";
import type { DuctContext } from "../server/transaction";
import { createRenewal, reviewRenewal, advanceRenewal, readRenewal, createCancellation, changeCancellation } from "../server/processes";
import { generateNtDocument, downloadDocument, uploadDocument, uploadAnnualDocument } from "../server/files";
import { assignSignature, revokeSignature, signDocument, previewSignature, saveSignatureAsset, changeSignatureAsset, readSigning, readSignatureAsset } from "../server/signing";
import { readTracking } from "../server/tracking";

const dbMock = vi.hoisted(() => vi.fn());
vi.mock("../server/db", () => ({ getDuctRentalDb: dbMock }));

describe.skipIf(process.env.DUCT_RENTAL_INTEGRATION !== "1")("duct services: real isolated PostgreSQL / constrained runtime", () => {
  let operator: ReturnType<typeof postgres>;
  const ctx = (id: string): DuctContext => ({ actorId: id, requestId: randomUUID() });
  const design = golden.fixtures[0].input;
  beforeAll(async () => {
    const url = new URL(process.env.DUCT_RENTAL_TEST_DATABASE_URL!);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.pathname !== "/permission_next_duct_rental_test") throw new Error("Guarded isolated database required");
    operator = postgres(url.href, { max: 6, prepare: false, onnotice: () => {} });
    vi.stubEnv("DUCT_RENTAL_STORAGE_DIR", `${process.cwd()}/.data/duct-rental-test-private`);
    await operator`update core_module_settings set enabled=true where module_id='duct-rental'`;
    const db = drizzle(operator, { schema: coreSchema });
    dbMock.mockReturnValue({ transaction: <T>(body: Parameters<typeof db.transaction<T>>[0]) => db.transaction(async tx => {
      await tx.execute(sql`set local role duct_rental_runtime`); return body(tx);
    }) });
  });
  afterAll(async () => { await operator`update core_module_settings set enabled=false where module_id='duct-rental'`; await operator?.end(); });
  async function user(codes = ductRentalCapabilities.map(cap => cap.code), scope = "ALL", teamId?: string) {
    const id = randomUUID(), role = randomUUID(), assignment = randomUUID();
    await operator`insert into profiles(id,email,status) values(${id},${`${id}@example.test`},'active')`;
    await operator`insert into local_credentials(user_id,password_hash) values(${id},'synthetic-non-login-hash')`;
    await operator`insert into roles(id,code,name) values(${role},${`duct-fixture-${role}`},'ข้อมูลทดสอบโมดูลท่อ')`;
    for (const code of codes) await operator`insert into role_permissions(role_id,permission_code) values(${role},${code})`;
    await operator`insert into user_role_assignments(id,user_id,role_id) values(${assignment},${id},${role})`;
    await operator`insert into data_scope_grants(assignment_id,scope_type,selected_team_id) values(${assignment},${scope},${scope === "SELECTED_TEAMS" ? teamId! : null})`;
    if (teamId && scope === "TEAM") await operator`insert into user_teams(user_id,team_id) values(${id},${teamId})`;
    return ctx(id);
  }
  async function runtime<T>(actor: DuctContext, run: (tx: postgres.TransactionSql) => Promise<T>) {
    return operator.begin(async tx => { await tx.unsafe("set local role duct_rental_runtime"); await tx`select set_config('app.user_id',${actor.actorId},true)`; return run(tx); }) as Promise<T>;
  }
  async function files(requestId: string, actor: DuctContext, phase: string, kind: string) {
    const id = randomUUID();
    await runtime(actor, async tx => { await tx`insert into duct_rental_documents(id,request_id,phase,file_type,name,media_type,size_bytes,checksum_sha256,storage_key,created_by) values(${id},${requestId},${phase},${kind},${`${kind}.pdf`},'application/pdf',10,${"a".repeat(64)},${`fixture/${id}.pdf`},${actor.actorId})`; });
    return id;
  }
  async function advance(id: string, version: number, phase: string, actor: DuctContext, data: Record<string, unknown> = {}) {
    const accepted = await changeRequest(id, "accept", version, {}, randomUUID(), actor);
    const result = await changeRequest(id, "submit", accepted.version, data, randomUUID(), actor);
    expect(result.phase).not.toBe(phase); return result;
  }
  async function active(actor: DuctContext, yearlyFee = "0.10") {
    const draft = await createRequest({ ...design, ownerDuct: "TRUE" }, null, randomUUID(), actor);
    let result = await advance(draft.id, 1, "DESIGN", actor);
    await files(draft.id, actor, "DRAFTSMAN", "drawing");
    result = await advance(draft.id, result.version, "DRAFTSMAN", actor);
    await files(draft.id, actor, "3RD_PARTY_1", "rate_notice"); await files(draft.id, actor, "3RD_PARTY_1", "invoice");
    result = await advance(draft.id, result.version, "3RD_PARTY_1", actor, { rate: { monthlyFee: "99.50", yearlyFee } });
    result = await advance(draft.id, result.version, "PERMISSION_3", actor);
    for (const kind of ["contract", "receipt", "memo"]) await files(draft.id, actor, "3RD_PARTY_2", kind);
    result = await advance(draft.id, result.version, "3RD_PARTY_2", actor, { guarantee: { contractNumber: "TEST", fullAmount: "1.005", paymentType: "เงินสด", venderCode: "1129267", receiptNumber: "TEST" } });
    expect(result.phase).toBe("COMPLETE"); return result;
  }
  it("creates verified-owner drafts and exactly one evidence set on idempotent replay", async () => {
    const actor = await user(), key = randomUUID();
    const [a, b] = await Promise.all([createRequest(design, null, key, actor), createRequest(design, null, key, actor)]);
    expect(a).toEqual(b); expect((await readRequest(a.id, actor)).ownerId).toBe(actor.actorId);
    for (const table of ["audit_logs", "activity_events", "outbox_messages"]) {
      const column = table === "outbox_messages" ? "aggregate_id" : "entity_id";
      expect((await operator.unsafe(`select count(*)::int as n from ${table} where ${column}=$1`, [a.id]))[0].n).toBe(1);
    }
    await expect(createRequest({ ...design, projectName: "ข้อมูลอื่น" }, null, key, actor)).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
    await expect(createRequest({ ...design, diameter: 1 }, null, randomUUID(), actor)).rejects.toThrow();
  });
  it("saves incomplete DESIGN drafts but validates every required field on submission", async () => {
    const actor = await user(), draft = await createRequest({ projectName: "ร่างข้อมูลจำลอง" }, null, randomUUID(), actor, true);
    expect((await readRequest(draft.id, actor)).design).toEqual({ projectName: "ร่างข้อมูลจำลอง" });
    await expect(changeRequest(draft.id, "submit", 1, {}, randomUUID(), actor)).rejects.toThrow();
    const saved = await changeRequest(draft.id, "save", 1, { design: { projectName: "แก้ร่าง" } }, randomUUID(), actor);
    expect((await changeRequest(draft.id, "submit", saved.version, { design }, randomUUID(), actor)).phase).toBe("DRAFTSMAN");
  });
  it("requires a new NT original after design edits, preserving signer selection before generation", async () => {
    const actor = await user(), signer = await user(["duct_rental.module.view", "duct_rental.signoff.sign"], "OWN"), row = await createRequest(design, null, randomUUID(), actor);
    const old = await generateNtDocument(row.id, row.version, randomUUID(), actor);
    let changed = await changeRequest(row.id, "save", row.version, { design: { ...design, projectName: "แก้ข้อมูลหลังสร้าง NT" } }, randomUUID(), actor);
    changed = await advance(row.id, changed.version, "DESIGN", actor);
    await files(row.id, actor, "DRAFTSMAN", "drawing"); changed = await advance(row.id, changed.version, "DRAFTSMAN", actor);
    await expect(assignSignature(row.id, { version: changed.version, documentId: old.id, assigneeId: signer.actorId }, randomUUID(), actor)).rejects.toMatchObject({ code: "STALE_DOCUMENT" });
    const config = await assignSignature(row.id, { version: changed.version, assigneeId: signer.actorId }, randomUUID(), actor); expect(config.taskCreated).toBe(false);
    const current = await generateNtDocument(row.id, changed.version, randomUUID(), actor);
    const task = (await readSigning(signer)).tasks.find(item => item.documentId === current.id); expect(task?.status).toBe("pending");
  });
  it("enforces own, team, selected teams and live grant/account revocation", async () => {
    const team = randomUUID(); await operator`insert into teams(id,code,name) values(${team},${team},'ทีมทดสอบ')`;
    const creator = await user(), own = await user(["duct_rental.module.view"], "OWN");
    const draft = await createRequest(design, team, randomUUID(), creator);
    await expect(readRequest(draft.id, own)).rejects.toMatchObject({ status: 404 });
    for (const scope of ["TEAM", "SELECTED_TEAMS"]) expect((await readRequest(draft.id, await user(["duct_rental.module.view"], scope, team))).id).toBe(draft.id);
    const actor = await user(["duct_rental.module.view", "duct_rental.request.create"], "OWN");
    await createRequest(design, null, randomUUID(), actor);
    await operator`delete from user_role_assignments where user_id=${actor.actorId}`;
    await expect(listRequests({}, actor)).rejects.toMatchObject({ status: 403 });
    for (const state of ["inactive", "password"]) {
      const account = await user();
      if (state === "inactive") await operator`update profiles set status='inactive' where id=${account.actorId}`;
      else await operator`update local_credentials set must_change_password=true where user_id=${account.actorId}`;
      await expect(listRequests({}, account)).rejects.toMatchObject({ status: 403 });
    }
  });
  it("allows one simultaneous acceptance and denies stale/invalid state, skip and immutable scope", async () => {
    const actor = await user(), draft = await createRequest(design, null, randomUUID(), actor);
    const results = await Promise.allSettled([changeRequest(draft.id, "accept", 1, {}, randomUUID(), actor), changeRequest(draft.id, "accept", 1, {}, randomUUID(), actor)]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    await expect(runtime(actor, async tx => { await tx`update duct_rental_requests set phase='COMPLETE',version=version+1 where id=${draft.id}`; })).rejects.toMatchObject({ code: "42501" });
    await expect(runtime(actor, async tx => { await tx`update duct_rental_requests set owner_id=${randomUUID()},version=version+1 where id=${draft.id}`; })).rejects.toMatchObject({ code: "23514" });
    expect((await readRequest(draft.id, actor)).version).toBe(2);
    const submitted = await changeRequest(draft.id, "submit", 2, {}, randomUUID(), actor);
    await expect(changeRequest(draft.id, "submit", submitted.version, {}, randomUUID(), actor)).rejects.toMatchObject({ code: "STATE" });
  });
  async function permissionOne(actor: DuctContext) {
    const draft = await createRequest({ ...design, ownerDuct: "NT" }, null, randomUUID(), actor);
    let row = await changeRequest(draft.id, "submit", 1, {}, randomUUID(), actor);
    await files(draft.id, actor, "DRAFTSMAN", "drawing");
    row = await advance(draft.id, row.version, "DRAFTSMAN", actor);
    expect(row.phase).toBe("PERMISSION_1"); return row;
  }
  it("restricts phase readers to current/touched work and preserves file visibility", async () => {
    const actor = await user(), draft = await createRequest(design, null, randomUUID(), actor);
    const reader = await user(["duct_rental.module.view", "duct_rental.document.read", "duct_rental.draftsman.accept"]);
    await expect(readRequest(draft.id, reader)).rejects.toMatchObject({ status: 404 });
    await changeRequest(draft.id, "submit", 1, {}, randomUUID(), actor);
    await files(draft.id, actor, "DRAFTSMAN", "memo"); await files(draft.id, actor, "DRAFTSMAN", "drawing");
    expect((await readRequest(draft.id, reader)).files.map(file => file.fileType)).toEqual(["drawing"]);
  });
  it("signer can sign only assigned current original and cannot edit requests or another user's assets", async () => {
    const actor = await user(), signer = await user(["duct_rental.module.view", "duct_rental.signoff.sign"]), other = await user(["duct_rental.module.view", "duct_rental.signoff.sign"]);
    let row = await permissionOne(actor);
    const doc = await generateNtDocument(row.id, row.version, randomUUID(), actor, "NT-REF-TEST");
    row = { ...row, version: doc.version };
    expect((await readRequest(row.id, actor)).design.permissionRequestNumber).toBe("NT-REF-TEST");
    const task = await assignSignature(row.id, { version: row.version, documentId: doc.id, assigneeId: signer.actorId }, randomUUID(), actor);
    const png = await readFile("tests/fixtures/metrix-golden/signature.png");
    const asset = await saveSignatureAsset("ลายเซ็นจำลอง", png, true, randomUUID(), signer);
    const placement = { version: 1, assetId: asset.id, page: 4, x: 0, y: 0, width: 60.7, height: 35.36, rotation: 0, scale: 1 };
    await expect(changeRequest(row.id, "save", row.version, {}, randomUUID(), signer)).rejects.toMatchObject({ status: 404 });
    await expect(signDocument(task.id, placement, randomUUID(), other)).rejects.toMatchObject({ status: 403 });
    await expect(readSignatureAsset(asset.id, other)).rejects.toMatchObject({ status: 404 });
    await expect(changeSignatureAsset(asset.id, "archive", randomUUID(), other)).rejects.toMatchObject({ status: 404 });
    const key = randomUUID(), signed = await signDocument(task.id, placement, key, signer);
    expect(await signDocument(task.id, placement, key, signer)).toEqual(signed);
    const output = await downloadDocument(signed.documentId, signer);
    expect((await PDFDocument.load(output.bytes)).getPageCount()).toBe(5);
    await expect(signDocument(task.id, placement, randomUUID(), signer)).rejects.toMatchObject({ code: "STATE" });
    expect((await operator`select status from duct_rental_sign_tasks where id=${task.id}`)[0].status).toBe("signed");
    expect((await operator`select count(*)::int n from notifications where recipient_id=${signer.actorId}`)[0].n).toBeGreaterThanOrEqual(1);
    const firstAsset = await saveSignatureAsset("ลายเซ็นที่สอง", png, false, randomUUID(), signer);
    await changeSignatureAsset(asset.id, "archive", randomUUID(), signer);
    expect((await readSigning(signer)).assets).toEqual([expect.objectContaining({ id: firstAsset.id, isDefault: true })]);
    for (const kind of ["permission_letter", "confirmation_form"]) await files(row.id, actor, "PERMISSION_1", kind);
    let workflow = await advance(row.id, row.version, "PERMISSION_1", actor);
    await expect(changeRequest(row.id, "submit", workflow.version, {}, randomUUID(), actor)).rejects.toThrow();
    await files(row.id, actor, "INSTALL", "confirmation_form");
    workflow = await advance(row.id, workflow.version, "INSTALL", actor, { install: { actualStartCoords: "13,100", actualEndCoords: "14,101", actualDistance: 20, markLength: "20", installDate: "2031-01-01" } });
    const accepted = await changeRequest(row.id, "accept", workflow.version, {}, randomUUID(), actor);
    await expect(changeRequest(row.id, "submit", accepted.version, {}, randomUUID(), actor)).rejects.toMatchObject({ code: "DOCUMENT_REQUIRED" });
    await files(row.id, actor, "DRAFTSMAN_2", "drawing");
    workflow = await changeRequest(row.id, "submit", accepted.version, {}, randomUUID(), actor);
    for (const kind of ["permission_letter", "confirmation_form"]) await files(row.id, actor, "PERMISSION_2", kind);
    workflow = await advance(row.id, workflow.version, "PERMISSION_2", actor);
    for (const kind of ["rate_notice", "invoice"]) await files(row.id, actor, "3RD_PARTY_1", kind);
    workflow = await advance(row.id, workflow.version, "3RD_PARTY_1", actor, { rate: { monthlyFee: "1.005", yearlyFee: "9.995" } });
    workflow = await advance(row.id, workflow.version, "PERMISSION_3", actor);
    for (const kind of ["contract", "receipt", "memo"]) await files(row.id, actor, "3RD_PARTY_2", kind);
    workflow = await advance(row.id, workflow.version, "3RD_PARTY_2", actor, { guarantee: { contractNumber: "NT-TEST", fullAmount: "0.30", paymentType: "เงินสด", venderCode: "1129267", receiptNumber: "TEST" } });
    expect(workflow.phase).toBe("COMPLETE");
  }, 30000);
  it("revocation and NT regeneration invalidate assigned tasks and prevent stale document signing", async () => {
    const actor = await user(), signer = await user(["duct_rental.module.view", "duct_rental.signoff.sign"]), row = await permissionOne(actor);
    const doc = await generateNtDocument(row.id, row.version, randomUUID(), actor), asset = await saveSignatureAsset("จำลอง", await readFile("tests/fixtures/metrix-golden/signature.png"), true, randomUUID(), signer);
    const task = await assignSignature(row.id, { version: row.version, documentId: doc.id, assigneeId: signer.actorId }, randomUUID(), actor);
    await revokeSignature(task.id, 1, randomUUID(), actor);
    const placement = { version: 1, assetId: asset.id, page: 4, x: 0, y: 0, width: 60.7, height: 35.36, rotation: 0, scale: 1 };
    await expect(signDocument(task.id, placement, randomUUID(), signer)).rejects.toMatchObject({ code: "STATE" });
    const next = await assignSignature(row.id, { version: row.version, documentId: doc.id, assigneeId: signer.actorId }, randomUUID(), actor);
    await generateNtDocument(row.id, row.version, randomUUID(), actor);
    await expect(signDocument(next.id, placement, randomUUID(), signer)).rejects.toMatchObject({ code: "STATE" });
    await expect(assignSignature(row.id, { version: row.version, documentId: doc.id, assigneeId: signer.actorId }, randomUUID(), actor)).rejects.toMatchObject({ status: 409 });
  }, 30000);
  it("memo uploader clears only the missing marker; invalid file and phase edits are rejected", async () => {
    const actor = await user(), row = await permissionOne(actor);
    const saved = await changeRequest(row.id, "save", row.version, { missingDocs: "รอ Memo" }, randomUUID(), actor);
    const uploader = await user(["duct_rental.module.view", "duct_rental.document.read", "duct_rental.document.upload"]);
    const pdf = await PDFDocument.create(); pdf.addPage(); const bytes = await pdf.save();
    const result = await uploadDocument(row.id, { version: saved.version, fileType: "memo" }, { name: "memo.pdf", bytes }, randomUUID(), uploader);
    expect((await readRequest(row.id, actor)).missingDocs).toBe("");
    await expect(changeRequest(row.id, "save", result.version, {}, randomUUID(), uploader)).rejects.toMatchObject({ status: 403 });
    await expect(uploadDocument(row.id, { version: result.version, fileType: "memo" }, { name: "memo.pdf", bytes: Buffer.from("fake PDF") }, randomUUID(), uploader)).rejects.toThrow();
  });
  it("remembers a qualified signer before NT generation and reissues only the current original", async () => {
    const actor = await user(), signer = await user(["duct_rental.module.view", "duct_rental.signoff.sign"]), row = await permissionOne(actor);
    await expect(assignSignature(row.id, { version: row.version, assigneeId: (await user(["duct_rental.module.view"])).actorId }, randomUUID(), actor)).rejects.toMatchObject({ status: 403 });
    const assigned = await assignSignature(row.id, { version: row.version, assigneeId: signer.actorId }, randomUUID(), actor);
    expect(assigned.taskCreated).toBe(false); expect((await readRequest(row.id, actor)).assignedSignerId).toBe(signer.actorId);
    const original = await generateNtDocument(row.id, row.version, randomUUID(), actor);
    const task = (await readSigning(signer)).tasks.find(item => item.requestId === row.id)!;
    expect(task.documentId).toBe(original.id);
    const asset = await saveSignatureAsset("ทดสอบก่อนลงนาม", await readFile("tests/fixtures/metrix-golden/signature.png"), true, randomUUID(), signer), placement = { version: task.version, assetId: asset.id, page: 4, x: 0, y: 0, width: 60.7, height: 35.36, rotation: 0, scale: 1 };
    const preview = await previewSignature(task.id, placement, signer); expect((await PDFDocument.load(preview.bytes)).getPageCount()).toBe(5);
    await expect(previewSignature(task.id, placement, actor)).rejects.toMatchObject({ status: 409 });
    expect((await readSigning(signer)).tasks.find(item => item.id === task.id)?.status).toBe("pending");
    const next = await generateNtDocument(row.id, row.version, randomUUID(), actor), tasks = (await readSigning(signer)).tasks.filter(item => item.requestId === row.id);
    expect(tasks.filter(item => item.status === "pending")).toHaveLength(1); expect(tasks.find(item => item.status === "pending")?.documentId).toBe(next.id);
    await expect(signDocument(task.id, placement, randomUUID(), signer)).rejects.toMatchObject({ status: 409 });
  }, 30000);
  it("changing assignee invalidates a signed task and prevents unsigned response uploads", async () => {
    const actor = await user(), a = await user(["duct_rental.module.view", "duct_rental.signoff.sign"]), b = await user(["duct_rental.module.view", "duct_rental.signoff.sign"]), row = await permissionOne(actor);
    const pdf = await PDFDocument.create(); pdf.addPage(); const bytes = await pdf.save();
    await expect(uploadDocument(row.id, { version: row.version, fileType: "permission_letter" }, { name: "response.pdf", bytes }, randomUUID(), actor)).rejects.toMatchObject({ code: "SIGNATURE_REQUIRED" });
    const doc = await generateNtDocument(row.id, row.version, randomUUID(), actor), task = await assignSignature(row.id, { version: row.version, documentId: doc.id, assigneeId: a.actorId }, randomUUID(), actor), asset = await saveSignatureAsset("ทดสอบเปลี่ยนผู้ลงนาม", await readFile("tests/fixtures/metrix-golden/signature.png"), true, randomUUID(), a);
    await signDocument(task.id, { version: task.version, assetId: asset.id, page: 4, x: 0, y: 0, width: 60.7, height: 35.36, rotation: 0, scale: 1 }, randomUUID(), a);
    await uploadDocument(row.id, { version: row.version, fileType: "permission_letter" }, { name: "response.pdf", bytes }, randomUUID(), actor);
    await assignSignature(row.id, { version: row.version, documentId: doc.id, assigneeId: b.actorId }, randomUUID(), actor);
    expect((await readRequest(row.id, actor)).isSigned).toBe(false);
    expect((await readSigning(a)).tasks.find(item => item.id === task.id)?.status).toBe("revoked");
    await expect(uploadDocument(row.id, { version: row.version, fileType: "confirmation_form" }, { name: "response.pdf", bytes }, randomUUID(), actor)).rejects.toMatchObject({ code: "SIGNATURE_REQUIRED" });
  }, 30000);
  it("annual creation requires ALL scopes to prevent a partial global year snapshot", async () => {
    const actor = await user(["duct_rental.module.view", "duct_rental.renewal.create", "duct_rental.rate.read"], "OWN");
    await expect(createRenewal({ year: 2999 }, randomUUID(), actor)).rejects.toMatchObject({ status: 403 });
  });
  it("ports the non-NT branch and decimal rates; redacts prices from a read-only viewer", async () => {
    const actor = await user(), row = await active(actor);
    const full = await readRequest(row.id, actor);
    expect(full.rate).toMatchObject({ yearlyFee: "0.10", monthlyFee: "99.50", guaranteeAmount: "1.01" });
    expect(full.guarantee).not.toHaveProperty("fullAmount");
    expect((await readRequest(row.id, await user(["duct_rental.module.view", "duct_rental.document.read"]))).rate).toBeNull();
    await expect(changeRequest(row.id, "save", row.version, {}, randomUUID(), actor)).rejects.toMatchObject({ code: "CLOSED" });
  });
  it("reviews snapshots, totals only keep, enforces renewal stages and unique year", async () => {
    const actor = await user(); await active(actor, "0.20");
    const year = 3000 + Math.floor(Math.random() * 6000);
    const created = await createRenewal({ year }, randomUUID(), actor);
    await expect(createRenewal({ year }, randomUUID(), actor)).rejects.toMatchObject({ status: 409 });
    await expect(advanceRenewal(created.id, { version: 1 }, randomUUID(), actor)).rejects.toMatchObject({ code: "REVIEW_REQUIRED" });
    let version = 1; const view = await readRenewal(created.id, actor);
    for (let i = 0; i < view.routes.length; i++) version = (await reviewRenewal(created.id, { version, routeId: view.routes[i].id, reviewStatus: i < 2 ? "keep" : "drop" }, randomUUID(), actor)).version;
    const kept = view.routes.slice(0, 2);
    expect((await readRenewal(created.id, actor)).totalYearlyCost).toBe((Number(kept[0]?.yearlyFee ?? 0) + Number(kept[1]?.yearlyFee ?? 0)).toFixed(2));
    for (let i = 0; i < 3; i++) version = (await advanceRenewal(created.id, { version }, randomUUID(), actor)).version;
    await expect(advanceRenewal(created.id, { version }, randomUUID(), actor)).rejects.toMatchObject({ code: "DOCUMENT_REQUIRED" });
    const doc = await files(view.routes[0].requestId, actor, "COMPLETE", "renewal_contract");
    await advanceRenewal(created.id, { version, contractDocumentId: doc, contractNumber: "สัญญาจำลอง", thirdPartyNotes: "หมายเหตุจำลอง" }, randomUUID(), actor);
    expect(await readRenewal(created.id, actor)).toMatchObject({ status: "contracted", contractNumber: "สัญญาจำลอง", thirdPartyNotes: "หมายเหตุจำลอง", reviewedBy: actor.actorId, approvedBy: actor.actorId, contractedBy: actor.actorId });
  }, 60000);
  it("completes cancellation and route atomically; duplicate and terminal transitions denied", async () => {
    const actor = await user(), route = await active(actor), raw = { requestId: route.id, version: route.version, effectiveDate: "2031-01-02", reason: "ข้อมูลจำลอง" };
    const cancel = await createCancellation(raw, randomUUID(), actor);
    await expect(createCancellation(raw, randomUUID(), actor)).rejects.toMatchObject({ status: 409 });
    let version = 1;
    for (let i = 0; i < 3; i++) version = (await changeCancellation(cancel.id, "advance", { version }, randomUUID(), actor)).version;
    expect((await readRequest(route.id, actor)).cancelledAt).toBe("2031-01-02");
    expect((await operator`select status,completed_by from duct_rental_cancellations where id=${cancel.id}`)[0]).toMatchObject({ status: "completed", completed_by: actor.actorId });
    await expect(changeCancellation(cancel.id, "advance", { version }, randomUUID(), actor)).rejects.toMatchObject({ code: "STATE" });
  });
  it("stores a scoped annual contract directly on the year and denies another year or unqualified uploader", async () => {
    const actor = await user(), year = 3000 + Math.floor(Math.random() * 6000), batch = await createRenewal({ year }, randomUUID(), actor), model = await readRenewal(batch.id, actor); let version = batch.version;
    const pdf = await PDFDocument.create(); pdf.addPage(); const bytes = await pdf.save();
    await expect(uploadAnnualDocument(batch.id, version, { name: "annual.pdf", bytes }, randomUUID(), actor)).rejects.toMatchObject({ status: 409 });
    for (const row of model.routes) version = (await reviewRenewal(batch.id, { version, routeId: row.id, reviewStatus: "drop" }, randomUUID(), actor)).version;
    for (let i=0;i<3;i++) version = (await advanceRenewal(batch.id, { version }, randomUUID(), actor)).version;
    await expect(uploadAnnualDocument(batch.id, version, { name: "annual.pdf", bytes }, randomUUID(), await user(["duct_rental.module.view", "duct_rental.rate.read", "duct_rental.document.read"]))).rejects.toMatchObject({ status: 404 });
    const doc = await uploadAnnualDocument(batch.id, version, { name: "annual.pdf", bytes }, randomUUID(), actor); expect((await readRenewal(batch.id, actor)).documents.map(item => item.id)).toContain(doc.id);
    expect(Buffer.from((await downloadDocument(doc.id, actor)).bytes)).toEqual(Buffer.from(bytes));
    await expect(downloadDocument(doc.id, await user(["duct_rental.module.view", "duct_rental.document.read"]))).rejects.toMatchObject({ status: 404 });
    await advanceRenewal(batch.id, { version, contractDocumentId: doc.id }, randomUUID(), actor);
    expect((await readRenewal(batch.id, actor)).status).toBe("contracted");
  }, 60000);
  it("rolls back business write/receipt/event when audit insertion fails", async () => {
    const actor = await user(), key = randomUUID();
    // Restrictive fixture policy only in the isolated DB; no shared code/test mocking of audit.
    await operator.unsafe(`create policy duct_fixture_audit_failure on audit_logs as restrictive for insert to duct_rental_runtime with check(actor_id<>'${actor.actorId}'::uuid)`);
    try {
      await expect(createRequest(design, null, key, actor)).rejects.toMatchObject({ status: 403 });
      expect(await operator`select id from duct_rental_requests where owner_id=${actor.actorId}`).toHaveLength(0);
      expect(await operator`select actor_id from duct_rental_mutation_receipts where actor_id=${actor.actorId}`).toHaveLength(0);
      expect(await operator`select id from activity_events where actor_id=${actor.actorId}`).toHaveLength(0);
    } finally { await operator.unsafe("drop policy duct_fixture_audit_failure on audit_logs"); }
  });
  it("serializes archive before a queued signature and closes pending preview/revocation", async () => {
    const actor = await user(), signer = await user(["duct_rental.module.view", "duct_rental.signoff.sign"]), row = await permissionOne(actor);
    const doc = await generateNtDocument(row.id, row.version, randomUUID(), actor), task = await assignSignature(row.id, { version: row.version, documentId: doc.id, assigneeId: signer.actorId }, randomUUID(), actor);
    const asset = await saveSignatureAsset("จำลองปิดคำขอ", await readFile("tests/fixtures/metrix-golden/signature.png"), true, randomUUID(), signer);
    const placement = { version: 1, assetId: asset.id, page: 4, x: 0, y: 0, width: 60.7, height: 35.36, rotation: 0, scale: 1 };
    let archived!: Promise<unknown>, signed!: Promise<unknown>;
    const waiting = async (count: number) => { for (let i = 0; i < 100; i++) { const [locks] = await operator`select count(*)::int as n from pg_locks where locktype='advisory' and not granted and objid=(hashtextextended(${'duct-request:' + row.id},0)&4294967295)::oid`; if (locks.n >= count) return; await new Promise(resolve => setTimeout(resolve, 10)); } throw new Error("Queued request lock missing"); };
    await operator.begin(async tx => {
      await tx`select pg_advisory_xact_lock(hashtextextended(${'duct-request:' + row.id},0))`;
      archived = changeRequest(row.id, "archive", row.version, {}, randomUUID(), actor);
      await waiting(1);
      signed = signDocument(task.id, placement, randomUUID(), signer).catch(error => error);
      await waiting(2);
    });
    await archived;
    expect(await signed).toMatchObject({ code: "STATE" });
    await expect(previewSignature(task.id, placement, signer)).rejects.toMatchObject({ code: "STATE" });
    await expect(revokeSignature(task.id, 1, randomUUID(), actor)).rejects.toMatchObject({ code: "STATE" });
    expect((await readSigning(signer)).tasks.find(item => item.id === task.id)).toMatchObject({ status: "pending", canSignNow: false });
    expect(await operator`select id from duct_rental_documents where signed_task_id=${task.id}`).toHaveLength(0);
  }, 30000);
  it("publishes only an empty committed change hint and no rolled-back hint", async () => {
    const actor = await user(), id = randomUUID(), hints: string[] = [];
    let arrived!: () => void;
    const committed = new Promise<void>(resolve => { arrived = resolve; });
    const listener = await operator.listen("duct_rental_changed", payload => { hints.push(payload); arrived(); });
    const rollback = new Error("fixture rollback");
    try {
      await expect(runtime(actor, async tx => {
        await tx`insert into duct_rental_requests(id,code,owner_id,project_name,route_name,owner_duct,service_center,province,district,design) values(${id},${`FIXTURE-${id}`},${actor.actorId},'rollback','','NT','','','',${JSON.stringify({ projectName: "rollback" })}::jsonb)`;
        throw rollback;
      })).rejects.toBe(rollback);
      expect(await operator`select id from duct_rental_requests where id=${id}`).toHaveLength(0);
      await createRequest(design, null, randomUUID(), actor);
      await Promise.race([committed, new Promise((_, reject) => setTimeout(() => reject(new Error("Committed hint missing")), 2000))]);
      expect(hints).toEqual([""]);
    } finally { await listener.unlisten(); }
  });
  it("module disable denies the next service call and retains business records", async () => {
    const actor=await user(), row=await createRequest(design,null,randomUUID(),actor);
    await operator`update core_module_settings set enabled=false where module_id='duct-rental'`;
    try { await expect(readRequest(row.id,actor)).rejects.toMatchObject({status:403}); expect(await operator`select id from duct_rental_requests where id=${row.id}`).toHaveLength(1); }
    finally { await operator`update core_module_settings set enabled=true where module_id='duct-rental'`; }
  });
  it("tracks a rejected cancellation as completed SLA with source owner/reference and scoped counts", async () => {
    const actor = await user(), route = await active(actor), original = await readRequest(route.id, actor);
    const item = await createCancellation({ requestId: route.id, version: route.version, effectiveDate: "2031-01-02", reason: "ข้อมูลจำลอง" }, randomUUID(), actor);
    await changeCancellation(item.id, "reject", { version: 1, notes: "fixture rejection" }, randomUUID(), actor);
    const result = await readTracking({ kind: "Cancel", query: original.code, owner: "Team Design", sla: "Completed" }, actor);
    expect(result.counts).toMatchObject({ total: 1, completed: 1, active: 0 });
    expect(result.rows[0]).toMatchObject({ id: item.id, routeId: original.code, reference: original.code, status: "rejected", sla: "Completed" });
    expect((await readRequest(route.id, actor)).cancelledAt).toBeNull();
    const other = await user(["duct_rental.module.view"], "OWN");
    expect((await readTracking({ query: original.code }, other)).counts.total).toBe(0);
    expect(result.rows[0]).not.toHaveProperty("yearlyFee");
    expect((await readTracking({ limit: 1 }, actor)).rows).toHaveLength(1);
  });
});
