import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AccessDenied } from "./access-denied";
import { AccountControl } from "./account-control";
import { ErrorState } from "./ui/error-state";
import { PageSkeleton } from "./ui/page-skeleton";
import { WorkspaceSearch } from "./workspace-search";
import { NotificationCenter } from "./notification-center";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));
vi.mock("@/app/login/actions", () => ({ logoutAction: vi.fn() }));
vi.mock("@/app/(platform)/notification-actions", () => ({ markNotificationsRead: vi.fn() }));
vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ SUPPORT_CONTACT_TEXT: "" }) }));
vi.mock("@/app/(platform)/admin/access-request-actions", () => ({ requestModuleAccessAction: vi.fn() }));

describe("core utility composition", () => {
  it("uses the shared utility state and loading primitives", () => {
    const html = renderToStaticMarkup(<><AccessDenied moduleName="ข้อมูลอาคาร"/><ErrorState reset={() => undefined}/><PageSkeleton/></>);

    expect(html).toContain("core-utility-state");
    expect(html).toContain("core-utility-loading");
    expect(html).toContain("ui-panel");
  });

  it("uses shared popover and search composition without changing controls", () => {
    const html = renderToStaticMarkup(<><AccountControl displayName="ผู้ใช้งาน"/><WorkspaceSearch allowedModuleIds={[]}/></>);

    expect(html).toContain("core-utility-popover");
    expect(html).toContain('aria-controls=');
    expect(html).toContain('role="combobox"');
  });

  it("uses the shared dialog surface for notification states", () => {
    const html = renderToStaticMarkup(<NotificationCenter inbox={{ state: "ready", unread: 0, items: [], canUpdate: false }}/>);

    expect(html).toContain("core-utility-dialog");
    expect(html).toContain("การแจ้งเตือน");
  });
});
