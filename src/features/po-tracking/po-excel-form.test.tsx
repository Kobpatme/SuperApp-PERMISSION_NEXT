// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it, vi } from "vitest";
import { PoExcelForm, PoCreateWorkspace } from "./po-excel-form";
import { previewExcelAction, confirmExcelAction } from "@/app/(platform)/po-tracking/excel-actions";
import { excelTestRow, makePoWorkbook } from "../../../tests/fixtures/po-excel";
import { parseExcelRows, planExcelRows } from "@/modules/po-tracking/excel-domain";
import { readWorkbook } from "../../../scripts/po-tracking-xlsx.mjs";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/app/(platform)/po-tracking/actions", () => ({ createManualPoAction: vi.fn() }));
vi.mock("@/app/(platform)/po-tracking/excel-actions", () => ({ previewExcelAction: vi.fn(), confirmExcelAction: vi.fn() }));
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("Excel import UI", () => {
  it("keeps manual entry available and gates the Excel entry point by permission", async () => {
    const host = document.createElement("div"); document.body.append(host);
    const root = createRoot(host);
    try {
      await act(async () => root.render(<PoCreateWorkspace canImport={false} />));
      expect(host.textContent).not.toContain("เพิ่มจาก Excel");
      expect(host.querySelector('[name="poNumber"]')).not.toBeNull();
      await act(async () => root.render(<PoCreateWorkspace canImport />));
      await act(async () => Array.from(host.querySelectorAll("button")).find(b => b.textContent === "เพิ่มจาก Excel")!.click());
      expect(host.querySelector('input[type="file"]')!.closest("[hidden]")).toBeNull();
    } finally { await act(async () => root.unmount()); host.remove(); }
  });
  it("previews selected files, requires explicit update selection and sends only selected row numbers", async () => {
    const row = parseExcelRows(readWorkbook(makePoWorkbook([excelTestRow()])).rows).rows[0];
    const decisions = planExcelRows([row], []);
    decisions.push({ row: { ...row, row: 3 }, kind: "update", targetId: "existing", version: 1, changes: [{ field: "etaText", before: "เดิม", after: "ใหม่" }], message: "อัปเดต" });
    decisions.push({ row: { ...row, row: 4 }, kind: "conflict", changes: [], message: "ราคาไม่ตรง" });
    vi.mocked(previewExcelAction).mockResolvedValue({ ok: true, message: "ตรวจแล้ว", preview: { sheet: "PO", total: 3, errors: [], decisions, digest: "a".repeat(64) } });
    vi.mocked(confirmExcelAction).mockResolvedValue({ ok: true, completed: true, message: "บันทึกแล้ว" });
    const host = document.createElement("div"); document.body.append(host);
    const root = createRoot(host);
    try {
      await act(async () => root.render(<PoExcelForm />));
      const input = host.querySelector<HTMLInputElement>('input[type="file"]')!;
      Object.defineProperty(input, "files", { value: [new File(["fixture"], "po.xlsx")], configurable: true });
      await act(async () => input.dispatchEvent(new Event("change", { bubbles: true })));
      await act(async () => host.querySelector<HTMLFormElement>("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
      expect(previewExcelAction).toHaveBeenCalled();
      const checks = host.querySelectorAll<HTMLInputElement>('input[name="selectedRow"]');
      expect(checks).toHaveLength(3);
      expect(checks[0].checked).toBe(true);
      expect(checks[1].checked).toBe(false);
      expect(checks[2].disabled).toBe(true);
      await act(async () => checks[1].click());
      const confirmed = host.querySelector<HTMLInputElement>('input[name="confirmed"]')!;
      await act(async () => confirmed.click());
      await act(async () => confirmed.form!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
      expect(confirmExcelAction).toHaveBeenCalled();
      const data = vi.mocked(confirmExcelAction).mock.calls[0][1];
      expect(data.getAll("selectedRow")).toEqual(["2", "3"]);
      expect(data.get("digest")).toBe("a".repeat(64));
      expect(host.textContent).toContain("บันทึกแล้ว");
      expect(host.querySelector('input[name="selectedRow"]')).toBeNull();
    } finally { await act(async () => root.unmount()); host.remove(); }
  });
});
