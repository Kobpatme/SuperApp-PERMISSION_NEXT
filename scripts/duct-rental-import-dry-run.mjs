// Offline review tool: no database imports, credentials, network or apply mode.
import { readFile, mkdir, writeFile, stat, realpath } from "node:fs/promises";
import { resolve, dirname, relative, isAbsolute } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { verifyImportBinary } from "./duct-rental-import-binary.mjs";
const args = process.argv.slice(2), options = {};
for (let i = 0; i < args.length; i += 2) { if (!["--source", "--crosswalk", "--file-root", "--out"].includes(args[i]) || !args[i + 1]) throw new Error("Use --source JSON --crosswalk JSON --file-root DIRECTORY --out REPORT.json; dry run only"); options[args[i]] = args[i + 1]; }
if (!["--source", "--crosswalk", "--file-root", "--out"].every(key => options[key])) throw new Error("All four dry-run arguments are required");
async function json(path) { if ((await stat(path)).size > 25 * 1024 * 1024) throw new Error("Input JSON exceeds 25 MB"); return JSON.parse(await readFile(path, "utf8")); }
const source = await json(options["--source"]), crosswalk = await json(options["--crosswalk"]), root = await realpath(resolve(options["--file-root"]));
const integrity = [];
for (const [id, file] of Object.entries(crosswalk.files || {})) {
 const target = resolve(root, file.relativePath), nested = relative(root, target);
 if (nested.startsWith("..") || isAbsolute(nested)) throw new Error("File manifest escapes its approved root");
 try { const canonical = await realpath(target), inside = relative(root, canonical); if (inside.startsWith("..") || isAbsolute(inside)) throw new Error("File symlink escapes root"); const size = (await stat(canonical)).size; if (!size || size > 26214400) throw new Error("Invalid binary size"); const bytes = await readFile(canonical); if (!await verifyImportBinary(bytes,file.mediaType)) integrity.push({ table: "request_files", sourceId: id, code: "BINARY_MEDIA_TYPE_MISMATCH" }); if (size !== file.sizeBytes || createHash("sha256").update(bytes).digest("hex") !== file.checksumSha256) integrity.push({ table: "request_files", sourceId: id, code: "BINARY_INTEGRITY_MISMATCH" }); } catch { integrity.push({ table: "request_files", sourceId: id, code: "BINARY_UNAVAILABLE" }); }
}
// Compile module-local pure TS to an ignored review workspace. Never alter source files.
const build = resolve(".data/duct-import-runtime"), files = ["domain/import-planner", "domain/money", "domain/source-policy", "domain/workflow", "domain/cables", "schemas/design"];
for (const file of files) { const input = await readFile(`src/modules/duct-rental/${file}.ts`, "utf8"), output = ts.transpileModule(input, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replace(/from "(\.\.?\/[^".]+)"/g, 'from "$1.mjs"'); const target = resolve(build, `${file}.mjs`); await mkdir(dirname(target), { recursive: true }); await writeFile(target, output); }
const { planDuctImport } = await import(`${pathToFileURL(resolve(build, "domain/import-planner.mjs")).href}?run=${randomUUID()}`), report = planDuctImport(source, crosswalk);
report.issues.push(...integrity); if (integrity.length) report.readyForReviewedMigration = false;
const out = resolve(options["--out"]); await mkdir(dirname(out), { recursive: true }); await writeFile(out, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ mode: report.mode, writesPerformed: report.writesPerformed, counts: report.counts, totals: report.totals, issues: report.issues.length, warnings: report.warnings.length, readyForReviewedMigration: report.readyForReviewedMigration }));
if (report.issues.length) process.exitCode = 2;
