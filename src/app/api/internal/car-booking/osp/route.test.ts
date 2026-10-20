import { describe,it,expect,vi,afterEach } from "vitest";
const process=vi.hoisted(()=>vi.fn());
vi.mock("@/lib/car-booking-osp-jobs",()=>({processOspJobs:process}));
import { POST } from "./route";
import { proxy } from "@/proxy";
import { NextRequest } from "next/server";
vi.mock("@/lib/auth",()=>({sessionCookieName:"fixture_session"}));
afterEach(()=>{vi.unstubAllEnvs();process.mockReset();});
describe("background OSP worker authentication",()=>{
 it("routes scheduler requests to their own authentication boundary while other internal APIs remain guarded",()=>{
  expect(proxy(new NextRequest("http://localhost/api/internal/car-booking/osp")).status).toBe(200);
  expect(proxy(new NextRequest("http://localhost/api/internal/other")).status).toBe(401);
 });
 it("fails closed when unconfigured and does not run a worker",async()=>{
  vi.stubEnv("CAR_BOOKING_OSP_WORKER_SECRET","");expect((await POST(new Request("http://localhost"))).status).toBe(503);expect(process).not.toHaveBeenCalled();
 });
 it("rejects missing/forged bearer tokens and short secrets without consuming jobs",async()=>{
  vi.stubEnv("CAR_BOOKING_OSP_WORKER_SECRET","x".repeat(32));vi.stubEnv("CAR_BOOKING_OSP_WORKER_USER_ID","00000000-0000-4000-8000-000000001003");
  for(const token of ["","Bearer bad","Bearer "+"y".repeat(32)])expect((await POST(new Request("http://localhost",{headers:{authorization:token}}))).status).toBe(403);
  expect(process).not.toHaveBeenCalled();vi.stubEnv("CAR_BOOKING_OSP_WORKER_SECRET","short");expect((await POST(new Request("http://localhost"))).status).toBe(503);
 });
 it("uses only the configured principal after a valid token and never trusts a user ID in the body",async()=>{
  vi.stubEnv("CAR_BOOKING_OSP_WORKER_SECRET","x".repeat(32));vi.stubEnv("CAR_BOOKING_OSP_WORKER_USER_ID","00000000-0000-4000-8000-000000001003");process.mockResolvedValue({status:"sent",processed:1});
  const response=await POST(new Request("http://localhost",{method:"POST",headers:{authorization:"Bearer "+"x".repeat(32)},body:JSON.stringify({actorId:"forged"})}));expect(response.status).toBe(200);expect(process.mock.calls[0][0].actorId).toBe("00000000-0000-4000-8000-000000001003");expect(response.headers.get("cache-control")).toBe("no-store");
 });
});
