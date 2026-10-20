import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
await mkdir(".data/duct-import-checks",{recursive:true});
const directory=await mkdtemp(resolve(".data/duct-import-checks/run-"));
const original=JSON.parse(await readFile("tests/fixtures/metrix-import/crosswalk.json","utf8"));
async function run(crosswalk, extra=[]){
 const file=join(directory,`crosswalk-${crypto.randomUUID()}.json`), report=join(directory,`report-${crypto.randomUUID()}.json`);
 await writeFile(file,JSON.stringify(crosswalk));
 const child=spawnSync(process.execPath,["scripts/duct-rental-import-dry-run.mjs","--source","tests/fixtures/metrix-import/source.json","--crosswalk",file,"--file-root","tests/fixtures/metrix-golden","--out",report,...extra],{encoding:"utf8"});
 return {status:child.status,report:child.status===0||child.status===2?JSON.parse(await readFile(report,"utf8")):undefined};
}
test("offline CLI reconciles synthetic rows without database writes",async()=>{const result=await run(original);assert.equal(result.status,0);assert.equal(result.report.writesPerformed,0);assert.equal(result.report.totals.annualKeptCost,"0.30");});
test("offline CLI quarantines checksum mismatches",async()=>{const input=structuredClone(original);input.files["FIXTURE-FILE-1"].checksumSha256="0".repeat(64);const result=await run(input);assert.equal(result.status,2);assert.ok(result.report.issues.some(item=>item.code==="BINARY_INTEGRITY_MISMATCH"));assert.equal(result.report.readyForReviewedMigration,false);});
test("offline CLI rejects mismatched binary content types",async()=>{const input=structuredClone(original);input.files["FIXTURE-FILE-1"].mediaType="application/pdf";const result=await run(input);assert.equal(result.status,2);assert.ok(result.report.issues.some(item=>item.code==="BINARY_MEDIA_TYPE_MISMATCH"));});
test("offline CLI refuses file paths outside the approved binary root",async()=>{const input=structuredClone(original);input.files["FIXTURE-FILE-1"].relativePath="../outside.png";assert.notEqual((await run(input)).status,0);});
test("offline CLI has no apply mode",async()=>{assert.notEqual((await run(original,["--apply","true"])).status,0);});
