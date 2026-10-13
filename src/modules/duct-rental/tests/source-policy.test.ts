import { describe, expect, it } from "vitest";
import golden from "../../../../tests/fixtures/metrix-golden/nonfinancial.json";
import { getDiameterForCable } from "../domain/cables";
import { preferredPhase, visibleFile, visibleForPhases } from "../domain/visibility";
import { isMemoMissing, hasIncompleteRequiredDocuments, listDocumentsIncomplete, draftsmanNextPhase, normalizeCancellationStatus, getRenewOwner, getCancelOwner, getSlaStatus, addDays, formatDate, workflowStatus, type DocumentGate } from "../domain/source-policy";

describe("frozen METRIX source golden parity", () => {
  it("binds the fixture to the audited source and timezone", () => {
    expect(golden.sourceSha).toBe("f87220bf94b765e4896388632c3dbeabb5286510");
    expect(golden.timezone).toBe("Asia/Bangkok");
  });
  for (const fixture of golden.fixtures) it(`${fixture.rule} ${fixture.operation} ${JSON.stringify(fixture.input)}`, () => {
    const input = fixture.input as unknown[];
    let actual: unknown;
    switch (fixture.operation) {
      case "visibility": actual = { visible: visibleForPhases(input[0] as string[], input[1] as Parameters<typeof visibleForPhases>[1], input[2] as boolean), preferred: preferredPhase(input[0] as string[], input[1] as Parameters<typeof preferredPhase>[1], input[2] as boolean) }; break;
      case "fileVisibility": actual = visibleFile(input[0] as string[], input[1] as string, input[2] as string); break;
      case "diameter": actual = getDiameterForCable(input[0] as string, input[1] as string) ?? null; break;
      case "documents": {
        const request = input[0] as DocumentGate;
        actual = { memoMissing: isMemoMissing(request), completionBlocked: hasIncompleteRequiredDocuments(request), listIncomplete: listDocumentsIncomplete(request) }; break;
      }
      case "draftsmanNext": actual = draftsmanNextPhase(input[0] as string); break;
      case "cancelStatus": actual = normalizeCancellationStatus(input[0] as string); break;
      case "renewOwner": actual = getRenewOwner(input[0] as string); break;
      case "cancelOwner": actual = getCancelOwner(input[0] as string); break;
      case "sla": actual = getSlaStatus(input[0] as string, input[1] as number, input[2] as string | null, new Date(input[3] as string)); break;
      case "dueDate": actual = addDays(input[0] as string, input[1] as number); break;
      case "dateLabel": actual = formatDate(input[0] as string); break;
      case "workflowStatus": actual = workflowStatus(input[0] as Parameters<typeof workflowStatus>[0]); break;
      default: throw new Error(`Unhandled golden operation ${fixture.operation}`);
    }
    expect(actual).toEqual(fixture.expected);
  });
});
