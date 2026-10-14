import { readFileSync } from "node:fs";
import { writeGolden } from "./write-metrix-golden.mjs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
const root = resolve(process.argv[2] || "_discovery_sources/METRIX");
const dependencyRoot = resolve(process.argv[3] || root);
const sha = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (sha !== "f87220bf94b765e4896388632c3dbeabb5286510") throw new Error("Unexpected source SHA");
const requireSource = createRequire(resolve(dependencyRoot, "package.json"));
const zodVersion = requireSource("zod/package.json").version;
if (!zodVersion.startsWith("4.")) throw new Error("Golden validation requires source Zod 4, not target Zod 3");
const file = "schemas/ductRentalSchema.ts";
const text = readFileSync(resolve(root, file), "utf8").replace(/\r\n/g, "\n");
const frozen = execFileSync("git", ["-C", root, "show", `${sha}:${file}`], { encoding: "utf8" }).replace(/\r\n/g, "\n");
if (text !== frozen) throw new Error("Source schema differs from frozen commit");
const context = vm.createContext({ exports: {}, require: name => {
  if (name !== "zod") throw new Error("Only the pure Zod dependency may be loaded");
  return requireSource(name);
} });
vm.runInContext(ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context, { timeout: 1000 });
const { DuctRentalSchema, InstallDetailSchema } = context.exports;
const design = { projectName: "โครงการทดสอบ", routeName: "เส้นทางทดสอบ", ownerDuct: "NT", routeDetail: "เส้นทาง", jobType: "Network", serviceCenter: "BKK 1", cableType: "ADSS", fiberType: "12 Core", diameter: 8.7, distance: 1, startCoords: "13,100", endCoords: "14,101", district: "เขตทดสอบ", province: "จังหวัดทดสอบ" };
const install = { actualStartCoords: "13,100", actualEndCoords: "14,101", actualDistance: 1, markLength: "ML", installDate: "2026-10-10" };
const fixtures = [];
for (const [operation, schema, base, overrides] of [
  ["design", DuctRentalSchema, design, [{}, { cableCount: "" }, { cableCount: null }, { cableCount: 1 }, { cableCount: 0 }, { cableCount: 1.5 }, { distance: .01 }, { distance: .009 }, { diameter: 8.701 }, { diameter: 8.702 }, { fiberType: "2 Core" }, { projectName: "" }, { projectName: " " }]],
  ["install", InstallDetailSchema, install, [{}, { actualDistance: .01 }, { actualDistance: .009 }, { markLength: "" }, { pipeCount: -1 }, { installDate: "invalid" }]],
]) for (const patch of overrides) {
  const input = { ...base, ...patch }, result = schema.safeParse(input);
  fixtures.push({ rule: "RULE-002", operation, input, expected: result.success ? { success: true, data: result.data } : { success: false, paths: result.error.issues.map(issue => issue.path.join(".")) } });
}
const cableTypes = context.exports.CABLE_TYPE_OPTIONS;
const fibers = [...new Set(cableTypes.flatMap(type => context.exports.getFiberTypeOptions(type).map(item => item.fiberType)))];
for (const cableType of cableTypes) for (const fiberType of fibers) {
 const diameter = context.exports.getDiameterForCable(cableType,fiberType);
 for (const delta of diameter === undefined ? [0] : [-0.002,-0.001,0,0.001,0.002]) {
  const input={...design,cableType,fiberType,diameter:(diameter ?? 8.7)+delta},result=DuctRentalSchema.safeParse(input);
  fixtures.push({rule:"RULE-003",operation:"design",matrix:{cableType,fiberType,delta},input,expected:result.success?{success:true,data:result.data}:{success:false,paths:result.error.issues.map(issue=>issue.path.join("."))}});
 }
}
writeGolden("tests/fixtures/metrix-golden/validation.json", { sourceSha: sha, sourceFile: file, sourceZodVersion: zodVersion, method: "Original frozen source schema executed with source Zod 4 and synthetic inputs; target uses Zod 3", fixtures });
console.log(JSON.stringify({ sourceSha: sha, sourceZodVersion: zodVersion, fixtures: fixtures.length }));
