import { describe, expect, it } from "vitest";
import { pageWorkItems, sortWorkItems } from "./work-list-presentation";
const rows = Array.from({ length: 23 }, (_, index) => ({ id: String(index), title: `งาน ${index}`, dueAt: index === 0 ? null : `2026-10-${String(index + 1).padStart(2, "0")}T00:00:00Z` }));
describe("work list presentation — no changes to server query or records", () => {
  it("shows ten rows with an accurate page range", () => {
    expect(pageWorkItems(rows, 2, 10)).toMatchObject({ page: 2, pages: 3, start: 11, end: 20, total: 23, items: rows.slice(10, 20) });
  });
  it("clamps an obsolete page after the server result shrinks", () => {
    expect(pageWorkItems(rows.slice(0, 2), 9, 10)).toMatchObject({ page: 1, start: 1, end: 2, pages: 1 });
  });
  it("represents zero results without a fictitious first row", () => {
    expect(pageWorkItems([], 1, 10)).toMatchObject({ page: 1, start: 0, end: 0, total: 0, items: [] });
  });
  it("keeps the existing server ordering by default and never mutates source rows", () => {
    expect(sortWorkItems(rows, "recent")).toEqual(rows);
    expect(sortWorkItems(rows, "due").at(-1)?.id).toBe("0");
    expect(rows[0].id).toBe("0");
  });
  it("sorts labels for presentation only", () => {
    expect(sortWorkItems([{ title: "ข", dueAt: null }, { title: "ก", dueAt: null }], "title").map(row => row.title)).toEqual(["ก", "ข"]);
  });
});
