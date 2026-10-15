import { cp, mkdir, readFile, writeFile, symlink, access } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
const root=process.cwd(), directory=resolve(".data/duct-rental-browser"), current=resolve(directory,"current"), baseline=resolve(directory,"baseline"), python=process.env.DUCT_RENTAL_TEST_PYTHON || (process.platform === "win32" ? "python" : "python3");
await mkdir(current,{recursive:true});await mkdir(baseline,{recursive:true});
for(const item of ["src","public","mods","scripts","tests"]) await cp(resolve(item),resolve(current,item),{recursive:true});
for(const file of ["package.json","package-lock.json","tsconfig.json","next.config.ts","next-env.d.ts"]) await cp(resolve(file),resolve(current,file));
const archive=spawnSync("git",["archive","--format=tar","5f32a111"],{cwd:root,maxBuffer:100*1024*1024});if(archive.status!==0)throw new Error("Baseline archive failed");
const extract=spawnSync(python,["-c","import io,sys,tarfile,pathlib; root=pathlib.Path(sys.argv[1]).resolve(); archive=tarfile.open(fileobj=io.BytesIO(sys.stdin.buffer.read())); members=archive.getmembers(); assert all(not m.issym() and not m.islnk() and (root/pathlib.Path(m.name)).resolve().is_relative_to(root) for m in members); archive.extractall(root,members=members,filter='data')",baseline],{input:archive.stdout});if(extract.status!==0)throw new Error("Safe baseline extraction failed");
// Enable lifecycle only in the isolated UI fixture copy; real target stays default-disabled/development.
const manifest=resolve(current,"src/modules/duct-rental/manifest.ts"), original=await readFile(manifest,"utf8");if(!original.includes('lifecycle: "development"'))throw new Error("Expected closed target lifecycle");await writeFile(manifest,original.replace('lifecycle: "development"','lifecycle: "active"'));
for(const project of [current,baseline]){
 try{await access(resolve(project,"node_modules"));}catch{await symlink(resolve(root,"node_modules"),resolve(project,"node_modules"),process.platform === "win32" ? "junction" : "dir");}
 const config=resolve(project,"next.config.ts"), text=await readFile(config,"utf8");await writeFile(config,text.replace("const nextConfig: NextConfig = {",`const nextConfig: NextConfig = {\n  turbopack: { root: ${JSON.stringify(root.replaceAll("\\","/"))} },`));
 const generated=spawnSync(process.execPath,["scripts/write-build-info.mjs"],{cwd:project,stdio:"inherit"});if(generated.status!==0)throw new Error("Fixture build metadata failed");
}
console.log("Prepared current UI fixture and immutable pre-module baseline; no credentials copied into projects");
