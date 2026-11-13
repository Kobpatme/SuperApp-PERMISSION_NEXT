import {describe,it,expect} from "vitest";
import {annotateGeography,findProvince,provinceBoundaries,type Area} from "./geography";
import {routeSchema} from "./domain";
describe("frozen offline geography reference",()=>{
  it("preserves all 77 source provinces and resolves Bangkok without network access",()=>{expect(provinceBoundaries).toHaveLength(77);expect(findProvince([100.5,13.75])).toBe("กรุงเทพมหานคร");});
  it("matches multiple crossed PEA polygons and preserves coverage ratios",()=>{
    const area=(key:string,left:number,right:number):Area=>({key,name:key,geometry:{type:"Polygon",coordinates:[[[left,12],[right,12],[right,14],[left,14],[left,12]]]},properties:{}});
    const line=routeSchema.parse({key:"a",name:"a",coords:[[100,13],[100.04,13]]});
    const [result]=annotateGeography([{...line,length:4400,status:"new",overlapType:"none"}],[area("one",99.99,100.025),area("two",100.015,100.05)]);
    expect(result.peaAreas.map(a=>a.key)).toEqual(["one","two"]);expect(result.provinces.length).toBeGreaterThan(0);expect(result.peaAreas.every(a=>a.coverageRatio>0&&a.coverageRatio<=1)).toBe(true);
  });
});
