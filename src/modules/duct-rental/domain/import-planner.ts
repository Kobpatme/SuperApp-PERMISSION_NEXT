import { sourceFinancialPayload } from "./source-financial";
import { createHash } from "node:crypto";
import { z } from "zod";
import Decimal from "decimal.js";
import { DuctRentalDraftSchema, DuctRentalSchema, InstallDraftSchema } from "../schemas/design";
import { money, renewalTotal } from "./money";
import { normalizeCancellationStatus, requestPhases } from "./source-policy";
import { cancellationTransitions, renewalTransitions } from "./workflow";
const uuid = z.string().uuid(), record = z.record(z.unknown());
const envelope = z.object({ sourceCommit: z.literal("f87220bf94b765e4896388632c3dbeabb5286510"), requests: z.array(record), request_files: z.array(record).default([]), annual_renewals: z.array(record).default([]), annual_renewal_routes: z.array(record).default([]), cancellations: z.array(record).default([]) }).strict();
const crosswalk = z.object({ actors: z.record(uuid), centers: z.record(uuid), renewalStatuses: z.record(z.enum(["draft", "sent_to_3rdparty", "memo_preparing", "provider_confirmed", "contracted"])).default({}), files: z.record(z.object({ relativePath: z.string().min(1).refine(value => !value.startsWith("/") && !/[\\:]|(^|\/)\.\.(\/|$)/.test(value)), checksumSha256: z.string().regex(/^[a-f0-9]{64}$/), sizeBytes: z.number().int().positive().max(26214400), mediaType: z.string().min(1) }).strict()).default({}) }).strict();
type Issue = { table: string; sourceId: string; code: string; field?: string };
type Imported = Record<string, unknown> & { id: string; sourceId: string };
function mappedId(table: string, sourceId: string) {
  // RFC 4122 UUIDv5 with a fixed fixture/import namespace; replay never changes IDs.
  const namespace = Buffer.from("12f519977c2c50daa6af2ed21a5eb926", "hex"), bytes = createHash("sha1").update(namespace).update(`METRIX:${table}:${sourceId}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 15) | 80; bytes[8] = (bytes[8] & 63) | 128;
  const hex = bytes.toString("hex"); return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
const text = (value: unknown) => typeof value === "string" ? value : "";
const object = (value: unknown) => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const snapshot = (row: Record<string, unknown>) => ({ code: text(row.route_id || row.request_id), projectName: text(row.project_name), routeName: text(row.route_name), ownerDuct: text(row.owner_duct), serviceCenter: text(row.service_center), province: text(row.province), district: text(row.district) });
export function planDuctImport(raw: unknown, rawCrosswalk: unknown) {
  const source = envelope.parse(raw), map = crosswalk.parse(rawCrosswalk), issues: Issue[] = [], warnings: Issue[] = [], ids = new Map<string, string>();
  const tables: Record<string, Imported[]> = { requests: [], rates: [], documents: [], renewals: [], renewalRoutes: [], cancellations: [] };
  for (const [table, rows] of Object.entries(source)) if (Array.isArray(rows)) for (const row of rows) { const sourceId = text(row.id); const key = `${table}:${sourceId}`; if (!sourceId || ids.has(key)) issues.push({ table, sourceId, code: "DUPLICATE_OR_MISSING_ID" }); else ids.set(key, mappedId(table, sourceId)); }
  const actor = (value: unknown, table: string, sourceId: string, field: string) => { const key = text(value), target = Object.hasOwn(map.actors, key) ? map.actors[key] : undefined; if (!target) issues.push({ table, sourceId, code: "ACTOR_CROSSWALK_REQUIRED", field }); return target ?? null; };
  const parent = (table: string, value: unknown, ownerTable: string, sourceId: string) => { const target = ids.get(`${table}:${text(value)}`); if (!target) issues.push({ table: ownerTable, sourceId, code: "ORPHAN_REFERENCE", field: table }); return target ?? null; };
  const decimal = (value: unknown, table: string, sourceId: string, field: string) => { try { return money(value == null ? "0" : value as string | number); } catch { issues.push({ table, sourceId, code: "INVALID_MONEY", field }); return "0.00"; } };
  const date = (value: unknown, table: string, sourceId: string, field: string, optional = true) => { if (!value && optional) return null; const s = text(value), d = new Date(s); if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(d.getTime()) || d.toISOString().slice(0,10) !== s) { issues.push({ table, sourceId, code: "INVALID_DATE", field }); return null; } return s; };
  const timestamps = (row: Record<string, unknown>, table: string, sourceId: string) => Object.fromEntries(["created_at", "updated_at", "uploaded_at", "reviewed_at", "approved_at", "contracted_at", "rejected_at", "completed_at", "archived_at"].filter(field => row[field] != null).map(field => {
    const value = text(row[field]);
    if (!/^\d{4}-\d{2}-\d{2}(?:T[\d:.]+(?:Z|[+-]\d{2}:\d{2}))?$/.test(value) || Number.isNaN(new Date(value).getTime()) || new Date(value.slice(0,10)).toISOString().slice(0,10) !== value.slice(0,10)) issues.push({ table, sourceId, code: "INVALID_TIMESTAMP", field });
    return [field, value];
  }));
  const historicalSignoff = (raw: unknown, sourceId: string) => {
    const row = object(raw);
    return {
      status: text(row.status),
      actorReview: ["assignedSignerId", "signedById", "revokedById"].filter(field => row[field] != null).map(field => ({ field, id: actor(row[field], "requests", sourceId, field) })),
      timestamps: timestamps({ approved_at: row.signedAt, rejected_at: row.revokedAt }, "requests", sourceId),
      sourceDocumentDigest: row.signedDocumentUrl ? createHash("sha256").update(text(row.signedDocumentUrl)).digest("hex") : null,
      sourceDocumentName: text(row.signedDocumentName),
      sourceNames: { assignedSigner: text(row.assignedSignerName), signedBy: text(row.signedByName), assetLabel: text(row.signatureAssetLabel) },
      sourceAssetId: text(row.signatureAssetId),
      // Historical evidence never creates a live signing task, grant or signature asset.
      authority: "historical-review-only",
    };
  };
  const run = (table: string, rows: Record<string, unknown>[], handle: (row: Record<string, unknown>, sourceId: string, id: string) => void) => { for (const row of rows) { const sourceId = text(row.id); try { handle(row, sourceId, ids.get(`${table}:${sourceId}`) || ""); } catch (error) { if (error instanceof z.ZodError) for (const issue of error.issues) issues.push({ table, sourceId, code: "VALIDATION", field: issue.path.join(".") }); else issues.push({ table, sourceId, code: "INVALID_RECORD" }); } } };
  run("requests", source.requests, (row, sourceId, id) => {
    const phase = z.enum(requestPhases).parse(row.current_phase), design = (phase === "DESIGN" ? DuctRentalDraftSchema : DuctRentalSchema).parse(object(row.design_data)); delete design.memoUrl; delete design.ductDrawingUrl;
    const locators = [row.design_data, row.as_built_data, row.rate_notice_data, row.guarantee_data].flatMap(value => Object.entries(object(value)).filter(([key, item]) => /Url$|File$/.test(key) && text(item)).map(([key, item]) => ({ key, value: text(item) })));
    for (const locator of locators) if (!source.request_files.some(file => text(file.request_id) === sourceId && text(file.url) === locator.value)) warnings.push({ table: "requests", sourceId, code: "UNRESOLVED_DOCUMENT_POINTER", field: locator.key });
    const statuses = z.record(z.enum(["pending", "accepted", "done"])).parse(row.phase_statuses); if (Object.keys(statuses).some(key => !requestPhases.includes(key as typeof requestPhases[number]))) issues.push({ table: "requests", sourceId, code: "UNKNOWN_PHASE" });
    const teamId = design.serviceCenter ? (Object.hasOwn(map.centers, design.serviceCenter) ? map.centers[design.serviceCenter] : undefined) : null; if (design.serviceCenter && !teamId) issues.push({ table: "requests", sourceId, code: "TEAM_CROSSWALK_REQUIRED", field: "serviceCenter" });
    const guarantee = object(row.guarantee_data), rate = object(row.rate_notice_data), install = row.install_data ? InstallDraftSchema.parse(row.install_data) : null;
    tables.requests.push({ id, sourceId, code: sourceId, ownerId: actor(row.owner_id || row.owner_name, "requests", sourceId, "owner_id"), teamId, phase, phaseStatuses: Object.fromEntries(requestPhases.map(key => [key, statuses[key] ?? "pending"])), design, install, asBuilt: object(row.as_built_data), guarantee: Object.fromEntries(["contractNumber", "paymentType", "venderCode", "receiptNumber"].filter(key => guarantee[key] != null).map(key => [key, text(guarantee[key])])), phaseNotes: { DRAFTSMAN_2: text(object(row.as_built_data).notes), "3RD_PARTY_1": text(rate.notes), "3RD_PARTY_2": text(guarantee.notes) }, missingDocs: text(row.missing_docs), businessDate: date(text(row.created_at).slice(0,10), "requests", sourceId, "created_at", false), cancelledAt: date(row.cancelled_at, "requests", sourceId, "cancelled_at"), version: 1, sourceTimestamps: timestamps(row, "requests", sourceId), historicalSignoff: historicalSignoff(row.permission1_signoff, sourceId) });
    if (Object.keys(rate).length || guarantee.fullAmount != null) {
      const monthlyFee = decimal(rate.monthlyFee, "requests", sourceId, "monthlyFee"), yearlyFee = decimal(rate.yearlyFee, "requests", sourceId, "yearlyFee"), guaranteeAmount = guarantee.fullAmount == null || guarantee.fullAmount === "" ? null : decimal(guarantee.fullAmount, "requests", sourceId, "fullAmount");
      let payload = { rateNoticeData: { ...rate }, guaranteeData: { ...guarantee } };
      // Invalid amounts remain available for offline review; INVALID_MONEY above blocks apply.
      // One malformed field must not suppress the other date/amount diagnostics.
      try { payload = sourceFinancialPayload(rate, guarantee); } catch { /* quarantined by decimal */ }
      tables.rates.push({ id, sourceId, requestId: id, ...payload, monthlyFee, yearlyFee, guaranteeAmount, contractStart: date(rate.contractStartDate, "requests", sourceId, "contractStartDate"), contractEnd: date(rate.contractEndDate, "requests", sourceId, "contractEndDate") });
    }
    if (Object.keys(object(row.permission1_signoff)).length) warnings.push({ table: "requests", sourceId, code: "HISTORICAL_SIGNOFF_REQUIRES_DOCUMENT_REVIEW" });
  });
  run("request_files", source.request_files, (row, sourceId, id) => {
    const file = Object.hasOwn(map.files, sourceId) ? map.files[sourceId] : undefined; if (!["memo","duct_drawing","drawing","permission_letter","confirmation_form","rate_notice","invoice","signed_copy","contract","receipt","renewal_contract","cad","kmz","other","nt_form","signed_nt_form"].includes(text(row.file_type) || "other")) issues.push({ table: "request_files", sourceId, code: "UNKNOWN_DOCUMENT_KIND" }); if (!file) issues.push({ table: "request_files", sourceId, code: "PRIVATE_FILE_MANIFEST_REQUIRED" });
    tables.documents.push({ id, sourceId, requestId: parent("requests", row.request_id, "request_files", sourceId), phase: z.enum(requestPhases).parse(row.phase), fileType: text(row.file_type) || "other", name: z.string().min(1).max(255).refine(value => !/[\\/\x00-\x1f]/.test(value)).parse(row.name), sourceTimestamps: timestamps(row, "request_files", sourceId), documentVersion: 1, ...(file ?? {}), legacyUrlDigest: createHash("sha256").update(text(row.url)).digest("hex") });
  });
  run("annual_renewals", source.annual_renewals, (row, sourceId, id) => {
    const original = text(row.status), status = Object.hasOwn(renewalTransitions, original) || original === "contracted" ? original : Object.hasOwn(map.renewalStatuses, original) ? map.renewalStatuses[original] : undefined;
    if (!status) issues.push({ table: "annual_renewals", sourceId, code: "LEGACY_STATUS_MAPPING_REQUIRED", field: original });
    const contractLocator = text(row.contract_file), manifestKey = `annual:${sourceId}:contract`, file = Object.hasOwn(map.files, manifestKey) ? map.files[manifestKey] : undefined;
    if (contractLocator || status === "contracted") {
      if (!file) warnings.push({ table: "annual_renewals", sourceId, code: "ANNUAL_CONTRACT_MANIFEST_REQUIRED" });
      else if (file.mediaType !== "application/pdf") issues.push({ table: "annual_renewals", sourceId, code: "ANNUAL_CONTRACT_PDF_REQUIRED" });
      else tables.documents.push({ id: mappedId("annual_contract", sourceId), sourceId: manifestKey, renewalId: id, phase: "provider_confirmed", fileType: "renewal_contract", name: `Annual-${row.year}.pdf`, documentVersion: 1, ...file, legacyUrlDigest: createHash("sha256").update(contractLocator).digest("hex") });
    }
    tables.renewals.push({ id, sourceId, year: z.number().int().min(2000).max(9999).parse(row.year), status: status ?? null, sourceTimestamps: timestamps(row, "annual_renewals", sourceId), ownerId: actor(row.created_by, "annual_renewals", sourceId, "created_by"), sourceDeclaredTotal: decimal(row.estimated_total_cost, "annual_renewals", sourceId, "estimated_total_cost"), contractNumber: text(row.contract_number), thirdPartyNotes: text(row.third_party_notes), actorReview: ["reviewed_by", "approved_by", "contracted_by"].filter(field => row[field] != null).map(field => ({ field, id: actor(row[field], "annual_renewals", sourceId, field) })), version: 1 });
  });
  run("annual_renewal_routes", source.annual_renewal_routes, (row, sourceId, id) => tables.renewalRoutes.push({ id, sourceId, renewalId: parent("annual_renewals", row.renewal_id, "annual_renewal_routes", sourceId), requestId: parent("requests", row.route_id, "annual_renewal_routes", sourceId), snapshot: snapshot(row), monthlyFee: decimal(row.monthly_fee, "annual_renewal_routes", sourceId, "monthly_fee"), yearlyFee: decimal(row.yearly_fee, "annual_renewal_routes", sourceId, "yearly_fee"), contractStart: date(row.contract_start_date, "annual_renewal_routes", sourceId, "contract_start_date"), contractEnd: date(row.contract_end_date, "annual_renewal_routes", sourceId, "contract_end_date"), reviewStatus: z.enum(["pending", "keep", "drop"]).parse(row.review_status), reviewNotes: text(row.review_notes), sourceTimestamps: timestamps(row, "annual_renewal_routes", sourceId), actorReview: row.reviewed_by ? [{ field: "reviewed_by", id: actor(row.reviewed_by, "annual_renewal_routes", sourceId, "reviewed_by") }] : [] }));
  run("cancellations", source.cancellations, (row, sourceId, id) => {
    const status = normalizeCancellationStatus(text(row.status)); if (!Object.hasOwn(cancellationTransitions, status) && !["completed", "rejected"].includes(status)) issues.push({ table: "cancellations", sourceId, code: "UNKNOWN_STATUS" });
    tables.cancellations.push({ id, sourceId, requestId: parent("requests", row.request_id, "cancellations", sourceId), ownerId: actor(row.requested_by_id || row.requested_by, "cancellations", sourceId, "requested_by_id"), snapshot: snapshot(row), status, effectiveDate: date(row.effective_date, "cancellations", sourceId, "effective_date", false), sourceTimestamps: timestamps(row, "cancellations", sourceId), reason: z.string().min(1).parse(row.reason), notes: text(row.notes), monthlyFee: decimal(row.monthly_fee, "cancellations", sourceId, "monthly_fee"), yearlyFee: decimal(row.yearly_fee, "cancellations", sourceId, "yearly_fee"), contractStart: date(row.contract_start_date, "cancellations", sourceId, "contract_start_date"), contractEnd: date(row.contract_end_date, "cancellations", sourceId, "contract_end_date"), actorReview: ["approved_by", "rejected_by"].filter(field => row[field] != null).map(field => ({ field, id: actor(row[field], "cancellations", sourceId, field) })), version: 1 });
  });
  const years = new Set<unknown>();
  for (const row of tables.renewals) { if (years.has(row.year)) issues.push({ table: "annual_renewals", sourceId: row.sourceId, code: "DUPLICATE_YEAR" }); years.add(row.year); const routes = tables.renewalRoutes.filter(route => route.renewalId === row.id); row.totalYearlyCost = renewalTotal(routes as unknown as { reviewStatus: string; yearlyFee: string }[]); if (row.totalYearlyCost !== row.sourceDeclaredTotal) issues.push({ table: "annual_renewals", sourceId: row.sourceId, code: "FINANCIAL_TOTAL_MISMATCH" }); }
  const routeKeys = new Set<string>(); for (const row of tables.renewalRoutes) { const key = `${row.renewalId}:${row.requestId}`; if (routeKeys.has(key)) issues.push({ table: "annual_renewal_routes", sourceId: row.sourceId, code: "DUPLICATE_RENEWAL_ROUTE" }); routeKeys.add(key); }
  const total = (table: string, field: string) => tables[table].reduce((sum, row) => sum.plus(text(row[field]) || "0"), new Decimal(0)).toFixed(2);
  return { mode: "dry-run" as const, writesPerformed: 0 as const, sourceCommit: source.sourceCommit, readyForReviewedMigration: issues.length === 0 && warnings.length === 0, counts: Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, rows.length])), totals: { monthlyFees: total("rates", "monthlyFee"), yearlyFees: total("rates", "yearlyFee"), guaranteeAmounts: total("rates", "guaranteeAmount"), annualKeptCost: total("renewals", "totalYearlyCost") }, issues, warnings, crosswalk: Object.fromEntries(ids), tables };
}
