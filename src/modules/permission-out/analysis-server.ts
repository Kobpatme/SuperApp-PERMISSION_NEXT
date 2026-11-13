import "server-only";
import { Worker } from "node:worker_threads";
import { resolve } from "node:path";
import type { RouteLine, Segment } from "./domain";
import type {MatchRow} from "./source-export.mjs";
let active = 0;
async function inWorker<T>(workerData:Record<string,unknown>):Promise<T> {
  if (active >= 2) throw new Error("มีงานวิเคราะห์หรือส่งออกกำลังทำงานอยู่ กรุณาลองอีกครั้ง");
  active++;
  try {
    return await new Promise<T>((done,fail) => {
      const worker = new Worker(resolve(process.cwd(),"src/modules/permission-out/analysis-worker.mjs"), { workerData, resourceLimits: {maxOldGenerationSizeMb:256,maxYoungGenerationSizeMb:32} });
      let settled = false;
      const finish = (error?: Error, result?: T) => { if(settled)return;settled=true;clearTimeout(timer);void worker.terminate();if(error)fail(error);else done(result!); };
      const timer = setTimeout(() => finish(new Error("วิเคราะห์นานเกินกำหนด กรุณาแบ่งข้อมูลหรือเพิ่มระยะสุ่ม")),60000);
      worker.once("message", (value: {value?:T;error?:string}) => value.error ? finish(new Error(value.error)) : finish(undefined,value.value));
      worker.once("error", () => finish(new Error("วิเคราะห์ไม่สำเร็จ กรุณาตรวจสอบข้อมูล")));
      worker.once("exit", code => { if(!settled)finish(new Error(`วิเคราะห์ไม่สำเร็จ (${code})`)); });
    });
  } finally { active--; }
}
export const analyzeInWorker=(base:RouteLine[],compare:RouteLine[],options:{threshold:number;interval:number;dedupe:boolean})=>inWorker<Segment[]>({op:"analysis",base,compare,options});
export const matchSourcesInWorker=(lines:RouteLine[],threshold:number,selectedKeys?:Set<string>,trim=false)=>inWorker<MatchRow[]>({op:"pair",lines,threshold,selectedKeys:selectedKeys?[...selectedKeys]:null,trim});
export const groupSegmentsInWorker=(lines:RouteLine[],threshold:number,interval:number)=>inWorker<string[]>({op:"groups",lines,threshold,interval});
