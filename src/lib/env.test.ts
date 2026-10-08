import {afterEach,describe,expect,it,vi} from "vitest";
import {warnAboutProductionProxy,getServerEnv} from "./env";
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
describe("production trusted proxy warning",()=>{
  it("defaults single-session on and parses false strictly",()=>{vi.stubEnv("AUTH_SINGLE_SESSION",undefined);expect(getServerEnv().AUTH_SINGLE_SESSION).toBe(true);vi.stubEnv("AUTH_SINGLE_SESSION","false");expect(getServerEnv().AUTH_SINGLE_SESSION).toBe(false);vi.stubEnv("AUTH_SINGLE_SESSION","yes");expect(()=>getServerEnv()).toThrow("AUTH_SINGLE_SESSION");});
  it.each([["production","0",1],["production","2",0],["development","0",0]])("warns only at production default (%s/%s)",(mode,count,warnings)=>{vi.stubEnv("NODE_ENV",mode);vi.stubEnv("TRUSTED_PROXY_COUNT",count);const spy=vi.spyOn(console,"warn").mockImplementation(()=>{});warnAboutProductionProxy();expect(spy).toHaveBeenCalledTimes(warnings);if(warnings)expect(String(spy.mock.calls[0][0])).toContain("auth.trusted_proxy_not_configured");expect(getServerEnv().TRUSTED_PROXY_COUNT).toBe(Number(count));});
  it("keeps the default at zero without inventing a topology",()=>{vi.stubEnv("TRUSTED_PROXY_COUNT",undefined);expect(getServerEnv().TRUSTED_PROXY_COUNT).toBe(0);});
});
