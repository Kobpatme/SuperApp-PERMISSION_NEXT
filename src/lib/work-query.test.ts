import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { csvCell, parseWorkFilters, taskQueryCondition } from "@/lib/work-query";
import type { AuthorizationSubject } from "@/lib/authorization";
const id = "00000000-0000-4000-8000-000000000001";
const subject: AuthorizationSubject = { userId: id, teamIds: [], grants: [{ permission: "work.task.read", scope: "SELECTED_TEAMS", selectedTeamId: id }] };
describe("scoped work filters and export", () => {
  it("denies missing permission and combines user filters with the granted team", () => {
    expect(taskQueryCondition({ ...subject, grants: [] })).toBeUndefined();
    const query = new PgDialect().sqlToQuery(taskQueryCondition(subject, { owner: id, status: "completed" })!);
    expect(query.sql).toContain('"tasks"."team_id" in');
    expect(query.sql).toContain('"tasks"."deleted_at" is null');
    expect(query.params).toEqual([id, id, "completed"]);
  });
  it("does not accept forged UUIDs, statuses or filter dates", () => {
    expect(() => parseWorkFilters({ owner: "bad" })).toThrow();
    expect(() => parseWorkFilters({ status: "all" })).toThrow();
    expect(() => parseWorkFilters({ year: "2026", month: "13" })).toThrow();
    expect(parseWorkFilters({ q: "", year: "2026", month: "10" })).toEqual({ year: 2026, month: 10 });
  });
  it("escapes CSV and spreadsheet formulas including whitespace prefixed formulas", () => {
    expect(csvCell('a,"b')).toBe('"a,""b"');
    expect(csvCell(" \t=HYPERLINK(x)")).toBe('"\' \t=HYPERLINK(x)"');
    expect(csvCell("ข้อความไทย")).toBe('"ข้อความไทย"');
  });
});
