import { describe, expect, it } from "vitest";
import source from "../../../../tests/fixtures/metrix-import/source.json";
import crosswalk from "../../../../tests/fixtures/metrix-import/crosswalk.json";
import { planDuctImport } from "../domain/import-planner";
describe("METRIX offline import review", () => {
  it("retains historical timestamps and mapped actors without importing signer authority or public URLs", () => {
    const input = { ...source, requests: source.requests.map((row, index) => index ? row : { ...row, updated_at: "2031-01-02T12:00:00Z", permission1_signoff: { status: "signed", signedById: "fixture-designer", signedAt: "2031-01-02T12:00:00Z", assignedSignerRole: "Admin", signedDocumentUrl: "https://private.example.invalid/signed.pdf" } }) };
    const report = planDuctImport(input, crosswalk), history = report.tables.requests[0].historicalSignoff;
    expect(report.tables.requests[0].sourceTimestamps).toEqual({ created_at: "2031-01-02", updated_at: "2031-01-02T12:00:00Z" });
    expect(history).toMatchObject({ authority: "historical-review-only", actorReview: [{ field: "signedById", id: crosswalk.actors["fixture-designer"] }] });
    expect(JSON.stringify(report)).not.toContain("https://private.example.invalid"); expect(JSON.stringify(history)).not.toContain("Admin");
    expect(report.warnings).toContainEqual(expect.objectContaining({ code: "HISTORICAL_SIGNOFF_REQUIRES_DOCUMENT_REVIEW" }));
  });
  it("reconciles every snapshot with deterministic IDs and decimal totals without writes", () => {
    const report = planDuctImport(source, crosswalk); expect(report).toEqual(planDuctImport(source, crosswalk)); expect(report.issues).toEqual([]); expect(report.writesPerformed).toBe(0); expect(report.totals).toEqual({ monthlyFees: "199.00", yearlyFees: "0.30", guaranteeAmounts: "2.02", annualKeptCost: "0.30" }); expect(report.tables.cancellations[0].status).toBe("cancel_initiated"); expect(JSON.stringify(report)).not.toContain("https://fixture.invalid");
  });
  it("requires explicit actor and service-center crosswalks; never migrates source role flags", () => {
    const report = planDuctImport(source, { ...crosswalk, actors: {}, centers: {} }); expect(report.issues.some(issue => issue.code === "ACTOR_CROSSWALK_REQUIRED")).toBe(true); expect(report.issues.some(issue => issue.code === "TEAM_CROSSWALK_REQUIRED")).toBe(true); expect(report.readyForReviewedMigration).toBe(false);
  });
  it("detects duplicate identifiers and years, orphans and mismatched totals", () => {
    const changed = structuredClone(source); changed.requests.push(changed.requests[0]); changed.annual_renewals.push({ ...changed.annual_renewals[0], id: "FIXTURE-YEAR-DUP" }); changed.annual_renewal_routes[0].route_id = "UNKNOWN"; changed.annual_renewals[0].estimated_total_cost = "100.00";
    const codes = planDuctImport(changed, crosswalk).issues.map(issue => issue.code); expect(codes).toEqual(expect.arrayContaining(["DUPLICATE_OR_MISSING_ID", "DUPLICATE_YEAR", "ORPHAN_REFERENCE", "FINANCIAL_TOTAL_MISMATCH"]));
  });
  it("quarantines historical statuses until a reviewed mapping is provided", () => {
    const changed = structuredClone(source); changed.annual_renewals[0].status = "reviewing"; expect(planDuctImport(changed, crosswalk).issues.some(issue => issue.code === "LEGACY_STATUS_MAPPING_REQUIRED")).toBe(true); expect(planDuctImport(changed, { ...crosswalk, renewalStatuses: { reviewing: "draft" } }).issues).toEqual([]);
  });
  it("requires a private file manifest and rejects traversal, credentials and apply-shaped payloads", () => {
    expect(planDuctImport(source, { ...crosswalk, files: {} }).issues.some(issue => issue.code === "PRIVATE_FILE_MANIFEST_REQUIRED")).toBe(true); expect(() => planDuctImport(source, { ...crosswalk, files: { x: { ...Object.values(crosswalk.files)[0], relativePath: "../outside.png" } } })).toThrow(); expect(() => planDuctImport({ ...source, password: "unsupported" }, crosswalk)).toThrow();
  });
  it("validates bad dates/money and forbids prototype names from becoming actors or statuses", () => {
    const changed = structuredClone(source); changed.requests[0].owner_id = "constructor"; changed.requests[0].rate_notice_data.yearlyFee = "NaN"; changed.cancellations[0].effective_date = "2032-02-30"; changed.annual_renewals[0].status = "constructor"; const codes = planDuctImport(changed, crosswalk).issues.map(issue => issue.code); expect(codes).toEqual(expect.arrayContaining(["ACTOR_CROSSWALK_REQUIRED", "INVALID_MONEY", "INVALID_DATE", "LEGACY_STATUS_MAPPING_REQUIRED"]));
  });
});
