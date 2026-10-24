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
  it("uses the canonical shell on the overview route", () => {
    const html = renderToStaticMarkup(<AppShell allowedModuleIds={[]}>เนื้อหา</AppShell>);

    expect(html).toContain("data-app-shell");
    expect(html).not.toContain("data-work-rollout-shell");
    expect(html).not.toContain('class="app workspace-shell');
  });
});
