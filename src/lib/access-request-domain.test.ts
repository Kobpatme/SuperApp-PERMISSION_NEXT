import { describe, expect, it } from "vitest";
import { accessRequestStatusLabel, validateAccessDecision, validateAccessReason } from "@/lib/access-request-domain";

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
});
