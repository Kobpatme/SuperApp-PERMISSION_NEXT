import { build } from "esbuild";
import { createServer } from "node:http";
import { resolve } from "node:path";
const bundle = await build({ entryPoints: ["tests/fixtures/system-review-browser.tsx"], bundle: true, write: false, platform: "browser", format: "iife", jsx: "automatic", alias: { "next/link": resolve("tests/fixtures/review-browser-router.tsx"), "next/navigation": resolve("tests/fixtures/review-browser-router.tsx"), "@": resolve("src") }, plugins: [{ name: "fixture-css-boundary", setup(build) { build.onLoad({ filter: /\.css$/ }, () => ({ contents: "export default new Proxy({}, {get:(_,key)=>String(key)})", loader: "js" })); } }] });
const js = bundle.outputFiles.find(file => file.path.endsWith(".js")) ?? bundle.outputFiles[0];
const server = createServer((request, response) => {
  if (request.url === "/app.js") { response.setHeader("Content-Type", "application/javascript"); response.end(js.contents); return; }
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.end('<!doctype html><html lang="th"><meta charset="utf-8"><title>ทดสอบรายการครบ 620 รายการ</title><style>body{font:16px sans-serif;margin:24px;color:navy}button,input,select{font:inherit;margin:4px;padding:8px}table{border-collapse:collapse;width:100%}td,th{padding:8px;border:1px solid silver}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden}nav{display:flex;gap:12px}main,section{margin-block:12px}</style><p>ข้อมูลจำลอง 620 รายการ · ทดสอบปฏิสัมพันธ์ของ component จริง ไม่ใช่ภาพยืนยันธีม</p><div id="root"></div><script src="/app.js"></script></html>');
});
server.listen(3215, "127.0.0.1", () => console.log("Review interaction fixture: http://127.0.0.1:3215"));
