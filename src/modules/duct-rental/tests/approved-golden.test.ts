import { describe, expect, it } from "vitest";
import golden from "../../../../tests/fixtures/metrix-golden/finance-pdf.json";
import { renewalTotal } from "../domain/money";
import { ntFieldValues } from "../domain/pdf-fields";
import { DuctRentalSchema } from "../schemas/design";
describe("executed original finance/PDF rules plus explicit owner decisions", () => {
  for (const fixture of golden.fixtures) it(`${fixture.rule} ${fixture.operation} ${JSON.stringify(fixture.input)}`, () => {
    if (fixture.operation === "renewalTotal") expect(renewalTotal(fixture.input as { reviewStatus: string; yearlyFee: number }[])).toEqual(fixture.approvedExpected);
    else expect(ntFieldValues(DuctRentalSchema.parse(fixture.input))).toEqual(fixture.approvedExpected);
  });
});
