import {describe,it,expect,vi} from "vitest";
vi.mock("server-only",()=>({}));
import {csvDirectOverlapMeters,csvDirectMatchRows,trimExportSourceLines,buildExportOverlapGroups} from "./source-export.mjs";
import {routeSchema} from "./domain";
import {routeKml} from "./export";
import {resolvePeaArea} from "./pea-hierarchy.mjs";
const route=(file:string,points:number[][])=>routeSchema.parse({key:file,name:file,sourceFile:file,coords:points.map(([x,y])=>[100+x/111320,y/111320])});
describe("source CSV projection/trim regression fixtures @55380a5",()=>{
  const base=route("rd03.kml",[[0,0],[100,0]]),full=route("maxi.kml",[[0,0],[100,0]]);
  it("measures projection unions, excludes crossings and respects tolerance",()=>{
    expect(csvDirectOverlapMeters(base,full,1)).toBeCloseTo(100,0);
    expect(csvDirectOverlapMeters(base,route("maxi",[[70,0],[20,0]]),1)).toBeCloseTo(50,0);
    expect(csvDirectOverlapMeters(base,route("maxi",[[0,0],[100,0],[0,0]]),1)).toBeCloseTo(100,0);
    expect(csvDirectOverlapMeters(base,route("maxi",[[50,-50],[50,50]]),1)).toBe(0);
    expect(csvDirectOverlapMeters(base,route("maxi",[[0,10],[100,10]]),1)).toBe(0);
  });
  it("preserves all multiple matches and unmatched Maxi rows with blank overlap",async()=>{
    expect(await csvDirectMatchRows([base,full,{...full}],1)).toHaveLength(2);
    const only=await csvDirectMatchRows([full],1);expect(only[0]).toMatchObject({rd03Line:null,overlapMeters:"",overlapPercent:""});
    expect(await csvDirectMatchRows([base,route("maxi",[[0,10],[100,10]])],1)).toHaveLength(2);
  });
  it("trims excess Maxi into disjoint overlaps, leaves RD03/original data intact",()=>{
    const long=route("maxi",[[-25,0],[125,0]]),before=JSON.stringify(long);
    const result=trimExportSourceLines([base,long],1);expect(result).toHaveLength(2);expect(result[0]).toBe(base);expect(JSON.stringify(long)).toBe(before);
    expect(trimExportSourceLines([long],1)).toHaveLength(0);
    const labels=buildExportOverlapGroups([base,full],1,5);expect(labels.get(base)).toBe(labels.get(full));expect(labels.get(base)).toBe("ทับกัน 1");
  });
  it("keeps selected pair matches, hierarchy uncertainty and escaped group metadata",async()=>{
    expect(await csvDirectMatchRows([base,full],1,new Set())).toHaveLength(0);
    expect(await csvDirectMatchRows([base,full],1,new Set([base.key]))).toHaveLength(1);
    expect(resolvePeaArea({name:"กฟจ.ขอนแก่น"}).path).toContain("กฟจ.ขอนแก่น");
    expect(resolvePeaArea({name:"พื้นที่ไม่ทราบ"}).confirmed).toBe(false);
    const xml=routeKml([{...base,status:"new",overlapType:"none",length:100,peaAreas:[{key:"area",areaId:"PEA-1",name:"กฟจ.ขอนแก่น",coverageRatio:1}]}],[],["ทับกัน <1>"]);
    expect(xml).toContain("<Folder><name>กฟจ.ขอนแก่น</name>");
    expect(xml).toContain("ทับกัน &lt;1&gt;");expect(xml).toContain("PEA-1");
  });
  it("executes bounded native export workers and trims each matched pair independently",async()=>{
    const {matchSourcesInWorker,groupSegmentsInWorker}=await import("./analysis-server");
    const long=route("maxi",[[-25,0],[125,0]]);
    const result=await matchSourcesInWorker([base,long],1,new Set([base.key]),true);
    expect(result).toHaveLength(1);expect(result[0].overlapMeters).toBeCloseTo(100,0);
    expect(result[0].maxiLine!.coords[0][0]).toBeCloseTo(base.coords[0][0],5);
    expect(await groupSegmentsInWorker([base,full],1,5)).toEqual(["ทับกัน 1","ทับกัน 1"]);
  });
});
