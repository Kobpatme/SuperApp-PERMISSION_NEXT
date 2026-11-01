import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ allowed: true, permissions: ["duct_rental.module.view", "duct_rental.request.create", "duct_rental.request.update", "duct_rental.document.read", "duct_rental.document.export", "duct_rental.document.upload", "duct_rental.settings.manage", "duct_rental.renewal.create", "duct_rental.cancellation.create", "duct_rental.signoff.sign"] as string[] }));
vi.mock("@/lib/access", () => ({ getAccessContext: vi.fn(async () => ({ allowed: state.allowed, userId: "user-1", displayName: "ผู้ทดสอบ", email: "test@example.invalid", permissions: state.permissions })) }));
vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ SUPPORT_CONTACT_TEXT: "" }) }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND"); }, useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
const request = { id: "request-1", code: "RQ-TEST-001", projectName: "โครงการทดสอบ", routeName: "เส้นทางทดสอบ", ownerDuct: "NT", serviceCenter: "กรุงเทพ", province: "กรุงเทพมหานคร", district: "บางรัก", requestType: "NEW", phase: "DESIGN", phaseStatuses: { DESIGN: "pending" }, phaseNotes: {}, missingDocs: "", version: 1, archivedAt: null, cancelledAt: null, updatedAt: "2026-10-28T00:00:00.000Z", install: null, asBuilt: null, design: { projectName: "โครงการทดสอบ", routeName: "เส้นทางทดสอบ", ownerDuct: "NT", serviceCenter: "กรุงเทพ", province: "กรุงเทพมหานคร", district: "บางรัก", requestType: "NEW" }, rate: null, guarantee: null, files: [], capabilities: state.permissions, signers: [], assignedSignerId: null, signoff: null, isSigned: false };
const list = { rows: [{ id: request.id, code: request.code, projectName: request.projectName, routeName: request.routeName, ownerDuct: request.ownerDuct, serviceCenter: request.serviceCenter, province: request.province, phase: request.phase, phaseStatuses: request.phaseStatuses, requestType: request.requestType, missingDocs: "", cancelledAt: null, version: 1, updatedAt: request.updatedAt, documentsIncomplete: false }], counts: { total: 1, pending: 1, active: 0 }, queues: { waiting: 1, missing: 0 }, pipeline: [], offset: 0, limit: 50, nextOffset: null };
const renewal = { id: "renewal-1", year: 2026, status: "draft", version: 1, createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z", totalYearlyCost: "0.00", archivedAt: null, contractedAt: null, contractDocumentId: null, contractNumber: null, thirdPartyNotes: null, capabilities: [], routes: [], documents: [] };
const cancellation = { id: "cancellation-1", requestId: request.id, version: 1, status: "cancel_initiated", createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z", completedAt: null, rejectedAt: null, archivedAt: null, effectiveDate: "2026-11-01", reason: "ทดสอบ", notes: "", monthlyFee: "0.00", yearlyFee: "0.00", contractStart: null, contractEnd: null, capabilities: [], snapshot: { code: request.code, projectName: request.projectName, routeName: request.routeName, ownerDuct: request.ownerDuct, serviceCenter: request.serviceCenter, province: request.province, district: request.district } };
const processes = { renewals: [], cancellations: [], renewalCount: 0, cancellationCount: 0 }, tracking = { rows: [], counts: { total: 0, completed: 0, nearDue: 0, overdue: 0 }, offset: 0, limit: 100, nextOffset: null }, cables = { rows: [], count: 0, nextOffset: null }, signing = { tasks: [], assets: [], total: 0, nextOffset: null }, options = { teams: [], coordinators: [] };
vi.mock("@/modules/duct-rental/components/use-resource", () => ({ useResource: (path: string | null) => ({ data: path?.startsWith("requests/") ? request : path?.startsWith("requests?") ? list : path?.startsWith("renewals/") ? renewal : path?.startsWith("cancellations/") ? cancellation : path?.startsWith("processes") ? processes : path?.startsWith("tracking") ? tracking : path?.startsWith("cables") ? cables : path?.startsWith("signatures") ? signing : path === "settings" ? { version: 1, service_center_teams: {}, coordinator_phones: {} } : path === "options" ? options : undefined, error: "", loading: false, online: true, changed: false, realtime: "connected", at: "2026-10-28T00:00:00.000Z", refresh: vi.fn() }) }));
vi.mock("@/modules/duct-rental/components/api-client", async () => ({ ...(await vi.importActual<typeof import("@/modules/duct-rental/components/api-client")>("@/modules/duct-rental/components/api-client")), apiPost: vi.fn() }));
import ListPage from "@/app/(platform)/duct-rental/page";
import NewPage from "@/app/(platform)/duct-rental/new/page";
import DetailPage from "@/app/(platform)/duct-rental/[id]/page";
import EditPage from "@/app/(platform)/duct-rental/[id]/edit/page";
import PhasePage from "@/app/(platform)/duct-rental/[id]/[view]/page";
import RenewalListPage from "@/app/(platform)/duct-rental/renewal/page";
import RenewalDetailPage from "@/app/(platform)/duct-rental/renewal/[id]/page";
import CancellationListPage from "@/app/(platform)/duct-rental/cancellation/page";
import CancellationNewPage from "@/app/(platform)/duct-rental/cancellation/new/page";
import CancellationDetailPage from "@/app/(platform)/duct-rental/cancellation/[id]/page";
import CablePage from "@/app/(platform)/duct-rental/communication-cable/page";
import SettingsPage from "@/app/(platform)/duct-rental/settings/page";
import TasksPage from "@/app/(platform)/duct-rental/tasks/page";
import TrackingPage from "@/app/(platform)/duct-rental/tracking/page";
async function html(page: Promise<React.ReactElement> | React.ReactElement) { return renderToStaticMarkup(await page); }
function expectComposed(markup: string, title: string) { expect(markup.match(/<h1/g)?.length).toBe(1); expect(markup).toContain(title === "งานต่อสัญญา" ? "ต่อสัญญาปี" : title); }
beforeEach(() => { state.allowed = true; });
describe("duct-rental production route composition", () => {
  it.each([
    ["/duct-rental", () => ListPage(), "เช่าท่อร้อยสาย"], ["/duct-rental/new", () => NewPage(), "สร้างคำขอ"], ["/duct-rental/[id]", () => DetailPage({ params: Promise.resolve({ id: request.id }) }), "RQ-TEST-001"], ["/duct-rental/[id]/edit", () => EditPage({ params: Promise.resolve({ id: request.id }) }), "แก้ไข"], ["/duct-rental/renewal", () => RenewalListPage(), "ต่อสัญญาเช่าท่อรายปี"], ["/duct-rental/renewal/[id]", () => RenewalDetailPage({ params: Promise.resolve({ id: "renewal-1" }) }), "งานต่อสัญญา"], ["/duct-rental/cancellation", () => CancellationListPage(), "ยกเลิกการใช้ท่อ"], ["/duct-rental/cancellation/new", () => CancellationNewPage({ searchParams: Promise.resolve({}) }), "ขอยกเลิกการใช้ท่อ"], ["/duct-rental/cancellation/[id]", () => CancellationDetailPage({ params: Promise.resolve({ id: "cancellation-1" }) }), "ยกเลิกการใช้ท่อ"], ["/duct-rental/communication-cable", () => CablePage(), "พาดสายสื่อสาร"], ["/duct-rental/settings", () => SettingsPage(), "ตั้งค่าผู้ประสานงานเช่าท่อ"], ["/duct-rental/tasks", () => TasksPage({ searchParams: Promise.resolve({}) }), "งานลงนาม NT Form"], ["/duct-rental/tracking", () => TrackingPage({ searchParams: Promise.resolve({}) }), "ติดตามงานต่อสัญญาและยกเลิก"],
  ])("renders actual production export for %s", async (_route, render, title) => { const markup = await html(render()); expectComposed(markup, title); expect(markup).toContain("เช่าท่อร้อยสาย"); });
  it.each(["design", "draftsman", "permission", "install", "draftsman2", "permission2", "3rdparty", "permission3", "contract", "missing-docs"])("maps dynamic phase view %s into RequestWorkspace", async view => { const markup = await html(PhasePage({ params: Promise.resolve({ id: request.id, view }), searchParams: Promise.resolve({}) })); expectComposed(markup, "RQ-TEST-001"); expect(markup).toContain("ขั้นตอนคำขอ"); });
  it("rejects invalid dynamic phase before rendering", async () => { await expect(PhasePage({ params: Promise.resolve({ id: request.id, view: "not-a-phase" }), searchParams: Promise.resolve({}) })).rejects.toThrow("NEXT_NOT_FOUND"); });
  it("covers settings and signing permission branches on actual route exports", async () => {
    state.allowed = true;
    const allowedSettings = await html(SettingsPage());
    const allowedTasks = await html(TasksPage({ searchParams: Promise.resolve({}) }));
    expect(allowedSettings).toContain("ตั้งค่าผู้ประสานงานเช่าท่อ");
    expect(allowedTasks).toContain("งานลงนาม NT Form");
    expect(allowedTasks).toContain("จัดการลายเซ็นของฉัน");
    state.permissions = state.permissions.filter(permission => permission !== "duct_rental.settings.manage" && permission !== "duct_rental.signoff.sign");
    const deniedSettings = await html(SettingsPage());
    const readOnlyTasks = await html(TasksPage({ searchParams: Promise.resolve({}) }));
    expect(deniedSettings).toContain("สิทธิ์การใช้งาน");
    expect(readOnlyTasks).not.toContain("จัดการลายเซ็นของฉัน");
  });
});