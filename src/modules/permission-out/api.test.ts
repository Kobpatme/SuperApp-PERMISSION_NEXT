import { beforeEach,describe,expect,it,vi } from "vitest";
vi.mock("server-only",()=>({}));
const fixture=vi.hoisted(()=>({ identity:{ok:true,user:{id:"00000000-0000-4000-8000-000000000001"}} as {ok:boolean;user?:{id:string};response?:Response},allowed:true,list:vi.fn(),formula:vi.fn() }));
vi.mock("@/lib/request-context",()=>({requireApiIdentity:async()=>fixture.identity}));
vi.mock("@/lib/access",()=>({getAccessContext:async()=>({allowed:fixture.allowed,userId:"00000000-0000-4000-8000-000000000001"})}));
vi.mock("./service",async importOriginal=>({...await importOriginal<typeof import("./service")>(),listDatasets:fixture.list,createFormula:fixture.formula}));
import { permissionOutApi,sameOrigin } from "./api";
beforeEach(()=>{fixture.identity={ok:true,user:{id:"00000000-0000-4000-8000-000000000001"}};fixture.allowed=true;fixture.list.mockReset().mockResolvedValue([]);fixture.formula.mockReset().mockResolvedValue({id:"test"});});
describe("Permission Out API boundary",()=>{
  it("validates the browser Host when Next's internal listen URL differs and ignores forwarded-host injection",()=>{
    const request=(origin:string,host="workspace.example",forwarded="evil.example")=>new Request("http://127.0.0.1/api/permission-out/formulas",{headers:{origin,host,"x-forwarded-host":forwarded}});
    expect(sameOrigin(request("http://workspace.example"))).toBe(true);
    for(const origin of ["http://evil.example","http://workspace.example:9999","https://workspace.example","null",""])expect(sameOrigin(request(origin))).toBe(false);
    expect(sameOrigin(request("http://workspace.example","workspace.example/evil"))).toBe(false);
  });
  it("rejects unauthenticated and disabled-module calls before querying business data",async()=>{
    fixture.identity={ok:false,response:new Response(null,{status:401})};
    expect((await permissionOutApi(new Request("http://localhost/api/permission-out/datasets"),["datasets"])).status).toBe(401);
    fixture.identity={ok:true,user:{id:"00000000-0000-4000-8000-000000000001"}};fixture.allowed=false;
    expect((await permissionOutApi(new Request("http://localhost/api/permission-out/datasets"),["datasets"])).status).toBe(403);expect(fixture.list).not.toHaveBeenCalled();
  });
  it("rejects foreign/missing origins and oversized streaming input before mutation",async()=>{
    for(const origin of ["http://evil.test",""]){const response=await permissionOutApi(new Request("http://localhost/api/permission-out/formulas",{method:"POST",headers:{origin},body:"{}"}),["formulas"]);expect(response.status).toBe(403);}
    const response=await permissionOutApi(new Request("http://localhost/api/permission-out/import",{method:"POST",headers:{origin:"http://localhost","content-length":"999999999"},body:"x"}),["import"]);
    expect(response.status).toBe(413);expect(fixture.formula).not.toHaveBeenCalled();
  });
  it("returns private no-store reads and never reflects nested SQL errors",async()=>{
    const response=await permissionOutApi(new Request("http://localhost/api/permission-out/datasets"),["datasets"]);expect(response.headers.get("cache-control")).toContain("no-store");
    fixture.list.mockRejectedValue(Object.assign(new Error("select sensitive SQL"),{code:"08006"}));
    const failed=await permissionOutApi(new Request("http://localhost/api/permission-out/datasets"),["datasets"]);expect(failed.status).toBe(503);expect(await failed.text()).not.toContain("sensitive SQL");
  });
  it("checks the owning module and rejects cross-domain resource paths",async()=>{
    expect((await permissionOutApi(new Request("http://localhost/api/permission-out/sites"),["sites"])).status).toBe(404);
    expect((await permissionOutApi(new Request("http://localhost/api/site-facility/projects"),["projects"],"site-facility")).status).toBe(404);
    expect((await permissionOutApi(new Request("http://localhost/api/site-facility/analysis"),["analysis"],"site-facility")).status).toBe(404);
  });
});
