import { describe, expect, it } from "vitest";
import { assembleBuilding360, availableCommands, searchWorkspace } from "@/lib/cross-module";

const subject = { userId: "u1", teamIds: ["t1"], grants: [{ permission: "building.record.read", scope: "TEAM" as const }, { permission: "work.task.create", scope: "ALL" as const }] };
describe("cross-module experience", () => {
  it("ranks results but never leaks records outside row scope", () => {
    const results = searchWorkspace(subject, "อาคาร", [
      { id: "1", type: "building", title: "อาคารหลัก", href: "/buildings/1", permission: "building.record.read", teamId: "t1", terms: [] },
      { id: "2", type: "building", title: "อาคารลับ", href: "/buildings/2", permission: "building.record.read", teamId: "t2", terms: [] },
    ]);
    expect(results.map((row) => row.id)).toEqual(["1"]);
  });
  it("builds Building 360 only from matching canonical IDs", () => {
    const view = assembleBuilding360("b1", { guarantees: [{ id: "g2", buildingId: "b2" }, { id: "g1", buildingId: "b1" }] });
    expect(view.sections.guarantees.map((row) => row.id)).toEqual(["g1"]);
  });
  it("shows commands only when their action permission exists", () => {
    expect(availableCommands(subject, [{ id: "new-task", label: "สร้างงาน", href: "/work/new", permission: "work.task.create" }, { id: "admin", label: "ผู้ดูแล", href: "/admin", permission: "core.role.manage" }]).map((item) => item.id)).toEqual(["new-task"]);
  });
});
