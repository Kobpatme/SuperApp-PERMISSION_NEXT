import { describe, expect, it } from "vitest";
import golden from "../../../../tests/fixtures/metrix-golden/validation.json";
import { DuctRentalSchema, InstallDetailSchema } from "../schemas/design";

describe("source Zod 4 validation parity on target Zod 3", () => {
  for (const fixture of golden.fixtures) it(`${fixture.rule} ${fixture.operation} ${JSON.stringify(fixture.input)}`, () => {
    const result = (fixture.operation === "design" ? DuctRentalSchema : InstallDetailSchema).safeParse(fixture.input);
    expect(result.success).toBe(fixture.expected.success);
    if (result.success) expect(result.data).toEqual(fixture.expected.data);
    else expect(result.error.issues.map(issue => issue.path.join("."))).toEqual(fixture.expected.paths);
  });
  it("rejects nonfinite geometry like source Zod 4", () => {
    const base = golden.fixtures.find(f => f.operation === "design")!.input;
    expect(DuctRentalSchema.safeParse({ ...base, distance: Infinity }).success).toBe(false);
    expect(DuctRentalSchema.safeParse({ ...base, diameter: NaN }).success).toBe(false);
  });
});
