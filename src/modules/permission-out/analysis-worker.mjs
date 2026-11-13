import { parentPort, workerData } from "node:worker_threads";
import { analyzeRoutes } from "./geometry.mjs";
import {lineLength} from "./geometry.mjs";
import {csvDirectMatchRows,csvDirectOverlapMeters,exportTrimmedMaxi,buildExportOverlapGroups} from "./source-export.mjs";
try {
  let value;
  if(workerData.op==='groups') {const groups=buildExportOverlapGroups(workerData.lines,workerData.threshold,workerData.interval);value=workerData.lines.map(line=>groups.get(line)||'');}
  else if(workerData.op==='pair') {
    const matches=await csvDirectMatchRows(workerData.lines,workerData.threshold,workerData.selectedKeys?new Set(workerData.selectedKeys):null);
    if(workerData.trim){value=[];for(const row of matches){if(!row.maxiLine)value.push(row);else if(row.rd03Line)for(const maxiLine of exportTrimmedMaxi(row.maxiLine,[row.rd03Line],workerData.threshold)){const overlapMeters=csvDirectOverlapMeters(row.rd03Line,maxiLine,workerData.threshold),length=lineLength(row.rd03Line.coords);value.push({...row,maxiLine,overlapMeters,overlapPercent:length?overlapMeters/length*100:0});if(value.length>50000)throw new Error('ผลจับคู่เกิน 50,000 รายการ กรุณากรองข้อมูล');}}}else value=matches;
  }else value=analyzeRoutes(workerData.base,workerData.compare,workerData.options);
  parentPort.postMessage({value});
}
catch(error) { parentPort.postMessage({ error: /[ก-๙]/.test(error.message) ? error.message : "วิเคราะห์ไม่สำเร็จ กรุณาตรวจสอบข้อมูล" }); }
