import { beforeEach,afterEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({access:vi.fn(),create:vi.fn(),returned:vi.fn(),cancel:vi.fn(),logs:vi.fn(),readLogs:vi.fn(),read:vi.fn(),calendar:vi.fn(),cars:vi.fn(),save:vi.fn(),settings:vi.fn(),saveSettings:vi.fn()}));
vi.mock("@/lib/car-booking-settings",()=>({readCarSettings:mocks.settings,saveCarSettings:mocks.saveSettings}));
vi.mock("@/lib/access",()=>({getAccessContext:mocks.access}));
vi.mock("@/lib/car-booking-service",()=>({createCarBookings:mocks.create,returnCarBooking:mocks.returned,cancelCarBooking:mocks.cancel,addCarBookingLog:mocks.logs,readCarBookingLogs:mocks.readLogs,readCarBookings:mocks.read,readCarCalendar:mocks.calendar,readCars:mocks.cars,saveCar:mocks.save}));
import { handleCarBookingRequest } from "./car-booking-api";
import { CarBookingError } from "./car-booking-input";
const actorId=crypto.randomUUID();
const request=(body:unknown={},origin="https://workspace.example")=>new Request("https://workspace.example/api/car-booking/bookings",{method:"POST",headers:{origin,"content-type":"application/json"},body:JSON.stringify(body)});
beforeEach(()=>{vi.resetAllMocks();mocks.access.mockResolvedValue({userId:actorId,displayName:"พนักงาน",allowed:true,passwordChangeRequired:false});mocks.create.mockResolvedValue({ids:[]});});
afterEach(()=>vi.unstubAllEnvs());
describe("car booking direct API boundary",()=>{
  it("pauses new bookings server-side while return, cancel, and logs remain available",async()=>{
    vi.stubEnv("CAR_BOOKING_ACCEPT_NEW_BOOKINGS","false");
    const blocked=await handleCarBookingRequest(request(),"bookings");expect(blocked.status).toBe(503);expect((await blocked.json()).error).toBe("BOOKING_PAUSED");expect(mocks.create).not.toHaveBeenCalled();
    mocks.returned.mockResolvedValue({id:actorId});mocks.cancel.mockResolvedValue({id:actorId});mocks.logs.mockResolvedValue({id:actorId});
    for(const operation of ["return","cancel","logs"] as const)expect((await handleCarBookingRequest(request(),operation,actorId)).status).toBe(operation==="logs"?201:200);
    mocks.settings.mockResolvedValue({floors:["2A"],version:1});const settings=await handleCarBookingRequest(new Request("https://workspace.example/api/car-booking/settings"),"settings");expect((await settings.json()).data.acceptNewBookings).toBe(false);
    vi.stubEnv("CAR_BOOKING_ACCEPT_NEW_BOOKINGS","true");expect((await handleCarBookingRequest(request(),"bookings")).status).toBe(201);
  });
  it("denies anonymous, no grant/disabled module and forced-password calls",async()=>{
    for(const access of [{userId:"",allowed:false},{userId:actorId,allowed:false},{userId:actorId,allowed:true,passwordChangeRequired:true}]) {
      mocks.access.mockResolvedValue(access);expect((await handleCarBookingRequest(request(),"bookings")).status).toBe(access.userId?403:401);
    }
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("rejects foreign/missing origin, malformed JSON, and malformed ids",async()=>{
    expect((await handleCarBookingRequest(request({},"https://other.example"),"bookings")).status).toBe(403);
    expect((await handleCarBookingRequest(request({},""),"bookings")).status).toBe(403);
    const malformed=new Request("https://workspace.example/api/car-booking/bookings",{method:"POST",headers:{origin:"https://workspace.example","content-type":"application/json"},body:"{"});
    expect((await handleCarBookingRequest(malformed,"bookings")).status).toBe(400);
    expect((await handleCarBookingRequest(request(),"return","bad")).status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("passes only session identity and does not cache responses",async()=>{
    const response=await handleCarBookingRequest(request({userId:"forged"}),"bookings");
    expect(response.status).toBe(201);expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.create).toHaveBeenCalledWith({userId:"forged"},expect.objectContaining({actorId,displayName:"พนักงาน"}));
  });
  it("maps conflicts and conceals unexpected database internals",async()=>{
    mocks.create.mockRejectedValue(new CarBookingError("CAR_CONFLICT","รถไม่ว่าง",409));
    expect((await handleCarBookingRequest(request(),"bookings")).status).toBe(409);
    mocks.create.mockRejectedValue(new Error("private SQL details"));
    const response=await handleCarBookingRequest(request(),"bookings");expect(response.status).toBe(500);expect(await response.text()).not.toContain("private SQL");
  });
});
