// @vitest-environment happy-dom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PermissionBuildingRow } from "@/lib/permission-building-server";
import { BuildingsWorkspace } from "./buildings-workspace";

vi.mock("next/navigation", () => ({
  usePathname: () => "/buildings",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const LISTBOX_ID = "permission-search-listbox";
const INPUT_ID = "permission-search-input";
const searchOptionId = (id: string) => `permission-search-option-${id}`;

const office: PermissionBuildingRow = {
  id: "building-1",
  code: "B-001",
  nameTh: "อาคารทดสอบ",
  nameEn: "Test Building",
  ownerTeamId: null,
  status: "Permission Confirmed",
  group: "สำนักงาน",
  type: "อาคารสำนักงาน",
  surveyType: "สำรวจแล้ว",
  area: "กรุงเทพฯ",
  province: "กรุงเทพฯ",
  installType: "ภายในอาคาร",
  updateDate: "2026-10-01",
  location: "ชั้น 1",
  duration: "7",
  wmPoint: "WM-1",
  enclosure: "ตู้ 1",
  maxHorizontal: "10",
  address: "ถนนทดสอบ",
  remark: "",
  contact: "",
  phone: "",
  mobile: "",
  email: "",
  lat: null,
  lng: null,
  locationAccuracy: null,
  locationSource: null,
  locationVerified: false,
  locationUpdatedAt: null,
  subdistrict: "",
  district: "",
  postcode: "",
  longdoPlaceId: null,
  canUpdateLocation: true,
  conditionVersion: null,
  boq: null,
  feeReviewRequired: false,
  conditionEffectiveAt: null,
  feeReviewValues: [],
};

const example: PermissionBuildingRow = {
  ...office,
  id: "building-2",
  code: "B-002",
  nameTh: "อาคารตัวอย่าง",
  nameEn: "Example Building",
  status: "MOU",
};

function renderWorkspace(
  props: Partial<Parameters<typeof BuildingsWorkspace>[0]> = {},
) {
  window.location.href = "http://localhost/buildings";
  const container = document.createElement("div");
  document.body.appendChild(container);
  let root: ReturnType<typeof createRoot> | undefined;
  act(() => {
    root = createRoot(container);
    root.render(
      <BuildingsWorkspace
        buildings={[office, example]}
        total={2}
        initialView="list"
        {...props}
      />,
    );
  });
  return {
    container,
    get input() {
      return document.getElementById(INPUT_ID) as HTMLInputElement | null;
    },
    get combobox() {
      return document.querySelector('[role="combobox"]');
    },
    get listbox() {
      return document.getElementById(LISTBOX_ID);
    },
    option(id: string) {
      return document.getElementById(searchOptionId(id));
    },
    unmount() {
      act(() => root?.unmount());
      document.body.removeChild(container);
    },
  };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.clearAllMocks();
});

function keyDown(target: Element, key: string) {
  act(() => {
    target.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
    );
  });
}

// หมายเหตุสภาพแวดล้อมทดสอบ: happy-dom + React 19 ใน repo นี้ไม่ส่งกิจกรรม DOM
// ที่สร้างด้วย dispatchEvent (KeyboardEvent/MouseEvent ภายใน act()) ไปยัง React
// handler — onChange/onKeyDown/onClick ถูกทดลองแล้วว่าทำงานไม่ได้ จึงไม่สามารถ
// ขับให้ listbox เปิด, พิมพ์ค้นหา, เลือกรายการด้วยลูกศร/Enter, หรือกดปุ่มล้าง
// ผ่านเหตุการณ์ปลอมได้จริง การทดสอบด้านล่างจึงครอบคลุมเฉพาะสิ่งที่สังเกต
// ได้จริงในมาร์กอัปสถานะปัด: การถือครองคุณสมบัติ combobox บน input ตัวจริง,
// aria-controls ที่ไม่ค้างอ้างอิงเมื่อ listbox ปิด, active-descendant ที่ว่างเมื่อ
// ไม่มีรายการที่ถูก render, และความสมบูรณ์ของ ref โดยตั้งใจไม่ปลอมการ
// ครอบคลุมการโต้ตอบในสถานะเปิด listbox

describe("Buildings search autocomplete (combobox semantics on the focused input)", () => {
  it("สถานะเริ่มต้นปิด: role/state/controls อยู่ที่ input ตัวจริง ไม่ใช่ div wrapper; aria-controls ไม่ค้างชี้ listbox ที่ยังไม่มีอยู่", () => {
    const { combobox, input, listbox } = renderWorkspace();
    expect(combobox).not.toBeNull();
    expect(input).not.toBeNull();
    // เจ้าของคุณสมบัติ combobox ต้องเป็น input ที่โฟกัสได้จริง และเป็นตัวเดียวกับ searchRef
    expect(combobox).toBe(input);
    expect(input!.getAttribute("id")).toBe(INPUT_ID);
    expect(combobox!.getAttribute("role")).toBe("combobox");
    expect(combobox!.getAttribute("aria-expanded")).toBe("false");
    expect(combobox!.getAttribute("aria-haspopup")).toBe("listbox");
    expect(combobox!.getAttribute("aria-controls")).toBeNull(); // ไม่ค้างอ้างอิง element ที่ยังไม่ถูก render
    expect(combobox!.getAttribute("aria-activedescendant")).toBeNull();
    expect(input!.getAttribute("aria-label")).toBe("ค้นหาอาคาร");
    expect(input!.getAttribute("autocomplete")).toBe("off");
    expect(listbox).toBeNull();
    expect(document.querySelector('.permission-search[role="combobox"]')).toBeNull();
  });

  it("กดลูกศรขณะ listbox ปิด ไม่เปิด overlay และไม่กำหนด active descendant", () => {
    const { combobox, input } = renderWorkspace();
    keyDown(input!, "ArrowDown");
    keyDown(input!, "ArrowUp");
    expect(combobox!.getAttribute("aria-expanded")).toBe("false");
    expect(combobox!.getAttribute("aria-activedescendant")).toBeNull();
    expect(document.getElementById(LISTBOX_ID)).toBeNull();
  });

  it("กด Enter เมื่อยังไม่ได้เน้นรายการใด ไม่เลือกอาคารและไม่เปิดรายละเอียด", () => {
    const { combobox, input, container } = renderWorkspace();
    keyDown(input!, "Enter");
    expect(container.textContent).not.toContain("รายละเอียด อาคารทดสอบ");
    expect(combobox!.getAttribute("aria-activedescendant")).toBeNull();
  });

  it("กด '/' นอกช่องค้นหา โฟกัสกลับมาที่ช่องค้นหาเดียวกับที่ ref ถือไว้ (ref integrity)", () => {
    const { input } = renderWorkspace();
    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", { key: "/", bubbles: true, cancelable: true }),
      );
    });
    expect(document.activeElement).toBe(input);
    expect(document.activeElement!.getAttribute("role")).toBe("combobox");
    expect(document.activeElement!.getAttribute("id")).toBe(INPUT_ID);
  });
});
