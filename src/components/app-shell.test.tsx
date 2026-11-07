import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/module-nav", () => ({ ModuleNav: () => <nav>เมนู</nav> }));
vi.mock("@/components/workspace-search", () => ({ WorkspaceSearch: () => <div>ค้นหา</div> }));
vi.mock("@/components/workspace-theme-toggle", () => ({ WorkspaceThemeToggle: () => <button>ธีม</button> }));
vi.mock("@/components/account-control", () => ({ AccountControl: () => <button>บัญชี</button> }));

describe("AppShell", () => {
  it("omits generic shell copy while retaining identity, accessible controls and scope", () => {
    const html = renderToStaticMarkup(<AppShell allowedModuleIds={[]} scopeLabel="ทีมทดสอบ" notificationCenter={<button>การแจ้งเตือน</button>}>เนื้อหา</AppShell>);

    expect(html).not.toContain("พื้นที่ทำงาน");
    expect(html).not.toContain(">เมนูหลัก<");
    expect(html).toContain("Permission Next");
    expect(html).toContain("%2Flogo.png");
    expect(html).toContain('alt=""');
    expect(html).toContain('aria-label="เปิดเมนูนำทาง"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby=');
    expect(html).toContain("ปิดหน้าต่าง");
    expect(html).toContain('aria-label="ยุบเมนูด้านข้าง"');
    expect(html).toContain('aria-controls="workspace-navigation"');
    expect(html).toContain("ข้ามไปยังเนื้อหาหลัก");
    expect(html).toContain("คุณเห็นข้อมูลของ:");
    expect(html).toContain("ทีมทดสอบ");
    for (const label of ["เมนู", "ค้นหา", "ธีม", "บัญชี", "การแจ้งเตือน", "เนื้อหา"]) expect(html).toContain(label);
  });
  it("uses the canonical shell on the overview route", () => {
    const html = renderToStaticMarkup(<AppShell allowedModuleIds={[]}>เนื้อหา</AppShell>);

    expect(html).toContain("data-app-shell");
    expect(html).not.toContain("data-work-rollout-shell");
    expect(html).not.toContain('class="app workspace-shell');
  });
});
