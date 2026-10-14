import { describe, expect, it } from "vitest";
import { money, renewalTotal } from "../domain/money";
import { assertPhaseAction, nextPhase, phasePermission, renewalTransitions, cancellationTransitions } from "../domain/workflow";
import { requestPhases } from "../domain/source-policy";

describe("owner-approved money contract DQ02 / RULE008,011", () => {
  it.each([["0.105", "0.11"], ["-0.105", "-0.11"], ["999.999", "1000.00"], ["", "0.00"], [null, "0.00"]])("rounds %s as PostgreSQL numeric", (input, expected) => expect(money(input)).toBe(expected));
  it("sums only kept snapshots without float drift or monthly derivation", () => {
    expect(renewalTotal([{ reviewStatus: "keep", yearlyFee: "0.10" }, { reviewStatus: "keep", yearlyFee: "0.20" }, { reviewStatus: "drop", yearlyFee: "90" }, { reviewStatus: "pending", yearlyFee: "80" }])).toBe("0.30");
  });
  it.each(["Infinity", "NaN", "10000000000", "9999999999.999"])("rejects overflow/nonfinite %s", value => expect(() => money(value)).toThrow());
});
describe("intended source UI transitions RULE001,007,012,013", () => {
  it.each(requestPhases.filter(phase => phase !== "COMPLETE" && phase !== "DESIGN"))("requires acceptance before submitting %s", phase => {
    expect(phasePermission(phase, "accept")).toMatch(/^duct_rental\..+\.accept$/);
    expect(() => assertPhaseAction("pending", "accept")).not.toThrow();
    expect(() => assertPhaseAction("accepted", "submit")).not.toThrow();
    for (const status of ["pending", "done"] as const) expect(() => assertPhaseAction(status, "submit")).toThrow();
    for (const status of ["accepted", "done"] as const) expect(() => assertPhaseAction(status, "accept")).toThrow();
    expect(nextPhase(phase, "NT")).toBe(requestPhases[requestPhases.indexOf(phase) + 1]);
  });
  it("source DESIGN submits directly; acceptance stays optional", () => {
    expect(() => assertPhaseAction("pending", "submit", "DESIGN")).not.toThrow();
    expect(() => assertPhaseAction("accepted", "submit", "DESIGN")).not.toThrow();
    expect(() => assertPhaseAction("done", "submit", "DESIGN")).toThrow();
  });
  it("keeps the source non-NT branch and terminal denial", () => {
    expect(nextPhase("DRAFTSMAN", " TRUE ")).toBe("3RD_PARTY_1");
    expect(() => nextPhase("COMPLETE", "NT")).toThrow();
    expect(() => phasePermission("COMPLETE", "submit")).toThrow();
  });
  it("defines each source renewal and cancellation step", () => {
    expect(Object.values(renewalTransitions).map(step => step.next)).toEqual(["sent_to_3rdparty", "memo_preparing", "provider_confirmed", "contracted"]);
    expect(Object.values(cancellationTransitions)).toEqual(["in_progress", "tracking", "completed"]);
  });
});
