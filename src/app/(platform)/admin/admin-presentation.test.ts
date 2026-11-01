import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("Admin shared presentation contract", () => {
  it("marks Admin as a canonical UI screen", () => {
    expect(pageSource).toContain('data-ui-screen="admin"');
  });

  it("groups tasks in the approved user-centered navigation hierarchy", () => {
    expect(pageSource).toContain('group:"บัญชีและองค์กร"');
    expect(pageSource).toContain('group:"สิทธิ์และการเข้าถึง"');
    expect(pageSource).toContain('group:"ตั้งค่าพื้นที่ทำงาน"');
    expect(pageSource).toContain('group:"ตรวจสอบและกู้คืน"');
    expect(pageSource).toContain('href={`/admin?section=${item.id}`}');
  });

  it("keeps permission-conditioned sections and application-level scope clear", () => {
    expect(pageSource).toContain('allowed:permissionsGranted.modules');
    expect(pageSource).toContain('allowed:access.permissions.includes("work.task.delete")');
    expect(pageSource).toContain("การจัดการภายในแอป");
    expect(pageSource).toContain("แสดงเฉพาะส่วนที่คุณมีสิทธิ์เข้าถึง");
    expect(pageSource).not.toMatch(/SQL console|database browser|raw DB/i);
  });

  it("groups overview task cards and retains descriptive scope/counts", () => {
    expect(pageSource).toContain("admin-overview-group");
    expect(pageSource).toContain("{item.description}");
    expect(pageSource).toContain("{item.count}");
  });
});
