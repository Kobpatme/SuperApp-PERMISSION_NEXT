// @vitest-environment happy-dom
import { act, createRef } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it } from "vitest";
import { FormField } from "./form";
import { TaskKpiFields } from "@/features/work/components/task-kpi-fields";

const host = document.createElement("div");
document.body.append(host);
const root = createRoot(host);
afterEach(async () => { await act(async () => root.render(null)); });

it("associates mapped Work errors with the affected native controls", async () => {
  await act(async () => root.render(<TaskKpiFields rules={[]} controlClassName="ui-building-field" fieldErrors={{ mainKpi: ["เลือก KPI"], contractorName: ["ระบุผู้รับเหมา"] }} />));
  for (const [id, message] of [["work-main-kpi", "เลือก KPI"], ["work-contractor-name", "ระบุผู้รับเหมา"]]) {
    const control = host.querySelector(`#${id}`)!;
    expect(control.getAttribute("aria-invalid")).toBe("true");
    expect(control.getAttribute("aria-describedby")?.split(" ")).toContain(`${id}-error`);
    expect(host.querySelector(`#${id}-error`)?.textContent).toBe(message);
  }
});

it("clears implicit invalid state while preserving explicit state, descriptions and ref", async () => {
  const ref = createRef<HTMLInputElement>();
  const render = (error?: string, explicit?: boolean) => <FormField label="ชื่อ" controlId="name" hint="hint" error={error}><input ref={ref} id="name" aria-describedby="external" aria-invalid={explicit} data-test="kept" /></FormField>;
  await act(async () => root.render(render("ผิด")));
  expect(ref.current?.getAttribute("aria-invalid")).toBe("true");
  expect(ref.current?.getAttribute("aria-describedby")).toBe("name-hint name-error external");
  expect(ref.current?.getAttribute("data-test")).toBe("kept");
  await act(async () => root.render(render()));
  expect(ref.current?.hasAttribute("aria-invalid")).toBe(false);
  expect(ref.current?.getAttribute("aria-describedby")).toBe("name-hint external");
  await act(async () => root.render(render("ผิด", false)));
  expect(ref.current?.getAttribute("aria-invalid")).toBe("false");
});


it("only injects invalid into direct native form controls", async () => {
  function Custom(props: { "aria-invalid"?: boolean | "true" | "false" }) { return <div data-custom-invalid={String(props["aria-invalid"])} />; }
  await act(async () => root.render(<><FormField label="div" error="error"><div data-kind="div" /></FormField><FormField label="button" error="error"><button data-kind="button" /></FormField><FormField label="custom" error="error"><Custom /></FormField>{[<input key="input" />, <select key="select" />, <textarea key="textarea" />].map((child, index) => <FormField key={index} label="control" error="error">{child}</FormField>)}</>));
  expect(host.querySelector('[data-kind="div"]')?.hasAttribute("aria-invalid")).toBe(false);
  expect(host.querySelector('[data-kind="button"]')?.hasAttribute("aria-invalid")).toBe(false);
  expect(host.querySelector('[data-custom-invalid]')?.getAttribute("data-custom-invalid")).toBe("undefined");
  for (const tag of ["input", "select", "textarea"]) expect(host.querySelector(tag)?.getAttribute("aria-invalid")).toBe("true");
});


it.each(["input", "select", "textarea"] as const)("preserves explicit false and clears implicit invalid for %s", async (tag) => {
  const render = (error?: string, explicit?: boolean) => <FormField label="control" error={error}>{tag === "input" ? <input aria-invalid={explicit} /> : tag === "select" ? <select aria-invalid={explicit} /> : <textarea aria-invalid={explicit} />}</FormField>;
  await act(async () => root.render(render("error")));
  expect(host.querySelector(tag)?.getAttribute("aria-invalid")).toBe("true");
  await act(async () => root.render(render()));
  expect(host.querySelector(tag)?.hasAttribute("aria-invalid")).toBe(false);
  await act(async () => root.render(render("error", false)));
  expect(host.querySelector(tag)?.getAttribute("aria-invalid")).toBe("false");
});
