import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { DashboardSnapshot } from "@/lib/dashboard";
import { DashboardOverview } from "./dashboard-overview";

vi.mock("@/components/workspace-queue", () => ({ WorkspaceQueue: () => <div>คิวงาน</div> }));
vi.mock("@/components/workspace-feedback", () => ({
  PreviewNotice: () => null,
  RefreshButton: () => <button>อัปเดต</button>,
  SourceDetails: () => null,
}));

const snapshot = { generatedAt: "2026-10-24T00:00:00Z", sources: [] } as unknown as DashboardSnapshot;

describe("DashboardOverview shared presentation", () => {
  it("uses the canonical screen and empty-state primitives", () => {
    const html = renderToStaticMarkup(<DashboardOverview displayName="ผู้ใช้" userId="user-1" allowedModuleIds={[]} developmentMode={false} preview={false} snapshot={snapshot} />);

    expect(html).toContain("data-ui-screen");
    expect(html).toContain('class="ui-empty overview-empty"');
    expect(html).toContain("ยังไม่มีพื้นที่ทำงานที่เข้าถึงได้");
  });
});
