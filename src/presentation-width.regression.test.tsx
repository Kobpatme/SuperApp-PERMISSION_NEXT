import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({ default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/components/ui/page-header", () => ({ PageHeader: ({ title, children, actions }: { title: string; children?: React.ReactNode; actions?: React.ReactNode }) => <header><h1>{title}</h1>{children}{actions}</header> }));
vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button> }));
vi.mock("@/components/ui/dialog", () => ({ ConfirmDialog: () => null }));
vi.mock("@/components/deposit-evidence-upload", () => ({ DepositEvidenceUpload: () => null }));
vi.mock("@/components/deposit-transition-form", () => ({ DepositTransitionForm: () => null }));
vi.mock("@/components/ui/truncated-text", () => ({ TruncatedText: ({ text }: { text: string }) => <p>{text}</p> }));
vi.mock("@/app/(platform)/guarantees/actions", () => ({ saveDepositWorkItem: vi.fn(async () => ({ ok: true, message: "" })) }));
vi.mock("@/features/buildings/map/building-create-form", () => ({ BuildingCreateForm: () => <form data-testid="building-create-form"><input name="code" /></form> }));
vi.mock("@/lib/access", () => ({ getAccessContext: vi.fn(async () => ({ allowed: true, passwordChangeRequired: false, subject: { grants: [{ permission: "building.record.create", scope: "ALL" }], teamIds: [] } })) }));
vi.mock("@/lib/authorization", () => ({ isAuthorized: vi.fn(() => true) }));
vi.mock("@/db/schema", () => ({ teams: { id: "id", name: "name", isActive: "isActive" } }));
vi.mock("@/db", () => ({ getDb: () => ({ select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ id: "team-1", name: "Team" }] }) }) }) }) }));

import NewBuildingPage from "@/app/(platform)/buildings/new/page";
import { DepositEditor } from "@/components/deposit-editor";

process.env.DATABASE_URL = "test://presentation-only";

const deposit = {
  id: "deposit-1", version: 1, place: "อาคารทดสอบ", status: "new", area: "BKK 1", deposit: "100", demolish: "50",
} as never;

const buildingsCss = readFileSync(new URL("./app/(platform)/buildings/buildings-presentation.css", import.meta.url), "utf8");
const depositCss = readFileSync(new URL("./app/(platform)/guarantees/deposit.css", import.meta.url), "utf8");

function renderDeposit(item?: typeof deposit) {
  return renderToStaticMarkup(<DepositEditor item={item} />);
}

describe("full-width create form presentation contracts", () => {
  it("renders the real Add Building page with a create-only screen marker", async () => {
    const html = renderToStaticMarkup(await NewBuildingPage());
    expect(html).toContain('data-ui-screen="building-create"');
    expect(html).toContain('data-testid="building-create-form"');
    expect(buildingsCss).toContain('.building-form-page.building-create-page[data-ui-screen="building-create"] { max-width:none; margin-inline:0; }');
    expect(buildingsCss).toContain(".building-form-page { min-width:0; max-width:1280px");
  });

  it("renders Create Deposit as one grid track while Edit Deposit keeps the side track", () => {
    const createHtml = renderDeposit();
    const editHtml = renderDeposit(deposit);
    expect(createHtml).toContain('class="deposit-detail-grid deposit-detail-grid-create"');
    expect(createHtml).not.toContain("deposit-detail-grid-edit");
    expect(editHtml).toContain('class="deposit-detail-grid deposit-detail-grid-edit"');
    expect(editHtml).toContain('class="deposit-side"');
    expect(depositCss).toContain(".deposit-detail-grid.deposit-detail-grid-create { grid-template-columns: minmax(0, 1fr); }");
    expect(depositCss).toContain("grid-template-columns: minmax(0, 1.6fr) minmax(var(--size-form-panel-min), .7fr)");
  });

  it("keeps the create layouts bounded at narrow viewports", () => {
    expect(buildingsCss).toMatch(/@media\(max-width:720px\)[\s\S]*\.building-detail-page,\.building-form-page \{ padding:var\(--space-3\); \}/);
    expect(depositCss).toContain(".deposit-kpis, .deposit-analytics, .deposit-detail-grid { grid-template-columns: 1fr;");
  });
});
