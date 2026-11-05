import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { WorkReadModel } from "@/lib/work-read-model";
import { WorkCreateForm } from "./work-create-form";
import { TaskKpiFields } from "@/features/work/components/task-kpi-fields";

vi.mock("@/app/(platform)/work/actions", () => ({ createPersonalTaskAction: vi.fn(), previewWorkDeadlineAction: vi.fn() }));
vi.mock("@/lib/work-mutation-signal", () => ({ useWorkMutationSignal: () => undefined }));

const model = { creationKey: "key", assignmentOptions: [], kpiOptions: [] } as unknown as WorkReadModel;
const field = (html: string, id: string) => {
  const match = html.match(new RegExp(`<[^>]+ id="${id}"[^>]*>`));
  expect(match, `missing ${id}`).not.toBeNull();
  return match?.[0] ?? "";
};

describe("work creation field opt-in", () => {
  it.each([false, true])("renders page or dialog controls, inDialog=%s", inDialog => {
    const html = renderToStaticMarkup(<WorkCreateForm model={model} userId="user" inDialog={inDialog} />);
    expect(html.includes("work-create-page-form")).toBe(!inDialog);
    for (const id of ["work-team", "work-main-kpi", "work-sub-kpi", "work-type", "work-contractor-name", "work-jobs", "work-notes"]) {
      expect(field(html, id).includes('class="ui-building-field"'), id).toBe(true);
    }
    expect(html).not.toMatch(/<input[^>]*type="hidden"[^>]*class="ui-building-field"/);
  });
  it.each(["ประสานงานอาคาร", "open job sap", "open job owf"])("propagates opt-in to conditional KPI fields for %s", sub => {
    const html = renderToStaticMarkup(<TaskKpiFields rules={[{ id: "r", mainKpi: "m", subKpi: sub }]} values={{ main: "m", sub }} controlClassName="ui-building-field" />);
    const ids = sub === "ประสานงานอาคาร" ? ["work-building", "work-client", "work-building-contractor"] : [sub.includes("sap") ? "work-ssr-number" : "work-osp-number"];
    for (const id of ids) expect(field(html, id)).toContain('class="ui-building-field"');
  });
});
