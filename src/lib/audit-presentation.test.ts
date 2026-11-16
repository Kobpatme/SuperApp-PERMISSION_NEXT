import { describe, expect, it } from "vitest";
import { auditDiff, summarizeAudit } from "@/lib/audit-presentation";

describe("audit presentation", () => {
  it("turns a role permission change into one readable Thai sentence", () => {
    const summary = summarizeAudit({
      action: "role.permissions.update",
      before: { name: "ผู้จัดการ", capabilityCodes: ["work.task.read", "work.task.update"] },
      after: { name: "ผู้จัดการ", capabilityCodes: ["work.task.read", "work.task.create", "work.task.update"] },
    });
    expect(summary).toBe('แก้สิทธิ์บทบาท "ผู้จัดการ" · เพิ่ม 1 · ถอด 0');
  });

  it("states whether a module was opened or closed", () => {
    expect(summarizeAudit({ action: "module.enabled.changed", before: { enabled: false }, after: { enabled: true, moduleId: "duct-rental" } }))
      .toBe('เปลี่ยนสถานะโมดูล "duct-rental" เป็น เปิดใช้งาน');
  });

  it("lists only fields that really changed, with Thai labels and a code fallback", () => {
    const changes = auditDiff({ before: { displayName: "เดิม", status: "active" }, after: { displayName: "ใหม่", status: "active", customField: "x" } });
    expect(changes).toEqual([
      { field: "displayName", label: "ชื่อที่แสดง", before: "เดิม", after: "ใหม่" },
      { field: "customField", label: "customField", before: "—", after: "x" },
    ]);
  });

  it("falls back to the raw action for unmapped events and summarises counts", () => {
    expect(summarizeAudit({ action: "custom.event", before: { name: "a" }, after: { name: "b" } })).toBe("custom.event · เปลี่ยน 1 รายการ");
    expect(summarizeAudit({ action: "custom.event" })).toBe("custom.event");
  });
});
