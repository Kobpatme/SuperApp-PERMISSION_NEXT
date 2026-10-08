import { ospColumns } from "./car-booking-osp";
export class OspSyncError extends Error {constructor(readonly code:string){super(code);}}
export function planOspSheet(existing:unknown[][],generated:string[][]){
 if(existing.length&&existing[0].some(value=>String(value)!=="")&&!ospColumns.every((value,i)=>String(existing[0][i] ?? "")===value))throw new OspSyncError("HEADER_MISMATCH");
 if(existing[0]?.slice(19).some(value=>value!=null&&String(value)!==""))throw new OspSyncError("EXTRA_COLUMNS");
 const sap=new Map<string,string>(),managed=new Set(generated.map(row=>row[0])),manual:string[][]=[];
 const unknownIds=new Set<string>(),existingManaged=new Set<string>();let duplicates=0,managedCount=0;
 for(const raw of existing.slice(1)){
  if(raw.slice(19).some(value=>value!=null&&String(value)!==""))throw new OspSyncError("EXTRA_COLUMNS");
  const row=Array.from({length:19},(_,i)=>String(raw[i] ?? ""));if(row.every(value=>value===""))continue;
  const id=row[0],reference=row[12];
  if(managed.has(id)){managedCount++;existingManaged.add(id);}
  if((!managed.has(id)&&row.some(value=>value.startsWith("=")))||reference.startsWith("="))throw new OspSyncError("FORMULA_REVIEW");
  if(id&&reference&&reference!=="ไม่มี SAP"){
   if(sap.has(id)&&sap.get(id)!==reference)throw new OspSyncError("SAP_CONFLICT");sap.set(id,reference);
  }
  if(!managed.has(id)){
   if(id&&unknownIds.has(id)){duplicates++;continue;}if(id)unknownIds.add(id);manual.push(row);
  }
 }
 const seen=new Set<string>();
 const rows=generated.map(row=>{
  if(!row[0]||seen.has(row[0]))throw new OspSyncError("DUPLICATE_SOURCE");seen.add(row[0]);
  const copy=[...row];copy[12]=sap.get(row[0]) ?? row[12];return copy;
 });
 for(const row of manual)if(row[0]&&sap.has(row[0]))row[12]=sap.get(row[0])!;
 duplicates+=managedCount-existingManaged.size;
 const values=[[...ospColumns],...rows,...manual];
 if(values.some(row=>row.some(cell=>cell.length>50000)))throw new OspSyncError("CELL_TOO_LARGE");
 return {values,manualRows:manual.length,duplicatesRemoved:duplicates};
}
