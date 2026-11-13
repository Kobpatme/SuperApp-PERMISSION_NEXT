import { execFileSync, spawn } from "node:child_process";
import { copyFile, mkdir, mkdtemp, symlink } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
const root=process.cwd(),target=await mkdtemp(resolve(".data/permission-out-build-"));
const names=execFileSync("git",["ls-files","-z","--cached","--others","--exclude-standard"],{encoding:"utf8",windowsHide:true}).split("\0").filter(Boolean);
const rootFiles=new Set(["package.json","package-lock.json","tsconfig.json","next.config.ts","next-env.d.ts","postcss.config.mjs","eslint.config.mjs","vitest.config.mts","AGENTS.md"]);
for(const name of new Set([...names,"src/generated/build-info.json"])) {
  if(!rootFiles.has(name)&&!/^(src|public|tests|scripts|mods|supabase)\//.test(name))continue;
  const destination=join(target,name);await mkdir(dirname(destination),{recursive:true});await copyFile(resolve(root,name),destination);
}
await symlink(resolve(root,"node_modules"),join(target,"node_modules"),process.platform==="win32"?"junction":"dir");
const env={...process.env,NODE_ENV:"production",NEXT_TELEMETRY_DISABLED:"1"};
for(const key of Object.keys(env))if(/DATABASE|SECRET|TOKEN|PASSWORD|API_KEY|SUPABASE|NAS_|GRAPH_|MICROSOFT_/i.test(key))delete env[key];
const child=spawn(process.execPath,[resolve(root,"node_modules/next/dist/bin/next"),"build","--webpack"],{cwd:target,env,stdio:"inherit",windowsHide:true});
const code=await new Promise(done=>child.on("exit",code=>done(code??1)));
console.log(`Isolated build: ${target}`);process.exitCode=code;
