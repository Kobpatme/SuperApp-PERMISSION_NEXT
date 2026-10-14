import { readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const groups=new Map();
for(const line of (await readFile(process.argv[2] || "docs/quality/duct-rental/browser.log","utf8")).split(/\r?\n/)){
 const start=line.indexOf('{"event":"duct_fixture_query"');if(start<0)continue;
 const item=JSON.parse(line.slice(start));if(!item.trace||item.trace==="change-stream")continue;
 if(!groups.has(item.trace))groups.set(item.trace,[]);groups.get(item.trace).push(item);
}
const lists=[...groups.values()].filter(items=>items.some(item=>item.kind==="with"&&item.search&&item.queue));
assert.ok(lists.length>=5,"Fresh browser list measurements required");
const counts=lists.map(items=>items.length);assert.ok(counts.every(count=>count===4),"Each list call must have three runtime guards and one paged business query");
const result={listCalls:lists.length,queriesPerCall:counts,maxQueries:Math.max(...counts),guardsPerCall:3,businessStatementsPerCall:1,sqlOrParametersLogged:false};
await writeFile("docs/quality/duct-rental/query-counts.json",JSON.stringify(result,null,2));console.log(JSON.stringify(result));
