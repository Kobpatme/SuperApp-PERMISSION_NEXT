import type { DepositItem } from "@/lib/deposit-v2-domain";

/** Synthetic cases mirror V2's local fixture; never persisted or mixed with live rows. */
export const depositPreviewItems: DepositItem[] = [
  { id: "example-new", status: "new", place: "อาคารตัวอย่าง A", area: "BKK 1", cid: "FIX-001", customer: "บริษัทตัวอย่าง จำกัด", deposit: 10000, demolish: 5000, fee: 500, dateReq: "2026-09-01", dateDue: "2026-09-15", depReturn: "No", demoReturn: "No", updatedAt: "2026-09-09" },
  { id: "example-fin", status: "fin", place: "อาคารตัวอย่าง B", area: "BKK 4", cid: "FIX-002", pr: "PR-002", deposit: 20000, fee: 500, dateReq: "2026-08-01", dateDue: "2026-08-20", updatedAt: "2026-08-01" },
  { id: "example-att", status: "att", place: "อาคารตัวอย่าง C", area: "CMI", cid: "FIX-003", pr: "PR-003", demolish: 8000, fee: 500, dateReq: "2026-09-01", updatedAt: "2026-09-09" },
  { id: "example-tl-wait", status: "tl", place: "อาคารตัวอย่าง D", area: "BKK 1", cid: "FIX-004", deposit: 12000, demolish: 3000, tl_team: "BKK", pdf_payment: "https://example.invalid/payment.pdf", dateDue: "2026-09-15", updatedAt: "2026-09-09" },
  { id: "example-tl-process", status: "On Process", complete_tl: "On Process", place: "อาคารตัวอย่าง E", area: "BKK 4", cid: "FIX-005", deposit: 9000, demolish: 1000, pdf_payment: "https://example.invalid/payment.pdf", updatedAt: "2026-09-09" },
  { id: "example-ret", status: "ret", place: "อาคารตัวอย่าง F", area: "BKK 1", cid: "FIX-006", deposit: 15000, pdf_payment: "https://example.invalid/payment.pdf", pdf_tl_work: "https://example.invalid/tl.pdf", updatedAt: "2026-09-09" },
  { id: "example-clo", status: "clo", place: "อาคารตัวอย่าง G", area: "CMI", cid: "FIX-007", deposit: 5000, demolish: 4000, inspected_by: "Building Dept", updatedAt: "2026-09-09" },
  { id: "example-on-service", status: "done", place: "อาคารตัวอย่าง H", area: "BKK 4", cid: "FIX-008", deposit: 7000, demolish: 2000, depReturn: "Yes", demoReturn: "No", updatedAt: "2026-09-09" },
  { id: "example-off-service", status: "done", place: "อาคารตัวอย่าง I", area: "BKK 1", cid: "FIX-009", deposit: 3000, demolish: 2500, depReturn: "Yes", demoReturn: "No", service_cancel_date: "2026-09-08", off_service_status: "pending", updatedAt: "2026-09-09" },
  { id: "example-done", status: "done", status_final: "done", place: "อาคารตัวอย่าง J", area: "BKK 4", cid: "FIX-010", deposit: 7000, demolish: 2000, depReturn: "Yes", demoReturn: "Yes", date_return: "2026-09-08", updatedAt: "2026-09-09" },
  { id: "example-cancel", status: "Cancel", place: "อาคารตัวอย่าง ยกเลิก", area: "BKK 4", cid: "FIX-011", deposit: 6000, dateReq: "2026-09-01", updatedAt: "2026-09-09" },
];
