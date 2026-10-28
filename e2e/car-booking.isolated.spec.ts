import { expect, test, type Page, type Route } from "@playwright/test";

const fixtureEmail = "admin@car.example.test";
const fixturePassword = "FixturePassword123!";

const car = {
  car_id: "car-1",
  license_plate: "ทดสอบ-1001",
  parking_floor: "2A",
  latest_mileage: "100",
  is_active: true,
  last_user: "ผู้ใช้ทดสอบ",
  using_now: false,
};

function reservation(id: string, destination: string, startTime: string, endTime: string) {
  return {
    id,
    userId: "00000000-0000-4000-8000-000000001003",
    employeeName: "ผู้ใช้ทดสอบ",
    carId: car.car_id,
    destination,
    startTime,
    endTime,
    status: "booked",
    startMileage: "100",
    actualReturnTime: null,
  };
}

async function login(page: Page) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(fixtureEmail);
  await page.locator('input[name="password"]').fill(fixturePassword);
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

async function installMockGuard(page: Page) {
  const now = Date.now();
  const past = new Date(now - 60 * 60 * 1000).toISOString();
  const future = new Date(now + 60 * 60 * 1000).toISOString();
  const second = reservation("booking-2", "ปลายทางสำหรับค้นหา", future, new Date(now + 2 * 60 * 60 * 1000).toISOString());
  const first = reservation("booking-1", "ภารกิจคืนรถ", past, future);
  const mutations: string[] = [];
  const unexpectedApi: string[] = [];

  await page.route("**/api/**", async (route: Route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (path === "/api/admin/car-booking" && method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{ id: "user-1", email: "staff@example.test", display_name: "พนักงานทดสอบ", employee_code: "T-001", status: "active", can_use: false, can_admin: false }] }) });
      return;
    }
    if (path === "/api/admin/car-booking" && method === "PATCH") {
      mutations.push(`${method} ${path}`);
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: null }) });
      return;
    }
    if (!path.startsWith("/api/car-booking/")) {
      unexpectedApi.push(`${method} ${path}`);
      await route.abort();
      return;
    }

    if (path === "/api/car-booking/bookings" && method === "GET") {
      const view = url.searchParams.get("view");
      const offset = url.searchParams.get("offset");
      const rows = view === "active" ? [first, second] : offset === "1" ? [second] : [first];
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: rows, page: { nextOffset: view === "active" || offset === "1" ? null : 1 } }) });
      return;
    }
    if (path === "/api/car-booking/cars" && method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [car] }) });
      return;
    }
    if (path === "/api/car-booking/calendar" && method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [{ car_id: car.car_id, license_plate: car.license_plate, start_time: past, end_time: future }] }) });
      return;
    }
    if (path === "/api/car-booking/settings" && method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { floors: ["2A", "3B"], version: 1, acceptNewBookings: true } }) });
      return;
    }
    if (path === "/api/car-booking/reports" && method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { columns: ["id"], rows: [], total: 0, offset: 0, limit: 50, nextOffset: null } }) });
      return;
    }
    if (path === "/api/car-booking/dashboard" && method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { totals: { total: 0, completed: 0, active: 0, upcoming: 0, distance: 0, liters: 0, amount: 0 }, cars: [], topUsers: [], bookings: [], nextOffset: null } }) });
      return;
    }
    if (path === "/api/car-booking/osp-sync" && method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { configured: false, counts: [], jobs: [] } }) });
      return;
    }
    if (/\/api\/car-booking\/bookings\/[^/]+\/(logs|gps)$/.test(path) && method === "GET") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [], page: { nextOffset: null } }) });
      return;
    }
    if (method === "POST" && /\/api\/car-booking\/bookings$/.test(path)) {
      mutations.push(`${method} ${path}`);
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ data: first }) });
      return;
    }
    if (method === "POST" && /\/return$/.test(path)) {
      mutations.push(`${method} ${path}`);
      const body = request.postDataJSON() as { mileage?: string };
      if (body.mileage === "90") {
        await route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ message: "เลขไมล์ต้องมากกว่าเลขไมล์ล่าสุด" }) });
      } else {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: null }) });
      }
      return;
    }
    if (method === "POST" && (/\/cancel$/.test(path) || /\/logs$/.test(path))) {
      mutations.push(`${method} ${path}`);
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: null }) });
      return;
    }
    if (method === "POST" && path === "/api/car-booking/osp-sync") {
      mutations.push(`${method} ${path}`);
      await route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ data: null }) });
      return;
    }
    if ((method === "PATCH" || method === "POST") && (/\/api\/car-booking\/settings$/.test(path) || /\/api\/car-booking\/cars/.test(path))) {
      mutations.push(`${method} ${path}`);
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: null }) });
      return;
    }

    unexpectedApi.push(`${method} ${path}`);
    await route.abort();
  });

  return { mutations, unexpectedApi };
}

test("isolated car-booking interactions cover navigation, filters, calendar, dialogs and guarded mutations", async ({ page }) => {
  const guard = await installMockGuard(page);
  await login(page);
  await page.goto("/car-booking");
  const routeHeading = page.locator('main[data-ui-screen="car-booking"]').getByRole("heading", { name: "ระบบจองรถ", exact: true });
  await expect(routeHeading).toHaveCount(1);
  await expect(routeHeading).toBeVisible();
  await expect(page.getByRole("button", { name: "จัดการรถ", exact: true })).toBeVisible();

  for (const [tab, heading] of [
    ["จองรถ", "จองรถ"], ["รายการของฉัน", "รายการของฉัน"], ["คืนรถ", "รายการที่เริ่มแล้วและยังไม่คืน"],
    ["ปฏิทิน", "ปฏิทินช่วงไม่ว่าง"], ["ข้อมูลรถ", "ข้อมูลรถ"], ["จัดการรถ", "จัดการรถ"],
    ["การจองทั้งหมด", "การจองทั้งหมด"], ["ชั้นจอด", "รายการชั้นจอด"], ["รายงาน OSP", "รายงาน OSP"], ["แดชบอร์ด", "แดชบอร์ดการใช้รถ"],
  ]) {
    await page.locator(".cb-toolbar").getByRole("button", { name: tab, exact: true }).click();
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }

  await page.getByRole("button", { name: "รายการของฉัน", exact: true }).click();
  const searchable = page.locator(".cb-reservation").filter({ hasText: "ปลายทางสำหรับค้นหา" });
  await expect(searchable).toBeVisible();
  await page.getByRole("searchbox", { name: "ค้นหาการจอง", exact: true }).fill("ปลายทางสำหรับค้นหา");
  await expect(page.locator(".cb-reservation")).toHaveCount(1);
  await page.getByRole("searchbox", { name: "ค้นหาการจอง", exact: true }).fill("");
  await page.getByRole("button", { name: "เพิ่มบันทึก", exact: true }).first().click();
  const logButton = page.getByRole("button", { name: "เพิ่มบันทึก", exact: true }).first();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(logButton).toBeFocused();

  await page.locator(".cb-toolbar").getByRole("button", { name: "คืนรถ", exact: true }).click();
  const returnRow = page.locator(".cb-reservation").filter({ hasText: "ภารกิจคืนรถ" });
  await returnRow.getByRole("button", { name: "คืนรถ", exact: true }).click();
  await page.getByLabel("เลขไมล์ตอนคืน", { exact: true }).fill("90");
  await page.getByRole("button", { name: "ยืนยันคืนรถ", exact: true }).click();
  await expect(page.getByText("เลขไมล์ต้องมากกว่าเลขไมล์ล่าสุด", { exact: true }).first()).toBeVisible();
  await page.getByLabel("เลขไมล์ตอนคืน", { exact: true }).fill("120");
  await page.getByRole("button", { name: "ยืนยันคืนรถ", exact: true }).click();
  await expect(page.getByText("คืนรถเรียบร้อยแล้ว", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "ปฏิทิน", exact: true }).click();
  await page.getByRole("combobox", { name: "มุมมองปฏิทิน", exact: true }).selectOption("week");
  await expect(page.locator(".cb-calendar-cell")).toHaveCount(7);
  await page.getByRole("button", { name: "ถัดไป", exact: true }).click();
  await page.getByRole("button", { name: "วันนี้", exact: true }).click();
  await page.locator(".cb-calendar-event").first().click();
  await expect(page.locator(".cb-calendar-detail")).toContainText("ทดสอบ-1001");

  await page.getByRole("link", { name: "จัดสิทธิ์จองรถ", exact: true }).click();
  await expect(page.getByRole("heading", { name: "สิทธิ์ระบบจองรถ", exact: true })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "ค้นหาผู้ใช้", exact: true })).toBeVisible();

  expect(guard.unexpectedApi).toEqual([]);
  expect(guard.mutations.length).toBeGreaterThanOrEqual(2);
});

test("isolated submit guard exercises booking success and cancel without external writes", async ({ page }) => {
  const guard = await installMockGuard(page);
  await login(page);
  await page.goto("/car-booking");
  await page.getByRole("button", { name: "ตรวจรถว่าง", exact: true }).click();
  await page.getByRole("combobox", { name: "ทะเบียนรถ", exact: true }).selectOption("car-1");
  await page.getByLabel("สถานที่ที่จะไป", { exact: true }).fill("ภารกิจทดสอบแบบแยกส่วน");
  await page.getByRole("button", { name: "ยืนยันการจอง", exact: true }).click();
  await expect(page.getByText("จองรถเรียบร้อยแล้ว", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "รายการของฉัน", exact: true }).click();
  const row = page.locator(".cb-reservation").filter({ hasText: "ปลายทางสำหรับค้นหา" });
  await row.getByRole("button", { name: "ยกเลิกการจอง", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("ปลายทางสำหรับค้นหา");
  await page.getByRole("button", { name: "ยืนยันยกเลิก", exact: true }).click();
  await expect(page.getByText("ยกเลิกการจองเรียบร้อยแล้ว", { exact: true })).toBeVisible();

  expect(guard.unexpectedApi).toEqual([]);
  expect(guard.mutations.every((entry) => entry.startsWith("POST /api/car-booking/"))).toBe(true);
});
