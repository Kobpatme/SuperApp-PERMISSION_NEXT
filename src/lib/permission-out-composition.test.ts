import {describe,it,expect,vi} from "vitest";
vi.mock("server-only",()=>({}));
const fixture=vi.hoisted(()=>({source:true,target:true,project:vi.fn()}));
vi.mock("./access",()=>({getAccessContext:async(id:string)=>({allowed:id==="permission-out"?fixture.source:fixture.target,userId:"00000000-0000-4000-8000-000000000001",subject:{userId:"00000000-0000-4000-8000-000000000001",teamIds:[],grants:[{permission:"duct_rental.request.create",scope:"OWN"}]}})}));
vi.mock("@/modules/permission-out/service",()=>({getProject:fixture.project}));
import {loadCableAnalysisHandoff} from "./permission-out-composition";
describe("authorized analysis-to-cable composition",()=>{
  const id="00000000-0000-4000-8000-000000000002";
  it("requires both module gates before fetching any analysis",async()=>{fixture.source=false;expect(await loadCableAnalysisHandoff(id)).toBeNull();expect(fixture.project).not.toHaveBeenCalled();fixture.source=true;fixture.target=false;expect(await loadCableAnalysisHandoff(id)).toBeNull();fixture.target=true;});
  it("produces a reviewable draft with stable reference and never auto-creates a request",async()=>{fixture.project.mockResolvedValue({title:"โครงการจำลอง",snapshot:{segments:[{name:"เส้นทางทดสอบ",coords:[[100,13],[100.001,13]]}]}});const draft=await loadCableAnalysisHandoff(id);expect(draft?.projectName).toBe("โครงการจำลอง");expect(draft?.notes).toContain(`/permission-out?project=${id}`);expect(draft?.cableType).toBe("");});
});
