import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/app/(platform)/admin/actions", () => ({
  createPositionAction: () => null, createRoleAction: () => null, createTeamAction: () => null, createUserAction: () => null,
  deleteTeamAction: () => null, deleteRoleAction: () => null, resetPasswordAction: () => null, revokeUserSessionsAction: () => null,
  updatePositionAction: () => null, updateRolePermissionsAction: () => null, updateTeamAction: () => null, updateUserAccessAction: () => null,
}));
vi.mock("@/app/(platform)/admin/work-actions", () => ({ saveWorkAdminAction: () => null, previewWorkAdminAction: () => null, confirmWorkAdminAction: () => null }));
vi.mock("@/app/(platform)/work/actions", () => ({ restoreWorkTaskAction: () => null }));
import { AdminWorkspace } from "./admin-workspace";
import { AdminModuleSettings } from "./admin-module-settings";
import { WorkAdminPanels } from "@/features/work/components/admin-panels";
import type { WorkAdminData } from "@/lib/work-admin-read";

const base = {
  users: [{ id: "u1", email: "admin@example.invalid", displayName: "ผู้ดูแล", employeeCode: "A-1", status: "active", positionId: "p1", positionName: "ผู้ดูแลระบบ", teamId: "t1" }],
  positions: [{ id: "p1", code: "admin", name: "ผู้ดูแลระบบ", scopeType: "ALL", roleId: "r1", roleName: "ผู้ดูแล" }],
  roles: [{ id: "r1", code: "platform_admin", name: "ผู้ดูแล", description: "ดูแลระบบ", isSystem: true }],
  teams: [{ id: "t1", code: "ops", name: "ปฏิบัติการ" }],
  rolePermissions: [{ roleId: "r1", code: "core.user.manage", description: "จัดการผู้ใช้" }],
  userScopes: [{ userId: "u1", permissionCode: null, scopeType: "ALL", selectedTeamId: null }],
  positionTeams: [] as { positionId: string; teamId: string }[],
  sessions: [{ userId: "u1", count: 1 }],
  auditRows: [],
  capabilities: [{ moduleId: "core", moduleName: "ระบบกลาง", code: "core.user.manage", labelTh: "จัดการผู้ใช้", descriptionTh: "จัดการบัญชีผู้ใช้", allowedScopes: ["OWN", "TEAM", "SELECTED_TEAMS", "ALL"] as ("OWN" | "TEAM" | "SELECTED_TEAMS" | "ALL")[], risk: "administrative" as const }],
  permissionsGranted: { users: true, profiles: true, positions: true, teams: true, roles: true, audit: true },
};
const workData = {
  granted: { calendar: true, systems: true, announcement: true, kpi: true },
  calendar: [], links: [], announcements: [], catalog: [], personals: [], teams: [], roles: [], people: [], deleted: [],
} as unknown as WorkAdminData;

describe("admin composed presentation", () => {
  it.each([
    ["users", "ผู้ใช้และทบทวนสิทธิ์"],
    ["positions", "ตำแหน่ง"],
    ["teams", "ทีม"],
    ["roles", "บทบาทและสิทธิ์การใช้งาน"],
    ["audit", "ประวัติการเปลี่ยนแปลง"],
  ])("renders the real %s workspace with a labelled surface", (section, heading) => {
    const html = renderToStaticMarkup(<AdminWorkspace section={section} {...base} />);
    expect(html).toContain(`data-admin-surface="${section}"`);
    expect(html).toContain(`<h2>${heading}</h2>`);
    expect(html).toContain("admin-status-badge");
  });

  it("does not render a denied account surface when the capability is absent", () => {
    const html = renderToStaticMarkup(<AdminWorkspace section="users" {...base} permissionsGranted={{ users: false, profiles: false, positions: false, teams: false, roles: false, audit: false }} />);
    expect(html).not.toContain('data-admin-surface="users"');
    expect(html).not.toContain("จัดการการเข้าถึง");
  });

  it("distinguishes an empty audit result without changing the query or actions", () => {
    const html = renderToStaticMarkup(<AdminWorkspace section="audit" {...base} />);
    expect(html).toContain("ยังไม่มีประวัติการเปลี่ยนแปลง");
    expect(html).toContain("admin-table-wrap");
  });

  it("uses canonical action hierarchy for destructive admin actions", () => {
    const html = renderToStaticMarkup(<AdminWorkspace section="teams" {...base} />);
    expect(html).toContain("ui-button-danger");
    expect(html).toContain('data-dialog-size="compact"');
  });

  it("groups module toggles in one shared panel instead of stacked cards", () => {
    const html = renderToStaticMarkup(<AdminModuleSettings available items={[{ id: "core", name: "ระบบกลาง", description: "ศูนย์กลางระบบ", enabled: true, version: 1, ready: true, lifecycle: "active", entryPermissions: ["core.profile.read"] }]} />);
    expect(html).toContain('class="ui-panel admin-module-settings"');
    expect(html).toContain("admin-module-card");
    expect(html).not.toContain('class="admin-panel"');
  });

  it("scopes a position to an explicit team list and preselects saved teams", () => {
    const html = renderToStaticMarkup(<AdminWorkspace section="positions" {...base} />);
    expect(html).toContain('value="SELECTED_TEAMS"');
    expect(html).toContain("admin-team-picker");

    const saved = renderToStaticMarkup(<AdminWorkspace section="positions" {...base} positionTeams={[{ positionId: "p1", teamId: "t1" }]} />);
    expect(saved).toMatch(/name="selectedTeamId" checked="" value="t1"/);
  });

  it("renders audit history as Thai sentences with an expandable change list", () => {
    const html = renderToStaticMarkup(<AdminWorkspace section="audit" {...base} auditRows={[{
      id: "a1", actorId: "u1", moduleId: "core", action: "role.permissions.update", entityType: "role", entityId: "r1",
      before: { name: "ผู้จัดการ", capabilityCodes: ["work.task.read"] }, after: { name: "ผู้จัดการ", capabilityCodes: ["work.task.read", "work.task.update"] },
      createdAt: "2026-11-16T05:00:00.000Z",
    }]} />);
    expect(html).toContain("แก้สิทธิ์บทบาท");
    expect(html).toContain("เพิ่ม 1");
    expect(html).toContain("ดูสิ่งที่เปลี่ยน");
  });

  it("links a position to the users it currently covers and filters them", () => {
    const html = renderToStaticMarkup(<AdminWorkspace section="positions" {...base} />);
    expect(html).toContain("admin-position-review");
    expect(html).toContain("positionId=p1");
    const filtered = renderToStaticMarkup(<AdminWorkspace section="users" {...base} filterPositionId="p1" />);
    expect(filtered).toContain("admin-filter-chip");
  });

  it("shows how many roles see a module and links to role management", () => {
    const html = renderToStaticMarkup(<AdminModuleSettings available items={[{ id: "work", name: "งานและ KPI", description: "งาน", enabled: true, version: 1, ready: true, lifecycle: "active", entryPermissions: ["work.task.read"], visibleRoleCount: 2 }]} />);
    expect(html).toContain("บทบาทที่เห็น 2");
    expect(html).toContain('href="/admin?section=roles"');
  });

  it("shows each role the modules it can actually enter, including the zero case", () => {
    const html = renderToStaticMarkup(<AdminWorkspace section="roles" {...base} />);
    expect(html).toContain("admin-role-visibility");
    expect(html).toMatch(/มองเห็น <b>\d+<\/b> จาก \d+ โมดูล/);
    expect(html).not.toContain("is-visible");

    const withEntry = renderToStaticMarkup(<AdminWorkspace section="roles" {...base} rolePermissions={[{ roleId: "r1", code: "building.record.read", description: null }]} />);
    expect(withEntry).toContain("is-visible");
    expect(withEntry).toContain("ข้อมูลอาคาร");
  });

  it("composes every work-admin section with its real presentational branch", () => {
    const sections = ["kpi", "personal-kpi", "calendar", "recalculate", "systems", "announcement", "restore"];
    for (const section of sections) {
      const html = renderToStaticMarkup(<WorkAdminPanels section={section} data={workData} />);
      expect(html).toContain(`data-admin-surface="${section}"`);
    }
    expect(renderToStaticMarkup(<WorkAdminPanels section="restore" data={workData} />)).toContain("ไม่มีงานที่รอกู้คืน");
  });
});
