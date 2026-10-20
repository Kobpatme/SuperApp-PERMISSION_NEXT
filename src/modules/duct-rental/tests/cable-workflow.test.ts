import { describe,it,expect } from "vitest";
import { cableInput,cableNext } from "../domain/cable-workflow";
describe("cable trial workflow",()=>{
 const complete=cableInput.parse({authority:"PEA",projectName:"ทดสอบ",routeName:"เส้นทางจำลอง",startPoint:"A",endPoint:"B",cableType:"ADSS",submissionNumber:"TEST",permitNumber:"PERMIT",notes:"ตรวจรับแล้ว"});
 it("requires fields at the appropriate boundary and never skips revision review",()=>{
  expect(()=>cableNext("DESIGN",cableInput.parse({authority:"MEA",projectName:"ร่าง"}))).toThrow();
  expect(()=>cableNext("REVIEW",{...complete,submissionNumber:""})).toThrow();
  expect(()=>cableNext("SUBMITTED",{...complete,permitNumber:""})).toThrow();
  expect(()=>cableNext("INSTALL",{...complete,notes:""})).toThrow();
  expect(cableNext("SUBMITTED",complete,true,"ปรับแนวสาย")).toBe("REVISION");
  expect(cableNext("REVISION",complete)).toBe("REVIEW");
  expect(()=>cableNext("SUBMITTED",complete,true,"")).toThrow();
  expect(()=>cableNext("COMPLETE",complete)).toThrow();
 });
 it("rejects unsupported authorities and injected fields",()=>{
  expect(cableInput.safeParse({...complete,authority:"NT"}).success).toBe(false);
  expect(cableInput.safeParse({...complete,ownerId:"forged"}).success).toBe(false);
 });
});
