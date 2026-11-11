// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { ManualPoForm } from "./po-forms";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/app/(platform)/po-tracking/actions", () => ({
  createManualPoAction: vi.fn(), updateManualLineAction: vi.fn(), correctReceiptAction: vi.fn(),
  recordReceiptAction: vi.fn(), updateLineAction: vi.fn(),
}));
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("manual PO repeated lines", () => {
  it("focuses new lines and preserves surviving input values while renumbering submitted fields", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = createRoot(host);
    try {
      await act(async () => root.render(<ManualPoForm />));
      const add = () => Array.from(host.querySelectorAll("button")).find(b => b.textContent === "เพิ่มอีกรายการ")!;
      await act(async () => add().click());
      const material = host.querySelector<HTMLInputElement>('[name="line-1-materialCode"]')!;
      expect(document.activeElement).toBe(material);
      material.value = "KEEP-LEADING-001";
      await act(async () => host.querySelector<HTMLButtonElement>('[aria-label="ลบรายการที่ 1"]')!.click());
      expect(host.querySelector<HTMLInputElement>('[name="lineCount"]')!.value).toBe("1");
      expect(host.querySelector<HTMLInputElement>('[name="line-0-materialCode"]')!.value).toBe("KEEP-LEADING-001");
      expect(host.querySelector('[name="line-1-materialCode"]')).toBeNull();
      expect(host.querySelector('[aria-label="ลบรายการที่ 1"]')).toBeNull();
      await act(async () => add().click());
      expect(host.querySelector<HTMLInputElement>('[name="line-0-materialCode"]')!.value).toBe("KEEP-LEADING-001");
      expect(host.querySelector<HTMLInputElement>('[name="line-1-materialCode"]')!.value).toBe("");
    } finally {
      await act(async () => root.unmount());
      host.remove();
    }
  });
});
