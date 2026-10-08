import { describe,it,expect,vi } from "vitest";
import { generateKeyPairSync,verify } from "node:crypto";
import { buildOspRow,ospColumns,ospCsv,type OspSource,type OspLog } from "./car-booking-osp";
import { planOspSheet } from "./car-booking-sheets-plan";
import { synchronizeOspSheet } from "./car-booking-google-sheets";
const source:OspSource={id:"synthetic-1",legacy_id:null,start_time:"2026-10-07T23:00:00Z",actual_return_time:"2026-10-08T03:00:00Z",start_mileage:"0",mileage_on_return:"100",license_plate:"ทดสอบ 1001",employee_name:"ผู้ใช้ทดสอบ",destination:"ทดสอบ",parking_floor:"2A",refueled:true,fuel_mileage:"80",fuel_liters:"30",fuel_amount:"1200",logs:[]};
const log:OspLog={id:"log-1",log_time:"2026-10-08T00:00:00Z",log_type:"fuel",location:"จุดแวะ",mileage:"20",refueled:false,fuel_liters:"10",fuel_amount:"400",note:"ทดสอบ",gps_latitude:"0",gps_longitude:"0",gps_accuracy_meters:"0"};
describe("native OSP report parity and safe exports",()=>{
 it("has 19 ordered columns, Bangkok BE dates, zero-mile distance and combined trip/return fuel",()=>{
  const row=buildOspRow({...source,logs:[log]},1);expect(row).toHaveLength(19);expect(row.slice(2,9)).toEqual(["08/10/2569","06:00","0","08/10/2569","10:00","100","100"]);expect(row.slice(15,18)).toEqual(["80","40","1600"]);
  expect(row[13]).toBe("ทดสอบ\n\nเติมน้ำมัน : 08/10/2569 07:00 | จุดแวะ | ไมล์ 20 | 10 ลิตร | 400 บาท | ทดสอบ");expect(JSON.parse(row[18])[0].gps).toEqual({lat:"0",lng:"0",accuracy:"0"});
 });
 it("keeps exact decimals, uses latest chronologically sorted fuel log, and distinguishes missing values from zero",()=>{
  const earlier={...log,id:"z",log_time:"2026-10-07T23:30:00Z",mileage:"10",fuel_amount:"0.1",fuel_liters:"0.1"},later={...log,id:"a",mileage:"30",fuel_amount:"0.2",fuel_liters:"0.2"};
  const row=buildOspRow({...source,refueled:false,fuel_mileage:null,logs:[later,earlier]},1);expect(row.slice(15,18)).toEqual(["30","0.3","0.3"]);expect(JSON.parse(row[18]).map((item:{mileage:string})=>item.mileage)).toEqual(["10","30"]);
  expect(buildOspRow({...source,refueled:false,logs:[]},1).slice(16,19)).toEqual(["","",""]);expect(buildOspRow({...source,start_mileage:null},1)[8]).toBe("");
 });
 it("returns deterministic CSV with BOM, escaping quoted multiline content and neutralizing spreadsheet formulas",()=>{
  const row=buildOspRow({...source,destination:'=HYPERLINK("https://example.test")\nสองบรรทัด'},1);const csv=ospCsv([row]);expect(csv.startsWith("\ufeff")).toBe(true);expect(csv).toContain('"\'=HYPERLINK(""https://example.test"")\nสองบรรทัด"');expect(csv).toBe(ospCsv([row]));
 });
});
describe("Sheets upsert/rebuild preservation",()=>{
 it("preserves non-default SAP and unknown/manual rows, removes duplicates and repeats identically",()=>{
  const row=buildOspRow(source,1),edited=[...row];edited[12]="SAP-123";const manual=Array(19).fill("");manual[0]="legacy-not-imported";manual[13]="แถวที่เจ้าหน้าที่เก็บไว้";
  const result=planOspSheet([[...ospColumns],row,edited,manual],[row]);expect(result.values[1][12]).toBe("SAP-123");expect(result.values[2]).toEqual(manual);expect(result.duplicatesRemoved).toBe(1);expect(planOspSheet(result.values,[row]).values).toEqual(result.values);
 });
 it("aborts before writes for mismatched headers, conflicting SAP, populated extra columns and manual formulas",()=>{
  const row=buildOspRow(source,1),a=[...row],b=[...row];a[12]="SAP-A";b[12]="SAP-B";
  expect(()=>planOspSheet([["bad"]],[row])).toThrow("HEADER_MISMATCH");expect(()=>planOspSheet([[...ospColumns],a,b],[row])).toThrow("SAP_CONFLICT");expect(()=>planOspSheet([[...ospColumns], [...row,"keep"]],[row])).toThrow("EXTRA_COLUMNS");
  const manual=[...row];manual[0]="manual";manual[13]="=A1";expect(()=>planOspSheet([[...ospColumns],manual],[row])).toThrow("FORMULA_REVIEW");
 });
 it("signs only Sheets scope, backs up before atomic string-value update, and reuses the same backup on retry",async()=>{
  const key=generateKeyPairSync("rsa",{modulusLength:2048}),privateKey=key.privateKey.export({type:"pkcs8",format:"pem"}).toString();
  const config={spreadsheetId:"synthetic",sheetTitle:"BookingsOSP",clientEmail:"fixture@example.test",privateKey};let written:Record<string,unknown>={};
  const calls:string[]=[];let hasBackup=false;
  const request=vi.fn(async(input:string|URL|Request,init?:RequestInit)=>{
   const url=String(input);calls.push(url);
   if(url.includes("oauth2")){
    const assertion=new URLSearchParams(String(init?.body)).get("assertion")!,parts=assertion.split(".");expect(verify("RSA-SHA256",Buffer.from(parts.slice(0,2).join(".")),key.publicKey,Buffer.from(parts[2],"base64url"))).toBe(true);expect(JSON.parse(Buffer.from(parts[1],"base64url").toString()).scope).toBe("https://www.googleapis.com/auth/spreadsheets");return Response.json({access_token:"synthetic-token"});
   }
   if(url.endsWith(":batchUpdate")){written=JSON.parse(String(init?.body));hasBackup=true;return Response.json({});}
   if(url.includes("/values/"))return Response.json({values:[[...ospColumns]]});
   return Response.json({sheets:[{properties:{sheetId:1,title:"BookingsOSP",gridProperties:{rowCount:100,columnCount:19}}},...(hasBackup?[{properties:{sheetId:2,title:"BookingsOSP_backup_job-id"}}]:[])]});
  });
  await synchronizeOspSheet(config,[buildOspRow(source,1)],"job-id",request as typeof fetch);
  const requests=written.requests as {duplicateSheet?:unknown;updateCells?:{rows:{values:{userEnteredValue:unknown}[]}[]}}[];expect(requests[0].duplicateSheet).toBeDefined();expect(requests[1].updateCells?.rows[1].values[17].userEnteredValue).toEqual({stringValue:"1200"});expect(calls).toHaveLength(4);
  await synchronizeOspSheet(config,[buildOspRow(source,1)],"job-id",request as typeof fetch);expect((written.requests as {duplicateSheet?:unknown}[]).some(item=>item.duplicateSheet)).toBe(false);expect(calls).toHaveLength(8);
 });
 it("returns sanitized rate-limit codes without including Google response bodies",async()=>{
  const key=generateKeyPairSync("rsa",{modulusLength:2048});const request=vi.fn(async()=>new Response("private provider response",{status:429}));
  await expect(synchronizeOspSheet({spreadsheetId:"synthetic",sheetTitle:"BookingsOSP",clientEmail:"fixture@example.test",privateKey:key.privateKey.export({type:"pkcs8",format:"pem"}).toString()},[],"job",request as typeof fetch)).rejects.toMatchObject({code:"RATE_LIMIT",message:"RATE_LIMIT"});
 });
});
