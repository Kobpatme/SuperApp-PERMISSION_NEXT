import { afterEach, expect, it, vi } from "vitest";
import { Children, isValidElement, type ReactNode } from "react";
import { DepositWorkspace } from "./deposit-workspace";
import type { DepositItem } from "@/lib/deposit-v2-domain";

// Node-only hook harness: retain real JSX, domain functions and event handlers.
// Only browser/router boundaries and hook storage are substituted (no DOM package).
const harness = vi.hoisted(() => ({ states: [] as unknown[], cursor: 0 }));
vi.mock("react", async (original) => ({
  ...await original<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = harness.cursor++;
    if (!(index in harness.states)) harness.states[index] = initial;
    return [harness.states[index], (value: unknown) => {
      harness.states[index] = typeof value === "function" ? value(harness.states[index]) : value;
    }];
  },
  useMemo: (compute: () => unknown) => compute(),
  useEffect: () => {},
  useRef: () => ({ current: null }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

type Element = { type: unknown; props: Record<string, unknown> };
function elements(node: ReactNode): Element[] {
  return Children.toArray(node).flatMap((child) => isValidElement<{ children?: ReactNode }>(child)
    ? [child as Element, ...elements(child.props.children)] : []);
}
function workspace(items: DepositItem[] = []) {
  harness.cursor = 0;
  return elements(DepositWorkspace({ items, preview: false, state: "ready", truncated: false,
    generatedAt: "2026-01-01T12:00:00", canCreate: false, canPreview: false }));
}
function select(nodes: Element[], label: string, value: string) {
  const control = nodes.find((node) => node.type === "select" && node.props["aria-label"] === label)!;
  (control.props.onChange as (event: unknown) => void)({ target: { value } });
}
function showList(items: DepositItem[] = []) {
  const nodes = workspace(items);
  const button = nodes.find((node) => node.type === "button" && Children.toArray(node.props.children as ReactNode)[0] === "รายการเงินประกัน")!;
  (button.props.onClick as () => void)();
  return workspace(items);
}

afterEach(() => { harness.states = []; harness.cursor = 0; vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("offers every Thai month with an explicit zero-based calendar value", () => {
  const nodes = workspace();
  const control = nodes.find((node) => node.type === "select" && node.props["aria-label"] === "เดือนสำหรับส่งออก")!;
  const options = elements(control.props.children as ReactNode).filter((node) => node.type === "option");
  expect(options.map((node) => [String(node.props.value), node.props.children])).toEqual([
    ["", "ทุกเดือน"], ["0", "ม.ค."], ["1", "ก.พ."], ["2", "มี.ค."], ["3", "เม.ย."],
    ["4", "พ.ค."], ["5", "มิ.ย."], ["6", "ก.ค."], ["7", "ส.ค."], ["8", "ก.ย."],
    ["9", "ต.ค."], ["10", "พ.ย."], ["11", "ธ.ค."],
  ]);
});

it("exports the selected month rows and the same calendar month in the filename", async () => {
  const items = Array.from({ length: 12 }, (_, month) => ({ id: `month-${month}`, cid: `CID-${month}`,
    no: String(month), dateReq: new Date(2026, month, 15, 12).toISOString(), status: "new" } as DepositItem));
  items.push({ id: "undated", cid: "CID-undated", status: "new" } as DepositItem);
  items.push({ id: "other-year", cid: "CID-other-year", dateReq: new Date(2025, 0, 15, 12).toISOString(), status: "new" } as DepositItem);
  let captured: Blob | undefined;
  const anchor = { href: "", download: "", click: vi.fn() };
  vi.stubGlobal("document", { createElement: () => anchor });
  vi.stubGlobal("window", { setTimeout: vi.fn() });
  vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => { captured = blob as Blob; return "blob:test"; });
  let nodes = workspace(items);
  const monthControl = nodes.find((node) => node.type === "select" && node.props["aria-label"] === "เดือนสำหรับส่งออก")!;
  const options = elements(monthControl.props.children as ReactNode).filter((node) => node.type === "option");
  for (const [month, label] of ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."].entries()) {
    const option = options.find((node) => node.props.children === label);
    expect(option, `missing ${label}`).toBeDefined();
    select(nodes, "เดือนสำหรับส่งออก", String(option!.props.value));
    select(nodes, "ปีสำหรับส่งออก", "2026");
    nodes = workspace(items);
    const button = nodes.find((node) => node.type === "button" && node.props.className === "deposit-export")!;
    (button.props.onClick as () => void)();
    expect(anchor.download).toBe(`deposit-report-2026-${month + 1}.csv`);
    const csv = await captured!.text();
    expect(csv.split("\r\n").slice(1).map((row) => row.split(",")[0])).toEqual([`"CID-${month}"`]);
  }
  select(nodes, "เดือนสำหรับส่งออก", "");
  select(nodes, "ปีสำหรับส่งออก", "");
  nodes = workspace(items);
  (nodes.find((node) => node.type === "button" && node.props.className === "deposit-export")!.props.onClick as () => void)();
  expect(anchor.download).toBe("deposit-report-all-all.csv");
  expect((await captured!.text()).split("\r\n")).toHaveLength(15);
});

it("keeps export on all filtered pages with CSV escaping and independent year/month filters", async () => {
  const items = Array.from({ length: 25 }, (_, index) => ({ id: `match-${index}`, cid: `CID-${index}`,
    no: String(index), place: '=HYPERLINK("x"),\nอาคาร', owner: "ผู้รับผิดชอบ", area: "พื้นที่ A",
    dateReq: new Date(2026, index % 12, 15, 12).toISOString(), status: "new" } as DepositItem));
  items.push({ ...items[0], id: "excluded", cid: "excluded", owner: "คนอื่น" });
  let captured: Blob | undefined;
  const anchor = { href: "", download: "", click: vi.fn() };
  vi.stubGlobal("document", { createElement: () => anchor });
  vi.stubGlobal("window", { setTimeout: vi.fn() });
  vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => { captured = blob as Blob; return "blob:test"; });
  let nodes = showList(items);
  select(nodes, "กรองเจ้าของงาน", "ผู้รับผิดชอบ");
  select(nodes, "กรองพื้นที่", "พื้นที่ A");
  select(nodes, "กรองสถานะ", "new");
  select(nodes, "ปีสำหรับส่งออก", "2026");
  nodes = workspace(items);
  expect(nodes.filter((node) => node.type === "tr" && node.props.tabIndex === 0)).toHaveLength(20);
  (nodes.find((node) => node.type === "button" && node.props.className === "deposit-export")!.props.onClick as () => void)();
  const csv = await captured!.text();
  expect(anchor.download).toBe("deposit-report-2026-all.csv");
  expect(csv.split("\r\n")).toHaveLength(26);
  expect(csv).toContain('"\'=HYPERLINK(""x""),\nอาคาร"');
  expect(csv).toContain('"CID-24"');
  expect(csv).not.toContain('"excluded"');
  select(nodes, "ปีสำหรับส่งออก", "");
  select(nodes, "เดือนสำหรับส่งออก", "0");
  nodes = workspace(items);
  (nodes.find((node) => node.type === "button" && node.props.className === "deposit-export")!.props.onClick as () => void)();
  expect(anchor.download).toBe("deposit-report-all-1.csv");
  expect((await captured!.text()).split("\r\n")).toHaveLength(4);
});

it("names a keyboard-focusable overflow region and associates every column with its captioned table", () => {
  const nodes = showList();
  const region = nodes.find((node) => node.props.className === "deposit-table-wrap")!;
  expect(region.props).toMatchObject({ role: "region", "aria-label": "รายการเงินประกัน เลื่อนแนวนอนได้", tabIndex: 0 });
  const tableNodes = elements(region.props.children as ReactNode);
  const caption = tableNodes.find((node) => node.type === "caption")!;
  expect(caption.props).toMatchObject({ className: "sr-only", children: "รายการเงินประกันตามตัวกรองในขอบเขตสิทธิ์ของคุณ" });
  const headers = tableNodes.filter((node) => node.type === "th");
  expect(headers).toHaveLength(12);
  expect(headers.every((node) => node.props.scope === "col")).toBe(true);
});

it("announces the real number-column sort direction through both toggles", () => {
  const items = [10, 2].map((no) => ({ id: `item-${no}`, no: String(no), status: "new" } as DepositItem));
  let nodes = showList(items);
  for (const [direction, order] of [["none", ["10", "2"]], ["ascending", ["2", "10"]], ["descending", ["10", "2"]]] as const) {
    const header = nodes.find((node) => node.type === "th" && elements(node.props.children as ReactNode).some((child) => child.type === "button"))!;
    expect(header.props["aria-sort"]).toBe(direction);
    const rows = nodes.filter((node) => node.type === "tr" && node.props.tabIndex === 0);
    expect(rows.map((row) => elements(row.props.children as ReactNode).filter((node) => node.type === "td")[1].props.children)).toEqual(order);
    const button = elements(header.props.children as ReactNode).find((node) => node.type === "button")!;
    (button.props.onClick as () => void)();
    nodes = workspace(items);
  }
});
