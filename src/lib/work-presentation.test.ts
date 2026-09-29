import { describe, expect, it } from "vitest";
import { presentWorkStatus } from "@/lib/work-presentation";
describe("work status presentation", () => {
  it("maps workflow states to text, semantic tone and next action", () => {
    expect(presentWorkStatus("blocked")).toEqual({ label: "ติดขัด", tone: "warning", nextAction: "ระบุสิ่งที่ต้องช่วยแก้" });
    expect(presentWorkStatus("completed").tone).toBe("success");
  });
  it("keeps unknown source states visible without implying success", () => {
    expect(presentWorkStatus("source_pending")).toEqual({ label: "source_pending", tone: "neutral", nextAction: "ตรวจสอบรายการ" });
  });
});
