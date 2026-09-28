import { describe, expect, it } from "vitest";
import { mapStagedBuilding } from "./import-permission-csv-staging.mjs";

const row = (values) => Object.fromEntries(Object.entries(values).map(([number, value]) => [`c${String(number).padStart(2, "0")}`, value]));

describe("Permission_Next CSV staging mapper", () => {
  it("maps names, numeric fees and structured fields", () => {
    const item = mapStagedBuilding(row({ 1: "123", 2: "อาคารทดสอบ", 4: "MOU", 17: "1,200.50", 25: '{"version":1}', 26: "null" }));
    expect(item.conditions.damage_deposit).toBe(1200.5);
    expect(item.conditions.installation_profile).toEqual({ version: 1 });
    expect(item.conditions.other_fees).toBeNull();
    expect(item.feeReviewFields).toEqual([]);
    expect(item.fees).toMatchObject([{ sourceKey: "damage_deposit", amount: "1200.50", costType: "DEPOSIT" }]);
  });

  it("quarantines every fee if a row contains misplaced text", () => {
    const item = mapStagedBuilding(row({ 1: "124", 2: "อาคารทดสอบ", 17: "เขต", 20: "1000" }));
    expect(item.feeReviewFields).toEqual(["damage_deposit"]);
    expect(item.conditions.main_fee).toBeUndefined();
    expect(item.conditions._migration.fee_review_required).toBe(true);
    expect(item.fees).toEqual([]);
  });
});
