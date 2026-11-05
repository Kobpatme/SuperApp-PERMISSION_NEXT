// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { WorkspaceSearch } from "./workspace-search";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }), useSearchParams: () => new URLSearchParams() }));
const host = document.createElement("div");
document.body.append(host);
const root = createRoot(host);
const frame = () => new Promise((resolve) => setTimeout(resolve, 30));
afterEach(async () => { await act(async () => root.render(null)); vi.unstubAllGlobals(); push.mockClear(); });

it("filters destinations by permission and navigates with keyboard", async () => {
  await act(async () => root.render(<WorkspaceSearch allowedModuleIds={[]}/>));
  const input = host.querySelector<HTMLInputElement>("input")!;
  await act(async () => input.focus());
  expect(host.querySelectorAll('[role="option"]')).toHaveLength(1);
  expect(host.textContent).not.toContain("ข้อมูลอาคาร");
  await act(async () => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  expect(push).toHaveBeenCalledTimes(1);
});

it("returns mobile focus to the visible trigger on Escape", async () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  await act(async () => root.render(<WorkspaceSearch allowedModuleIds={[]}/>));
  const trigger = host.querySelector<HTMLButtonElement>(".workspace-search-trigger")!;
  await act(async () => { trigger.click(); await frame(); });
  const input = host.querySelector<HTMLInputElement>("input")!;
  expect(document.activeElement).toBe(input);
  await act(async () => { input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); await frame(); });
  expect(document.activeElement).toBe(trigger);
  expect(input.getAttribute("aria-expanded")).toBe("false");
});

it("shows loading and partial search results from the server", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ "content-type": "application/json" }), json: async () => ({ ready: true, partial: true, results: [{ id: "record", title: "รายการทดสอบ", description: "รายการ", href: "/record" }] }) }));
  await act(async () => root.render(<WorkspaceSearch allowedModuleIds={[]}/>));
  const input = host.querySelector<HTMLInputElement>("input")!;
  await act(async () => { input.focus(); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "xyz"); input.dispatchEvent(new Event("input", { bubbles: true })); });
  expect(host.textContent).toContain("กำลังค้นหารายการ");
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 250)); });
  expect(host.textContent).toContain("รายการทดสอบ");
  expect(host.textContent).toContain("แสดงเฉพาะข้อมูลจากระบบที่เชื่อมต่อได้");
});

const setInput = (input: HTMLInputElement, value: string) => {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

it("moves keyboard selection with ArrowDown/Up and navigates the active result with Enter", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ "content-type": "application/json" }), json: async () => ({ ready: true, partial: false, results: [{ id: "r1", title: "หนึ่ง", description: "คำอธิบาย", href: "/r1" }, { id: "r2", title: "สอง", description: "คำอธิบาย", href: "/r2" }] }) }));
  await act(async () => root.render(<WorkspaceSearch allowedModuleIds={[]}/>));
  const input = host.querySelector<HTMLInputElement>("input")!;
  await act(async () => { input.focus(); setInput(input, "xyz"); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 250)); });
  expect(host.querySelectorAll('[role="option"]')).toHaveLength(2);
  await act(async () => input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })));
  expect(host.querySelector('[role="option"][aria-selected="true"]')?.textContent).toContain("สอง");
  await act(async () => input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true })));
  expect(host.querySelector('[role="option"][aria-selected="true"]')?.textContent).toContain("หนึ่ง");
  await act(async () => input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })));
  expect(push).toHaveBeenCalledWith("/r1");
});

it("shows error and retry button when the search request fails", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("search down")));
  await act(async () => root.render(<WorkspaceSearch allowedModuleIds={[]}/>));
  const input = host.querySelector<HTMLInputElement>("input")!;
  await act(async () => { input.focus(); setInput(input, "xyz"); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 250)); });
  expect(host.textContent).toContain("ค้นหารายการไม่สำเร็จ");
  expect(host.querySelector("button.text-btn")).not.toBeNull();
});

it("shows an empty state when no results match", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ "content-type": "application/json" }), json: async () => ({ ready: true, partial: false, results: [] }) }));
  await act(async () => root.render(<WorkspaceSearch allowedModuleIds={[]}/>));
  const input = host.querySelector<HTMLInputElement>("input")!;
  await act(async () => { input.focus(); setInput(input, "zzz"); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 250)); });
  expect(host.querySelectorAll('[role="option"]')).toHaveLength(0);
  expect(host.textContent).toContain("ไม่พบข้อมูล");
});

it("does not surface modules the caller is not allowed to use", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, headers: new Headers({ "content-type": "application/json" }), json: async () => ({ ready: true, partial: false, results: [] }) }));
  await act(async () => root.render(<WorkspaceSearch allowedModuleIds={[]}/>));
  const input = host.querySelector<HTMLInputElement>("input")!;
  await act(async () => { input.focus(); setInput(input, "อาคาร"); });
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 250)); });
  expect(host.textContent).not.toContain("ข้อมูลอาคาร");
  expect(host.querySelectorAll('[role="option"]')).toHaveLength(0);
  expect(host.textContent).toContain("ไม่พบข้อมูล");
});
