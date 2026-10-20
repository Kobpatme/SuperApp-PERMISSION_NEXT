import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ core: vi.fn(), connect: vi.fn(), drizzle: vi.fn() }));
vi.mock("@/db", () => ({ getDb: mocks.core }));
vi.mock("postgres", () => ({ default: mocks.connect }));
vi.mock("drizzle-orm/postgres-js", () => ({ drizzle: mocks.drizzle }));
import { getCarBookingDb } from "./car-booking-db";
afterEach(() => {
  vi.unstubAllEnvs(); vi.clearAllMocks();
  delete (globalThis as typeof globalThis & { carBookingSql?: unknown }).carBookingSql;
});
it("keeps existing fixtures on their mocked Core connection when no car URL is supplied", () => {
  vi.stubEnv("CAR_BOOKING_DATABASE_URL", "");
  mocks.core.mockReturnValue("fixture");
  expect(getCarBookingDb()).toBe("fixture"); expect(mocks.connect).not.toHaveBeenCalled();
});
it("isolates car queries from Core and reuses its constrained pool", () => {
  vi.stubEnv("CAR_BOOKING_DATABASE_URL", "postgres://runtime:synthetic@127.0.0.1/fixture");
  const pool = {}; mocks.connect.mockReturnValue(pool); mocks.drizzle.mockReturnValue("car");
  expect(getCarBookingDb()).toBe("car"); expect(getCarBookingDb()).toBe("car");
  expect(mocks.core).not.toHaveBeenCalled(); expect(mocks.connect).toHaveBeenCalledTimes(1);
  expect(mocks.connect).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ prepare: false, connect_timeout: 10 }));
  expect(mocks.drizzle).toHaveBeenCalledWith(pool, expect.objectContaining({ schema: expect.any(Object) }));
});
it("fails closed outside tests when the car runtime connection is missing", () => {
  vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("CAR_BOOKING_DATABASE_URL", "");
  expect(() => getCarBookingDb()).toThrow("CAR_BOOKING_DATABASE_URL is required");
  expect(mocks.core).not.toHaveBeenCalled(); expect(mocks.connect).not.toHaveBeenCalled();
});
