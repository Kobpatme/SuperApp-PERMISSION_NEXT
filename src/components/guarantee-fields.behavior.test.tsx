// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DepositWorkspace } from "./deposit-workspace";
import { DepositTransitionForm } from "./deposit-transition-form";

vi.mock("next/link", () => ({ default: ({ children, ...props }: React.PropsWithChildren<React.AnchorHTMLAttributes<HTMLAnchorElement>>) => <a {...props}>{children}</a> }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/app/(platform)/guarantees/actions", () => ({ transitionDepositWorkItem: vi.fn() }));

const host = document.createElement("div");
document.body.append(host);
const root = createRoot(host);
afterEach(async () => { await act(async () => root.render(null)); });
const click = async (button: Element | null) => { expect(button).not.toBeNull(); await act(async () => { (button as HTMLElement).click(); }); };
const button = (text: string) => [...host.querySelectorAll("button")].find(element => element.textContent?.includes(text)) ?? null;

describe("guarantee controls", () => {
  it("opens list filters and report, then returns to the list", async () => {
    await act(async () => root.render(<DepositWorkspace items={[{ id: "item-1", status: "new", place: "Alpha", area: "CMI", owner: "Owner", dateReq: "2026-01-01" }, { id: "item-2", status: "new", place: "Beta", area: "CBI", owner: "Owner", dateReq: "2026-01-01" }]} preview={true} state="ready" truncated={false} generatedAt="2026-01-02T00:00:00Z" canCreate canPreview={false} />));
    await click(button("รายการเงินประกัน"));
    expect(host.querySelector('input[type="search"]')?.classList.contains("ui-building-field")).toBe(true);
    expect(host.querySelector('select[aria-label="กรองพื้นที่"]')?.classList.contains("ui-building-field")).toBe(true);
    expect(host.textContent).toContain("Alpha");
    expect(host.textContent).toContain("Beta");
    const area = host.querySelector<HTMLSelectElement>('select[aria-label="กรองพื้นที่"]')!;
    await act(async () => { area.value = "CMI"; area.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(host.textContent).toContain("Alpha");
    expect(host.textContent).not.toContain("Beta");
    await act(async () => { area.value = "CBI"; area.dispatchEvent(new Event("change", { bubbles: true })); });
    expect(host.textContent).not.toContain("Alpha");
    expect(host.textContent).toContain("Beta");
    expect(host.textContent).toContain("ล้างตัวกรอง");
    await click(button("ล้างตัวกรอง"));
    expect(host.textContent).toContain("Alpha");
    expect(host.textContent).toContain("Beta");
    await click(button("วิเคราะห์ข้อมูล"));
    expect(host.querySelector(".gr-filterbar select.ui-building-field")).not.toBeNull();
    await click(button("กลับรายการเงินประกัน"));
    expect(host.querySelector('select[aria-label="กรองพื้นที่"]')).not.toBeNull();
  });

  it("opens and cancels transition confirmation without calling the server action", async () => {
    const { transitionDepositWorkItem } = await import("@/app/(platform)/guarantees/actions");
    await act(async () => root.render(<DepositTransitionForm id="item-1" version={2} targets={[["Cancel", "ยกเลิกรายการ"]]} />));
    vi.mocked(transitionDepositWorkItem).mockReset().mockResolvedValue({ ok: true, message: "saved" });
    const reason = host.querySelector<HTMLTextAreaElement>('textarea[name="reason"]')!;
    expect(reason.classList.contains("ui-building-field")).toBe(true);
    await act(async () => { Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(reason, "test reason"); reason.dispatchEvent(new Event("input", { bubbles: true })); });
    await click(button("ยกเลิกรายการ"));
    expect(document.body.textContent).toContain("ยืนยันขั้นตอนเงินประกัน");
    const dialog = document.querySelector("dialog[open]");
    const cancel = [...(dialog?.querySelectorAll("button") ?? [])].find(element => element.textContent?.includes("ยกเลิก"));
    await click(cancel ?? null);
    expect(document.querySelector("dialog[open]")).toBeNull();
    expect(transitionDepositWorkItem).not.toHaveBeenCalled();
    expect(reason.value).toBe("test reason");
    await click(button("ยกเลิกรายการ"));
    const reopened = document.querySelector("dialog[open]");
    expect(reopened?.textContent).toContain("test reason");
    await click([...(reopened?.querySelectorAll("button") ?? [])].find(element => element.textContent?.includes("ยืนยันขั้นตอน")) ?? null);
    expect(transitionDepositWorkItem).toHaveBeenCalledTimes(1);
    const data = vi.mocked(transitionDepositWorkItem).mock.calls[0][1];
    expect([data.get("id"), data.get("version"), data.get("reason"), data.get("to")]).toEqual(["item-1", "2", "test reason", "Cancel"]);
  });
});
