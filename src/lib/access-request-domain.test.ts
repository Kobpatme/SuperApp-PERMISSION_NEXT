import { describe, expect, it } from "vitest";
import { accessDecisionNotification, accessRequestStatusLabel, dataScopeLabel, validateAccessDecision, validateAccessReason } from "@/lib/access-request-domain";

describe("access request domain", () => {
  it("trims and normalises the requester reason", () => {
    expect(validateAccessReason("  ต้องการดู   เอกสารอาคาร  ")).toEqual({ ok: true, reason: "ต้องการดู เอกสารอาคาร" });
    expect(validateAccessReason("สั้น")).toMatchObject({ ok: false });
    expect(validateAccessReason("x".repeat(501))).toMatchObject({ ok: false });
  });

  it("requires a reason only when rejecting", () => {
    expect(validateAccessDecision("approve", "")).toEqual({ ok: true, note: null });
    expect(validateAccessDecision("reject", "")).toMatchObject({ ok: false });
    expect(validateAccessDecision("reject", "ไม่ใช่หน้าที่")).toEqual({ ok: true, note: "ไม่ใช่หน้าที่" });
    expect(validateAccessDecision("maybe", "x")).toMatchObject({ ok: false });
    expect(validateAccessDecision("approve", "x".repeat(301))).toMatchObject({ ok: false });
  });

  it("labels the three queue states in Thai", () => {
    expect(["pending", "approved", "rejected"].map(accessRequestStatusLabel)).toEqual(["รอดำเนินการ", "อนุมัติแล้ว", "ปฏิเสธ"]);
  });

  it("labels data scopes in Thai and falls back to the raw value", () => {
    expect(["OWN", "TEAM", "SELECTED_TEAMS", "ALL"].map(dataScopeLabel))
      .toEqual(["เฉพาะงานของตนเอง", "ข้อมูลของทีม", "ข้อมูลของทีมที่เลือก", "ข้อมูลทั้งหมด"]);
    expect(dataScopeLabel("UNKNOWN")).toBe("UNKNOWN");
  });

  it("turns an approval into a notice the requester can read after signing in again", () => {
    const notice = accessDecisionNotification({ decision: "approved", moduleName: "สัญญาเช่าท่อ", roleName: "ช่างเขียนแบบ", scopeLabel: "ข้อมูลของทีม" });
    expect(notice.type).toBe("access.request.approved");
    expect(notice.title).toContain("สัญญาเช่าท่อ");
    expect(notice.body).toContain("ช่างเขียนแบบ");
    expect(notice.body).toContain("เข้าสู่ระบบใหม่");
    expect(notice.href).toBe("/");
  });

  it("keeps the rejection reason in the notice", () => {
    const notice = accessDecisionNotification({ decision: "rejected", moduleName: "อาคาร", note: "ไม่ใช่หน้าที่" });
    expect(notice.type).toBe("access.request.rejected");
    expect(notice.body).toContain("ไม่ใช่หน้าที่");
  });
});
