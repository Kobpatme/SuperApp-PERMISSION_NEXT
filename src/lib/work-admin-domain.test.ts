import { describe,expect,it } from "vitest";
import { businessDateSchema, personalKpiSchema, safeSystemUrl, visibleSystemLink } from "@/lib/work-admin-domain";
const a="00000000-0000-4000-8000-000000000001",b="00000000-0000-4000-8000-000000000002";
describe("work admin data contracts",()=>{
 it("rejects impossible business dates and accepts leap days",()=>{expect(businessDateSchema.safeParse("2026-02-30").success).toBe(false);expect(businessDateSchema.safeParse("2028-02-29").success).toBe(true);});
 it("requires exact decimal total of 100 without duplicate metrics",()=>{
 const input={userId:a,teamId:b,expectedVersion:0,assignments:[{metricId:a,weight:"33.333333",enabled:true},{metricId:b,weight:"66.666667",enabled:true}]};
 expect(personalKpiSchema.safeParse(input).success).toBe(true);
 expect(personalKpiSchema.safeParse({...input,assignments:[{metricId:a,weight:"99.999999",enabled:true}]}).success).toBe(false);
 expect(personalKpiSchema.safeParse({...input,assignments:[{metricId:a,weight:"50",enabled:true},{metricId:a,weight:"50",enabled:true}]}).success).toBe(false);
 });
 it("rejects script, protocol-relative, credential and backslash URLs",()=>{for(const v of ["javascript:alert(1)","//evil.test","/\\evil.test","https://user:pass@example.test","data:text/html,x"])expect(safeSystemUrl(v)).toBe(false);expect(safeSystemUrl("/work")).toBe(true);expect(safeSystemUrl("https://example.test/app")).toBe(true);});
 it("denies hidden and unrelated role/team links",()=>{const link={status:"Active",visibleToAll:false,roleIds:[a],teamIds:[b]};expect(visibleSystemLink(link,[],[])).toBe(false);expect(visibleSystemLink(link,[a],[])).toBe(true);expect(visibleSystemLink({...link,status:"Hidden"},[a],[b])).toBe(false);});
});
