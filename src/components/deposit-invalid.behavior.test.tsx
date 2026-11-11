// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import { DepositEditor } from "./deposit-editor";
import { saveDepositWorkItem } from "@/app/(platform)/guarantees/actions";

vi.mock("next/link", () => ({ default: ({ children, ...props }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => <a {...props}>{children}</a> }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/app/(platform)/guarantees/actions", () => ({ saveDepositWorkItem: vi.fn(), transitionDepositWorkItem: vi.fn() }));

const host = document.createElement("div");
document.body.append(host);
const root = createRoot(host);
afterEach(async () => { await act(async () => root.render(null)); vi.resetAllMocks(); });

it("associates returned Guarantee field errors and clears them on the next response", async () => {
  vi.mocked(saveDepositWorkItem).mockResolvedValueOnce({ ok: false, message: "ตรวจสอบข้อมูล", fieldErrors: { place: ["ระบุอาคาร"], area: ["ระบุพื้นที่"] } }).mockResolvedValueOnce({ ok: false, message: "ตรวจสอบข้อมูล" });
  await act(async () => root.render(<DepositEditor />));
  const form = host.querySelector("form")!;
  await act(async () => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  for (const [id, message] of [["deposit-place", "ระบุอาคาร"], ["deposit-area", "ระบุพื้นที่"]]) {
    const control = host.querySelector(`#${id}`)!;
    expect(control.getAttribute("aria-invalid")).toBe("true");
    expect(control.getAttribute("aria-describedby")?.split(" ")).toContain(`${id}-error`);
    expect(host.querySelector(`#${id}-error`)?.textContent).toBe(message);
  }
  await act(async () => { form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  expect(host.querySelector("#deposit-place")?.hasAttribute("aria-invalid")).toBe(false);
  expect(host.querySelector("#deposit-place-error")).toBeNull();
});
