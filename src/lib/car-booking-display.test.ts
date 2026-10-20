import { describe,expect,it } from "vitest";
import { bangkokInput,bangkokISO,bookingStatus,returnParkingFloor,thaiCarDate } from "./car-booking-display";
import { carCalendarBounds,moveCarCalendar } from "./car-booking-calendar";
describe("Thai vehicle workflow display",()=>{
 it("round trips Bangkok local inputs without depending on device timezone",()=>{
  expect(bangkokInput(new Date("2026-10-08T00:00:00Z"))).toBe("2026-10-08T07:00");
  expect(bangkokISO("2026-10-08T07:00")).toBe("2026-10-08T00:00:00.000Z");
  expect(thaiCarDate("2026-10-08T00:00:00Z")).toContain("2569");
 });
 it("labels status and uses the latest allowed floor with a valid fallback",()=>{
  const start="2030-01-01T01:00:00Z";
  expect(bookingStatus("booked",start,Date.parse("2030-01-01T00:00:00Z"))).toBe("จองล่วงหน้า");
  expect(bookingStatus("booked",start,Date.parse(start))).toBe("กำลังใช้งาน");
  expect(bookingStatus("completed",start,0)).toBe("คืนแล้ว");
  expect(returnParkingFloor("3B",["2A","3B"])).toBe("3B");expect(returnParkingFloor(null,["2A"])).toBe("2A");expect(returnParkingFloor("removed",["Z9"])).toBe("Z9");
 });
 it("queries complete Bangkok calendar weeks across month/year boundaries",()=>{
  const month=carCalendarBounds("2026-10-08","month");
  expect(month.start).toBe("2026-09-26T17:00:00.000Z");expect(month.end).toBe("2026-10-31T17:00:00.000Z");expect(month.days).toHaveLength(35);
  expect(carCalendarBounds("2027-01-01","week").days).toEqual(["2026-12-27","2026-12-28","2026-12-29","2026-12-30","2026-12-31","2027-01-01","2027-01-02"]);
  expect(carCalendarBounds("2026-10-08","day").start).toBe("2026-10-07T17:00:00.000Z");
  expect(moveCarCalendar("2026-12-31","month",1)).toBe("2027-01-01");expect(moveCarCalendar("2026-12-31","day",1)).toBe("2027-01-01");
 });
});
