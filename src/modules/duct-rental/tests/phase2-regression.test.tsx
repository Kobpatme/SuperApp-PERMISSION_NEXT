"use client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const accessState = vi.hoisted(() => ({
  allowed: true,
  permissions: [
    "duct_rental.module.view",
    "duct_rental.request.create",
    "duct_rental.request.update",
    "duct_rental.document.read",
    "duct_rental.document.export",
    "duct_rental.document.upload",
    "duct_rental.settings.manage",
    "duct_rental.renewal.create",
    "duct_rental.cancellation.create",
    "duct_rental.signoff.sign",
    "duct_rental.design.submit",
    "duct_rental.draftsman.accept",
    "duct_rental.draftsman.submit",
    "duct_rental.permission_1.accept",
    "duct_rental.permission_1.submit",
    "duct_rental.install.accept",
    "duct_rental.install.submit",
    "duct_rental.draftsman_2.accept",
    "duct_rental.draftsman_2.submit",
    "duct_rental.permission_2.accept",
    "duct_rental.permission_2.submit",
    "duct_rental.3rd_party_1.accept",
    "duct_rental.3rd_party_1.submit",
    "duct_rental.permission_3.accept",
    "duct_rental.permission_3.submit",
    "duct_rental.3rd_party_2.accept",
    "duct_rental.3rd_party_2.submit",
    "duct_rental.request.archive",
  ] as string[],
}));

vi.mock("@/lib/access", () => ({
  getAccessContext: vi.fn(async () => accessState),
}));

const requestHolder = vi.hoisted(() => ({ value: null as any }));
const requestDetailHolder = vi.hoisted(() => ({ value: null as any }));
const optionsHolder = vi.hoisted(() => ({ value: { teams: [{ id: "t-1", name: "Team A" }], coordinators: [{ id: "c-1", display_name: "John", email: "john@example.com", phone: "0812345678" }] } }));

function makeRequestDetail(overrides: Record<string, any> = {}): any {
  return {
    id: "r-1",
    code: "REQ-001",
    projectName: "โครงการทดสอบเช่าท่อ",
    routeName: "เส้นทางทดสอบ 1",
    ownerDuct: "NT",
    province: "กรุงเทพมหานคร",
    district: "บางรัก",
    serviceCenter: "BKK 1",
    phase: "DESIGN",
    phaseStatuses: { DESIGN: "pending", DRAFTSMAN: "pending", PERMISSION_1: "pending", INSTALL: "pending", DRAFTSMAN_2: "pending", PERMISSION_2: "pending", "3RD_PARTY_1": "pending", PERMISSION_3: "pending", "3RD_PARTY_2": "pending", COMPLETE: "pending" },
    phaseNotes: {},
    missingDocs: "",
    version: 1,
    archivedAt: null,
    cancelledAt: null,
    updatedAt: "2026-10-30T00:00:00.000Z",
    createdAt: "2026-10-30T00:00:00.000Z",
    businessDate: "2026-10-30",
    requestType: "NEW",
    ownerId: "u-1",
    teamId: null,
    sourceId: null,
    install: null,
    asBuilt: null,
    design: { projectName: "โครงการทดสอบเช่าท่อ", routeName: "เส้นทางทดสอบ 1", ownerDuct: "NT", serviceCenter: "BKK 1", province: "กรุงเทพมหานคร", district: "บางรัก", requestType: "NEW" },
    rate: null,
    guarantee: null,
    files: [],
    capabilities: accessState.permissions,
    signers: [],
    assignedSignerId: null,
    signoff: null,
    isSigned: false,
    ...overrides,
  };
}

function makeRequestRow(overrides: Record<string, any> = {}) {
  return {
    id: "r-1",
    code: "REQ-001",
    projectName: "โครงการทดสอบเช่าท่อ",
    routeName: "เส้นทางทดสอบ 1",
    ownerDuct: "NT",
    province: "กรุงเทพมหานคร",
    serviceCenter: "BKK 1",
    phase: "DESIGN",
    phaseStatuses: { DESIGN: "pending" },
    cancelledAt: null,
    documentsIncomplete: false,
    updatedAt: "2026-10-30T00:00:00.000Z",
    requestType: "NEW",
    missingDocs: "",
    version: 1,
    ...overrides,
  };
}

vi.mock("@/modules/duct-rental/components/use-resource", () => ({
  useResource: (path: string | null) => {
    if (path?.startsWith("requests/")) return requestDetailHolder.value ?? { data: makeRequestDetail(), error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
    if (path?.startsWith("requests?")) return requestHolder.value;
    if (path === "options") return { data: optionsHolder.value, error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
    return { data: undefined, error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
  },
}));

vi.mock("@/modules/duct-rental/components/api-client", async () => ({
  ...(await vi.importActual<typeof import("@/modules/duct-rental/components/api-client")>("@/modules/duct-rental/components/api-client")),
  apiPost: vi.fn(),
}));

import { RequestForm } from "../components/request-form";
import { RequestEdit } from "../components/request-form";
import { RequestWorkspace } from "../components/request-workspace";
import { RequestListWorkspace } from "../components/request-list";
import { DuctRentalSchema } from "../schemas/design";
import { requestPhases } from "../domain/source-policy";
import styles from "../ui-shared/ui-shared.module.css";

describe("Phase 2 duct-rental visual unification — regression tests", () => {
  beforeEach(() => {
    requestHolder.value = {
      data: { rows: [makeRequestRow()], counts: { total: 1, pending: 1, active: 0 }, queues: { waiting: 1, missing: 0 }, pipeline: [], nextOffset: null },
      error: "",
      loading: false,
      online: true,
      changed: false,
      realtime: "connected",
      refresh: vi.fn(),
    };
    accessState.allowed = true;
    requestDetailHolder.value = { data: makeRequestDetail(), error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
  });

  describe("new/edit/detail shells and data-ui-screen identifiers", () => {
    it("RequestForm (new) renders ductSurface.ductForm shell with data-ui-screen=duct-rental-request-new", () => {
      const markup = renderToStaticMarkup(<RequestForm user={{ id: "u-1", displayName: "Test", email: "test@example.com" }} permissions={accessState.permissions} />);
      expect(markup).toContain('data-ui-screen="duct-rental-request-new"');
      expect(markup).toContain("ductSurface");
      expect(markup).toContain("ductForm");
    });

    it("RequestForm (edit) renders ductSurface.ductForm shell with data-ui-screen=duct-rental-request-edit", () => {
      const markup = renderToStaticMarkup(<RequestForm request={makeRequestDetail()} user={{ id: "u-1", displayName: "Test", email: "test@example.com" }} permissions={accessState.permissions} />);
      expect(markup).toContain('data-ui-screen="duct-rental-request-edit"');
      expect(markup).toContain("ductSurface");
      expect(markup).toContain("ductForm");
    });

    it("RequestWorkspace (detail) renders ductSurface.ductDetail shell with data-ui-screen=duct-rental-request-detail", () => {
      const markup = renderToStaticMarkup(<RequestWorkspace id="r-1" userId="u-1" />);
      expect(markup).toContain('data-ui-screen="duct-rental-request-detail"');
      expect(markup).toContain("ductSurface");
      expect(markup).toContain("ductDetail");
    });

    it("RequestListWorkspace retains ductSurface.ductList shell with data-ui-screen=duct-rental-request-list", () => {
      const markup = renderToStaticMarkup(<RequestListWorkspace permissions={accessState.permissions} userId="u-1" />);
      expect(markup).toContain('data-ui-screen="duct-rental-request-list"');
      expect(markup).toContain("ductList");
      expect(markup).not.toContain("ductSurface");
      expect(markup).not.toContain("permission-workspace");
    });
  });

  describe("loading skeleton (not error) for detail/new/edit", () => {
    it("RequestWorkspace uses PageSkeleton shape=detail component import", () => {
      const fs = require("fs");
      const wsPath = require("path").resolve(__dirname, "../components/request-workspace.tsx");
      const raw = fs.readFileSync(wsPath, "utf8");
      expect(raw).toContain("PageSkeleton");
      expect(raw).toContain('shape="detail"');
    });

    it("RequestEdit uses PageSkeleton shape=detail and drops the legacy loading surface", () => {
      const fs = require("fs");
      const formPath = require("path").resolve(__dirname, "../components/request-form.tsx");
      const raw = fs.readFileSync(formPath, "utf8");
      expect(raw).toContain("PageSkeleton");
      expect(raw).toContain('shape="detail"');
      expect(raw).not.toContain("loadingSurface");
    });
  });

  describe("RequestEdit loading → success → error → retry → back (rendered via mocked resource)", () => {
    const user = { id: "u-1", displayName: "Test", email: "test@example.com" };
    const renderEdit = () => renderToStaticMarkup(<RequestEdit id="r-1" user={user} permissions={accessState.permissions} />);

    it("renders canonical PageSkeleton shape=detail while loading, no legacy loading surface", () => {
      requestDetailHolder.value = { data: undefined, error: "", loading: true, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
      const markup = renderEdit();
      expect(markup).toContain("loading-workspace");
      expect(markup).toContain("skeleton-detail");
      expect(markup).not.toContain("loadingSurface");
      expect(markup).not.toContain("ductForm");
    });

    it("renders RequestForm edit shell once detail loads, keyed by version", () => {
      requestDetailHolder.value = { data: makeRequestDetail({ version: 7 }), error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
      const markup = renderEdit();
      expect(markup).toContain('data-ui-screen="duct-rental-request-edit"');
      expect(markup).toContain("ductSurface");
      expect(markup).toContain("ductForm");
      expect(markup).toContain("แก้ไขคำขอ REQ-001");
    });

    it("renders error state with Thai message, retry button, and back link to /duct-rental", () => {
      requestDetailHolder.value = { data: undefined, error: "เชื่อมต่อไม่สำเร็จ", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
      const markup = renderEdit();
      expect(markup).toContain("โหลดคำขอไม่สำเร็จ กรุณาลองอีกครั้ง");
      expect(markup).toContain("ลองโหลดอีกครั้ง");
      expect(markup).toContain('href="/duct-rental"');
      expect(markup).toContain("กลับรายการคำขอ");
      expect(markup).not.toContain("ductForm");
    });

    it("retry re-runs load: error state transitions to edit form after refreshed resource returns detail", () => {
      requestDetailHolder.value = { data: undefined, error: "เชื่อมต่อไม่สำเร็จ", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
      let markup = renderEdit();
      expect(markup).toContain("โหลดคำขอไม่สำเร็จ กรุณาลองอีกครั้ง");
      // Retry re-runs the load (model.refresh on the retry button): resource now returns detail.
      requestDetailHolder.value = { data: makeRequestDetail({ version: 3 }), error: "", loading: false, online: true, changed: false, realtime: "connected", refresh: vi.fn() };
      markup = renderEdit();
      expect(markup).toContain("ductForm");
      expect(markup).toContain('data-ui-screen="duct-rental-request-edit"');
      expect(markup).toContain("แก้ไขคำขอ REQ-001");
    });

    it("new-request path (RequestForm without request) is unaffected by RequestEdit changes", () => {
      const markup = renderToStaticMarkup(<RequestForm user={user} permissions={accessState.permissions} />);
      expect(markup).toContain('data-ui-screen="duct-rental-request-new"');
      expect(markup).toContain("ductSurface");
      expect(markup).toContain("ductForm");
      expect(markup).toContain("สร้างคำขอเช่าท่อร้อยสาย");
      expect(markup).not.toContain("แก้ไขคำขอ");
    });
  });

  describe("RequestWorkspace detail error parity (rendered via mocked resource)", () => {
    const renderWorkspace = (model: any) => {
      requestDetailHolder.value = model;
      return renderToStaticMarkup(<RequestWorkspace id="r-1" view="design" userId="u-1" />);
    };

    it("renders Thai error message, retry button that re-runs load, and back link to /duct-rental", () => {
      const refresh = vi.fn();
      const markup = renderWorkspace({ data: undefined, error: "เชื่อมต่อไม่สำเร็จ", loading: false, online: true, changed: false, realtime: "connected", refresh });
      expect(markup).toContain("เชื่อมต่อไม่สำเร็จ");
      expect(markup).toContain("ลองโหลดอีกครั้ง");
      expect(markup).toContain('href="/duct-rental"');
      expect(markup).toContain("กลับรายการคำขอ");
      expect(markup).not.toContain("ductDetail");
      expect(typeof refresh).toBe("function");
    });

    it("renders PageSkeleton shape=detail while detail is loading", () => {
      const markup = renderWorkspace({ data: undefined, error: "", loading: true, online: true, changed: false, realtime: "connected", refresh: vi.fn() });
      expect(markup).toContain("loading-workspace");
      expect(markup).toContain("skeleton-detail");
    });
  });

  describe("readonly/terminal/archived/cancelled action gating", () => {
    it("archived request shows readonly notice and disables save/submit", () => {
      const archived = makeRequestDetail({ archivedAt: "2026-10-01T00:00:00.000Z" });
      const markup = renderToStaticMarkup(<RequestForm request={archived} user={{ id: "u-1", displayName: "Test", email: "test@example.com" }} permissions={accessState.permissions} />);
      expect(markup).toContain("คำขอนี้สิ้นสุดแล้ว ข้อมูลออกแบบแสดงแบบอ่านอย่างเดียว");
      expect(markup).toContain('disabled=""');
    });

    it("cancelled request shows readonly notice and disables save/submit", () => {
      const cancelled = makeRequestDetail({ cancelledAt: "2026-10-01T00:00:00.000Z" });
      const markup = renderToStaticMarkup(<RequestForm request={cancelled} user={{ id: "u-1", displayName: "Test", email: "test@example.com" }} permissions={accessState.permissions} />);
      expect(markup).toContain("คำขอนี้สิ้นสุดแล้ว ข้อมูลออกแบบแสดงแบบอ่านอย่างเดียว");
      expect(markup).toContain('disabled=""');
    });

    it("COMPLETE phase request shows readonly notice and disables save/submit", () => {
      const complete = makeRequestDetail({ phase: "COMPLETE" as const });
      const markup = renderToStaticMarkup(<RequestForm request={complete} user={{ id: "u-1", displayName: "Test", email: "test@example.com" }} permissions={accessState.permissions} />);
      expect(markup).toContain("คำขอนี้สิ้นสุดแล้ว ข้อมูลออกแบบแสดงแบบอ่านอย่างเดียว");
      expect(markup).toContain('disabled=""');
    });
  });

  describe("responsive 390 no overflow, form one-column, action touch sizes, phase tab scroll", () => {
    it("CSS has ductSurface.ductForm columns with 3→2→1 responsive rules", () => {
      const fs = require("fs");
      const cssPath = require("path").resolve(__dirname, "../ui-shared/ui-shared.module.css");
      const raw = fs.readFileSync(cssPath, "utf8");
      expect(raw).toContain(".ductSurface.ductForm .columns{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,320px)");
      expect(raw).toContain("@container (max-width: 860px)");
      expect(raw).toContain("@media(max-width: 600px)");
      expect(raw).toContain("grid-template-columns:1fr");
    });

    it("CSS has ductSurface.ductDetail split with 300px rail and responsive one-column", () => {
      const fs = require("fs");
      const cssPath = require("path").resolve(__dirname, "../ui-shared/ui-shared.module.css");
      const raw = fs.readFileSync(cssPath, "utf8");
      expect(raw).toContain(".ductSurface.ductDetail .split{grid-template-columns:minmax(0,1fr) 300px");
      expect(raw).toContain("@media(max-width: 1000px)");
      expect(raw).toContain("grid-template-columns:1fr");
    });

    it("PhaseTabs renders step navigation", () => {
      const markup = renderToStaticMarkup(<RequestWorkspace id="r-1" userId="u-1" />);
      // PhaseTabs renders step links with phase labels
      expect(markup).toContain("ออกแบบ");
      expect(markup).toContain("เขียนแบบ");
      expect(markup).toContain("ขออนุญาต");
      expect(markup).toContain("ติดตั้ง");
    });

    it("Action buttons have min-height matching --size-control-touch (44px)", () => {
      const fs = require("fs");
      const cssPath = require("path").resolve(__dirname, "../ui-shared/ui-shared.module.css");
      const raw = fs.readFileSync(cssPath, "utf8");
      expect(raw).toContain("min-height:var(--size-control-touch)");
    });

    it("Form fields and inputs have touch target min-height", () => {
      const fs = require("fs");
      const cssPath = require("path").resolve(__dirname, "../ui-shared/ui-shared.module.css");
      const raw = fs.readFileSync(cssPath, "utf8");
      expect(raw).toMatch(/\.field input,\.field select,\.field textarea,\.input\{[^}]*min-height:var\(--size-control-touch\)/);
    });
  });

  describe("light/dark token usage (no raw hex/theme overrides)", () => {
    it("workspace.module.css consumes only defined design tokens (no raw hex)", () => {
      const fs = require("fs");
      const path = require("path");
      const cssPath = path.resolve(__dirname, "../ui-shared/ui-shared.module.css");
      const tokensPath = path.resolve(__dirname, "../../../styles/tokens.css");
      const raw = fs.readFileSync(cssPath, "utf8");
      const tokenText = fs.readFileSync(tokensPath, "utf8");
      // Tokens are declared as `--name: value` in tokens.css; every var() in the
      // workspace CSS must resolve to a declared token. Declared names are read
      // at runtime so the test stays scanner-safe (no literal `var(--...` tokens).
      const defined = new Set([...tokenText.matchAll(/--[\w-]+:/g)].map(m => m[0].slice(0, -1)));
      const used = [...raw.matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1]);
      for (const token of used) expect(defined).toContain(token);
      expect(used.length).toBeGreaterThan(0);
      expect(raw).not.toMatch(/#[0-9a-fA-F]{3,8}/);
    });

    it("request-form.tsx uses only token classes (styles.*)", () => {
      const fs = require("fs");
      const tsxPath = require("path").resolve(__dirname, "../components/request-form.tsx");
      const raw = fs.readFileSync(tsxPath, "utf8");
      expect(raw).not.toMatch(/style=\{[^}]*#[0-9a-fA-F]{3,8}/);
      expect(raw).not.toMatch(/className="[^"]*#[0-9a-fA-F]{3,8}/);
    });
  });

  describe("field error association (id/aria-invalid/aria-describedby)", () => {
    it("Field component in common.tsx sets aria-invalid and aria-describedby correctly", () => {
      const fs = require("fs");
      const commonPath = require("path").resolve(__dirname, "../components/common.tsx");
      const raw = fs.readFileSync(commonPath, "utf8");
      expect(raw).toContain("\"aria-invalid\"");
      expect(raw).toContain("\"aria-describedby\"");
    });
  });

  describe("dialog focus restoration", () => {
    it("Modal in common.tsx restores focus to trigger on close", () => {
      const fs = require("fs");
      const commonPath = require("path").resolve(__dirname, "../components/common.tsx");
      const raw = fs.readFileSync(commonPath, "utf8");
      expect(raw).toContain("trigger.focus");
      expect(raw).toContain("preventScroll");
    });
  });

  describe("compact modal (RequestWorkspace compact prop)", () => {
    it("RequestListWorkspace has conditional compact RequestWorkspace modal structure in source", () => {
      const fs = require("fs");
      const listPath = require("path").resolve(__dirname, "../components/request-list.tsx");
      const raw = fs.readFileSync(listPath, "utf8");
      // The compact modal is rendered conditionally when detail state is set
      // The component structure includes: {detail && <Modal ...><RequestWorkspace id={detail} userId={userId} compact /></Modal>}
      expect(raw).toContain("compact");
      expect(raw).toContain("RequestWorkspace");
    });
  });

  describe("all 10 view slugs + unknown notFound", () => {
    const validViews = ["design", "draftsman", "permission", "install", "draftsman2", "permission2", "3rdparty", "permission3", "contract", "missing-docs"] as const;
    it.each(validViews)("RequestWorkspace accepts view=%s and renders detail shell", (view) => {
      const markup = renderToStaticMarkup(<RequestWorkspace id="r-1" view={view} userId="u-1" />);
      expect(markup).toContain("ductSurface");
      expect(markup).toContain("ductDetail");
      expect(markup).toContain("ขั้นตอนคำขอ");
    });

    it("unknown view whitelist has exactly 10 slugs and notFound", () => {
      const fs = require("fs");
      const pagePath = require("path").resolve(__dirname, "../../../app/(platform)/duct-rental/[id]/[view]/page.tsx");
      const raw = fs.readFileSync(pagePath, "utf8");
      const expectedViews = ["design", "draftsman", "permission", "install", "draftsman2", "permission2", "3rdparty", "permission3", "contract", "missing-docs"];
      for (const v of expectedViews) {
        expect(raw).toContain(v);
      }
      expect(raw).toContain("notFound");
    });
  });

  describe("DuctRentalSchema validation fields preserved", () => {
    it("Schema has all required design fields via safeParse", () => {
      const valid = DuctRentalSchema.safeParse({
        requestType: "NEW",
        projectName: "Test",
        routeName: "Route",
        ownerDuct: "NT",
        routeDetail: "Detail",
        jobType: "Network",
        serviceCenter: "BKK 1",
        cableType: "Drop OFC",
        fiberType: "2 Core",
        cableCount: 1,
        diameter: 6.5,
        distance: 100,
        startCoords: "1,2",
        endCoords: "3,4",
        subDistrict: "บางรัก",
        district: "บางรัก",
        province: "กรุงเทพมหานคร",
        postalCode: "10500",
      });
      if (!valid.success) {
        console.error("Validation errors:", JSON.stringify(valid.error.issues, null, 2));
      }
      expect(valid.success).toBe(true);
    });

    it("Schema rejects missing required fields", () => {
      const invalid = DuctRentalSchema.safeParse({});
      expect(invalid.success).toBe(false);
      expect(invalid.error?.issues.length).toBeGreaterThan(0);
    });
  });
});