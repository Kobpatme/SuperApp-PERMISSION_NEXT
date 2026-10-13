// Run only pure source expressions in a VM. No source auth, stores, network or .env evaluation.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import vm from "node:vm";
import ts from "typescript";

process.env.TZ = "Asia/Bangkok";
const root = resolve(process.argv[2] || "_discovery_sources/METRIX");
const sha = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (sha !== "f87220bf94b765e4896388632c3dbeabb5286510") throw new Error("Unexpected METRIX source SHA; review discovery before refreshing fixtures");
const hashes = {};
function source(path) {
  const text = readFileSync(resolve(root, path), "utf8").replace(/\r\n/g, "\n");
  const frozen = execFileSync("git", ["-C", root, "show", `${sha}:${path}`], { encoding: "utf8" }).replace(/\r\n/g, "\n");
  if (createHash("sha256").update(text).digest("hex") !== createHash("sha256").update(frozen).digest("hex")) throw new Error(`Source differs from frozen commit: ${path}`);
  hashes[path] = createHash("sha256").update(text).digest("hex");
  return ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
}
function declarations(file, names) {
  const found = new Map();
  const walk = node => {
    if ((ts.isVariableDeclaration(node) || ts.isFunctionDeclaration(node)) && node.name && names.includes(node.name.getText(file))) found.set(node.name.getText(file), node);
    ts.forEachChild(node, walk);
  };
  walk(file);
  return names.map(name => {
    const node = found.get(name); if (!node) throw new Error(`Missing source expression: ${name}`);
    return ts.isFunctionDeclaration(node) ? node.getText(file).replace(/^export /, "") : `const ${node.getText(file)};`;
  }).join("\n");
}
let clock = Date.parse("2026-10-10T12:00:00+07:00");
class FrozenDate extends Date { constructor(...args) { super(...(args.length ? args : [clock])); } static now() { return clock; } }
function evaluate(text, names) {
  const js = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  const context = vm.createContext({ Date: FrozenDate });
  vm.runInContext(`${js}\nthis.result={${names.join(",")}};`, context, { timeout: 1000 });
  return context.result;
}
const cableSource = source("schemas/ductRentalSchema.ts");
const cable = evaluate(declarations(cableSource, ["FIBER_TYPE_OPTIONS_BY_CABLE", "getFiberTypeOptions", "getDiameterForCable"]), ["FIBER_TYPE_OPTIONS_BY_CABLE", "getDiameterForCable"]);
const utilsSource = source("lib/utils.ts");
const utilsNames = ["ROLE_OWNED_PHASES", "PHASE_SEQUENCE", "GLOBAL_REQUEST_VIEW_ROLES", "READONLY_MANAGEMENT_ROLES", "getOwnedPhasesForRole", "canRoleActOnPhase", "canRoleViewAllRequests", "isReadOnlyManagementRole", "hasPhaseBeenTouched", "canRoleSeeRequest", "getPreferredPhaseForRole", "isMemoMissing", "hasIncompleteRequiredDocuments", "canViewFile"];
const utils = evaluate(declarations(utilsSource, utilsNames), utilsNames);
const listSource = source("app/(dashboard)/dashboard/duct-rental/page.tsx");
const list = evaluate(declarations(listSource, ["isDocsIncomplete", "getWorkflowStatus"]), ["isDocsIncomplete", "getWorkflowStatus"]);
const draftsmanSource = source("app/(dashboard)/dashboard/duct-rental/[id]/draftsman/page.tsx");
const draft = evaluate(`function nextPhase(owner) { const designData={ownerDuct:owner}; ${declarations(draftsmanSource, ["ownerDuct", "shouldSkipToRateNotice", "nextPhase"])} return nextPhase; }`, ["nextPhase"]);
const cancellationSource = source("app/(dashboard)/dashboard/duct-rental/cancellation/[id]/page.tsx");
const cancel = evaluate(`function normalize(status) { const record={status}; ${declarations(cancellationSource, ["normalizedCancelStatus"])} return normalizedCancelStatus; }`, ["normalize"]);
const trackingSource = source("lib/processTracking.ts");
const trackingNames = ["DAY_MS", "PROCESS_SLA_DAYS", "getRenewOwner", "getCancelOwner", "addDays", "getSlaStatus", "formatDate"];
const tracking = evaluate(declarations(trackingSource, trackingNames), trackingNames);
const renewalSource = source("store/useRenewalStore.ts");
const renewal = evaluate(declarations(renewalSource, ["calcEstimatedCost"]), ["calcEstimatedCost"]);
const pdfSource = source("components/pdf/ntFormFiller.ts");
const pdf = evaluate(declarations(pdfSource, ["buildFieldValues"]), ["buildFieldValues"]);
const fixtures = [];
function add(rule, operation, input, expected) { fixtures.push({ rule, operation, input, expected: expected === undefined ? null : expected }); }
for (const role of ["design", "draftsman", "permission", "install", "3rdparty", "viewer", "sr_manager"]) {
 for (const request of [{ currentPhase: "DESIGN", phaseStatuses: {} }, { currentPhase: "DRAFTSMAN", phaseStatuses: { DESIGN: "done" } }, { currentPhase: "COMPLETE", phaseStatuses: { DRAFTSMAN: "done", INSTALL: "done" } }])
  add("RULE-005", "visibility", [utils.getOwnedPhasesForRole(role), request, utils.canRoleViewAllRequests(role)], { visible: utils.canRoleSeeRequest(role, request), preferred: utils.getPreferredPhaseForRole(role, request) });
 for (const file of [["DESIGN", "memo"], ["DRAFTSMAN", "drawing"], ["PERMISSION_1", "invoice"]])
  add("RULE-006", "fileVisibility", [[utils.canRoleViewAllRequests(role) ? "global" : role === "3rdparty" ? "thirdparty" : role], ...file], utils.canViewFile(role, ...file));
}
for (const [type, fibers] of Object.entries(cable.FIBER_TYPE_OPTIONS_BY_CABLE)) for (const fiber of fibers) add("RULE-003", "diameter", [type, fiber.fiberType], cable.getDiameterForCable(type, fiber.fiberType));
for (const pair of [["ADSS", "2 Core"], ["unknown", "12 Core"], [null, null]]) add("RULE-003", "diameter", pair, cable.getDiameterForCable(...pair));
const documents = [
 { currentPhase: "DESIGN", files: [] },
 { currentPhase: "COMPLETE", files: [{ name: "MEMO.pdf" }] },
 { currentPhase: "COMPLETE", files: [{ name: "x.pdf", fileType: "memo" }], missingDocs: " " },
 { currentPhase: "COMPLETE", files: [{ name: "drawing.pdf" }] },
 { currentPhase: "COMPLETE", files: [{ name: "memo.pdf" }], missingDocs: "ขาดเอกสาร" },
];
for (const request of documents) add("RULE-004", "documents", [request], { memoMissing: utils.isMemoMissing(request), completionBlocked: utils.hasIncompleteRequiredDocuments(request), listIncomplete: list.isDocsIncomplete(request) });
for (const owner of ["NT", " nt ", "TRUE", "", null]) add("RULE-007", "draftsmanNext", [owner], draft.nextPhase(owner));
for (const status of ["pending", "approved", "tracking", "rejected", "completed"]) add("RULE-013", "cancelStatus", [status], cancel.normalize(status));
for (const status of ["draft", "sent_to_3rdparty", "memo_preparing", "provider_confirmed", "contracted", "unknown"]) add("RULE-012", "renewOwner", [status], tracking.getRenewOwner(status));
for (const status of ["pending", "tracking", "rejected", "completed", "approved"]) add("RULE-013", "cancelOwner", [status], tracking.getCancelOwner(status));
for (const [start, days, completedAt, at] of [
 ["2026-10-10T12:00:00+07:00", 7, null, "2026-10-10T12:00:00+07:00"],
 ["2026-10-10T12:00:00+07:00", 7, null, "2026-10-16T12:00:00+07:00"],
 ["2026-10-10T12:00:00+07:00", 7, null, "2026-10-17T13:00:00+07:00"],
 ["2026-10-10T12:00:00+07:00", 7, null, "2026-10-18T12:00:00+07:00"],
 ["invalid", 5, null, "2026-10-10T12:00:00+07:00"],
 ["invalid", 5, "anything", "2026-10-10T12:00:00+07:00"],
]) { clock = Date.parse(at); add("RULE-014", "sla", [start, days, completedAt, at], tracking.getSlaStatus(start, days, completedAt)); }
for (const [start, days] of [["2026-10-30T23:00:00+07:00", 5], ["2026-12-30T12:00:00+07:00", 7], ["invalid", 7]]) add("RULE-014", "dueDate", [start, days], tracking.addDays(start, days));
for (const date of [null, "invalid", "2026-10-10T00:00:00+07:00"]) add("RULE-014", "dateLabel", [date], tracking.formatDate(date));
for (const request of [{ currentPhase: "COMPLETE", cancelledAt: "x", phaseStatuses: {} }, { currentPhase: "COMPLETE", phaseStatuses: {} }, { currentPhase: "DESIGN", phaseStatuses: {} }, { currentPhase: "INSTALL", phaseStatuses: { INSTALL: "accepted" } }]) add("RULE-020", "workflowStatus", [request], list.getWorkflowStatus(request));
const output = { sourceRepository: "Kobpatme/METRIX", sourceSha: sha, timezone: "Asia/Bangkok", sourceHashes: hashes, method: "TypeScript AST extraction of original pure expressions, transpile + VM with frozen Date; no production services", fixtures };
mkdirSync("tests/fixtures/metrix-golden", { recursive: true });
writeFileSync("tests/fixtures/metrix-golden/nonfinancial.json", JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({ sourceSha: sha, fixtures: fixtures.length, rules: [...new Set(fixtures.map(f => f.rule))] }));
const financePdf = [];
for (const routes of [
 [{ reviewStatus: "keep", yearlyFee: 0.1 }, { reviewStatus: "keep", yearlyFee: 0.2 }, { reviewStatus: "drop", yearlyFee: 90 }],
 [{ reviewStatus: "pending", yearlyFee: 1200 }, { reviewStatus: "drop", yearlyFee: 900 }],
 [{ reviewStatus: "keep", yearlyFee: -1.005 }, { reviewStatus: "keep", yearlyFee: 10.105 }],
]) financePdf.push({ rule: "RULE-011", operation: "renewalTotal", input: routes, sourceExpected: renewal.calcEstimatedCost(routes), approvedExpected: routes[0].yearlyFee === 0.1 ? "0.30" : routes[0].reviewStatus === "pending" ? "0.00" : "9.10", decision: "DQ02: snapshot each numeric(*,2) before summing, ROUND_HALF_UP" });
const designBase = { requestType: "NEW", projectName: "โครงการทดสอบ", routeName: "เส้นทางทดสอบ", ownerDuct: "NT", routeDetail: "เส้นทาง", jobType: "Network", serviceCenter: "BKK 1", cableType: "ADSS", fiberType: "12 Core", diameter: 8.7, distance: 1, startCoords: "13,100", endCoords: "14,101", district: "เขตทดสอบ", province: "จังหวัดทดสอบ" };
for (const count of [undefined, 2, 12]) {
 const designData = { ...designBase, ...(count ? { cableCount: count } : {}), designContactName: "ผู้ประสานงานทดสอบ" };
 const expected = pdf.buildFieldValues({ designData });
 financePdf.push({ rule: "RULE-017", operation: "ntFieldValues", input: designData, sourceExpected: expected, approvedExpected: { ...expected, "จำนวนเส้น (3)": String(count ?? 1) }, decision: "DQ03: owner approved entered cable count; source fallback 1 when omitted" });
}
writeFileSync("tests/fixtures/metrix-golden/finance-pdf.json", JSON.stringify({ sourceSha: sha, sourceHashes: hashes, method: output.method, fixtures: financePdf }, null, 2) + "\n");
console.log(JSON.stringify({ financePdfFixtures: financePdf.length, approvedDecisions: ["DQ02", "DQ03"] }));
