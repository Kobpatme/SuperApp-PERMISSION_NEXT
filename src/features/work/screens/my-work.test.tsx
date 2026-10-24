import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { WorkReadModel } from "@/lib/work-read-model";
import { MyWorkDashboard } from "./my-work";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/components/work-create-form", () => ({
  WorkCreateForm: () => null,
}));
vi.mock("@/features/work/components/task-table", () => ({
  WorkTaskDetail: () => null,
  WorkTaskTable: () => null,
}));

const readyModel = {
  source: { status: "ready", message: "" },
  tasks: [],
  activities: [],
} as unknown as WorkReadModel;

describe("MyWorkDashboard header action", () => {
  it("shows the create-work button in the page header when creation is allowed", () => {
    const html = renderToStaticMarkup(
      <MyWorkDashboard model={readyModel} userId="user-1" canCreate />,
    );

    expect(html).toContain('class="page-heading-actions"');
    expect(html).toContain(">เพิ่มงาน</button>");
  });

  it("does not show the create-work button without permission", () => {
    const html = renderToStaticMarkup(
      <MyWorkDashboard model={readyModel} userId="user-1" canCreate={false} />,
    );

    expect(html).not.toContain(">เพิ่มงาน</button>");
  });
});
