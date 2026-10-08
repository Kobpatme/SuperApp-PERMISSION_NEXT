import { sign } from "node:crypto";
import { planOspSheet,OspSyncError } from "./car-booking-sheets-plan";
export type OspSheetsConfig={spreadsheetId:string;sheetTitle:string;clientEmail:string;privateKey:string};
export function ospSheetsConfig():OspSheetsConfig|null{
 const spreadsheetId=process.env.CAR_BOOKING_OSP_SPREADSHEET_ID,clientEmail=process.env.CAR_BOOKING_GOOGLE_CLIENT_EMAIL,privateKey=process.env.CAR_BOOKING_GOOGLE_PRIVATE_KEY;
 return process.env.CAR_BOOKING_OSP_SYNC_ENABLED==="true"&&spreadsheetId&&/^[\w-]+$/.test(spreadsheetId)&&clientEmail&&privateKey?{spreadsheetId,sheetTitle:process.env.CAR_BOOKING_OSP_SHEET_TITLE || "BookingsOSP",clientEmail,privateKey:privateKey.replaceAll("\\n","\n")}:null;
}
export async function synchronizeOspSheet(config:OspSheetsConfig,rows:string[][],jobId:string,request:typeof fetch=fetch){
 const fetchJson=async(url:string,init:RequestInit={})=>{
  let response:Response;try{response=await request(url,{...init,signal:AbortSignal.timeout(45000)});}catch{throw new OspSyncError("NETWORK");}
  if(!response.ok)throw new OspSyncError(response.status===429?"RATE_LIMIT":response.status===401||response.status===403?"GOOGLE_ACCESS":"GOOGLE_HTTP");
  return response.json();
 };
 const issued=Math.floor(Date.now()/1000),encode=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString("base64url");
 const unsigned=`${encode({alg:"RS256",typ:"JWT"})}.${encode({iss:config.clientEmail,scope:"https://www.googleapis.com/auth/spreadsheets",aud:"https://oauth2.googleapis.com/token",iat:issued,exp:issued+3600})}`;
 let assertion:string;try{assertion=`${unsigned}.${sign("RSA-SHA256",Buffer.from(unsigned),config.privateKey).toString("base64url")}`;}catch{throw new OspSyncError("CREDENTIAL_CONFIG");}
 const auth=await fetchJson("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion}).toString()});
 if(typeof auth.access_token!=="string"||!auth.access_token)throw new OspSyncError("GOOGLE_ACCESS");
 const base=`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}`,headers={Authorization:`Bearer ${auth.access_token}`,"Content-Type":"application/json"};
 const metadata=await fetchJson(`${base}?fields=sheets.properties`,{headers});
 const sheets=metadata.sheets as {properties:{sheetId:number;title:string;gridProperties:{rowCount:number;columnCount:number}}}[];
 const target=sheets.find(sheet=>sheet.properties.title===config.sheetTitle);if(!target)throw new OspSyncError("SHEET_NOT_FOUND");
 const range=`'${config.sheetTitle.replaceAll("'","''")}'`;
 const existing=await fetchJson(`${base}/values/${encodeURIComponent(range)}?valueRenderOption=FORMULA`,{headers});
 const plan=planOspSheet(existing.values ?? [],rows),backup=`${config.sheetTitle.slice(0,55)}_backup_${jobId}`;
 const requests:unknown[]=[];
 if(!sheets.some(sheet=>sheet.properties.title===backup))requests.push({duplicateSheet:{sourceSheetId:target.properties.sheetId,newSheetName:backup}});
 if(target.properties.gridProperties.rowCount<plan.values.length || target.properties.gridProperties.columnCount<19)requests.push({updateSheetProperties:{properties:{sheetId:target.properties.sheetId,gridProperties:{rowCount:Math.max(target.properties.gridProperties.rowCount,plan.values.length),columnCount:Math.max(target.properties.gridProperties.columnCount,19)}},fields:"gridProperties.rowCount,gridProperties.columnCount"}});
 requests.push({updateCells:{range:{sheetId:target.properties.sheetId,startRowIndex:0,endRowIndex:Math.max(plan.values.length,(existing.values ?? []).length),startColumnIndex:0,endColumnIndex:19},rows:plan.values.map(row=>({values:row.map(value=>({userEnteredValue:{stringValue:value}}))})),fields:"userEnteredValue"}});
 await fetchJson(`${base}:batchUpdate`,{method:"POST",headers,body:JSON.stringify({requests})});
 return {rows:rows.length,manualRows:plan.manualRows,duplicatesRemoved:plan.duplicatesRemoved,backup};
}
