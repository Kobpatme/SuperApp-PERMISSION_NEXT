import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
const defaultSourceDir = "D:\\WebApp\\SLA_Preformance\\MAXIWA KPI";

type MaxiwaWorker = {
  fetch(request: Request, env: Record<string, string>): Promise<Response>;
};

let workerPromise: Promise<MaxiwaWorker> | undefined;
let envPromise: Promise<Record<string, string>> | undefined;

function sourceDir() {
  return process.env.MAXIWA_LEGACY_DIR || defaultSourceDir;
}

function parseEnvFile(text: string) {
  const env: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match || line.trim().startsWith("#")) continue;
    env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
  return env;
}

function loadLocalWorker() {
  workerPromise ??= import(
    /* webpackIgnore: true */ pathToFileURL(join(sourceDir(), "public", "_worker.js")).href
  ).then((module) => module.default as MaxiwaWorker);
  return workerPromise;
}

function loadLocalEnv() {
  envPromise ??= readFile(join(sourceDir(), ".dev.vars"), "utf8")
    .catch(() => "")
    .then((text) => ({
      CF_PAGES: "1",
      CF_PAGES_BRANCH: "workspace-local",
      CF_PAGES_COMMIT_SHA: "workspace-local",
      CF_PAGES_URL: "http://127.0.0.1:3100",
      ...parseEnvFile(text),
    }));
  return envPromise;
}

async function runLocalWorker(request: Request, path: string[], search: string, headers: Headers) {
  const target = new URL(`/api/${path.map(encodeURIComponent).join("/")}${search}`, "http://127.0.0.1");
  const workerRequest = new Request(target, {
    method: request.method,
    headers,
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
  });
  const [worker, env] = await Promise.all([loadLocalWorker(), loadLocalEnv()]);
  return worker.fetch(workerRequest, env);
}

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  if (!allowedMethods.has(request.method)) return new Response("Method not allowed", { status: 405 });
  if (!(await getCurrentUser())) return new Response("Unauthorized", { status: 401 });

  const { path } = await context.params;
  if (!path.length || path.some((part) => !/^[A-Za-z0-9._~-]+$/.test(part))) return new Response("Not found", { status: 404 });

  const incomingUrl = new URL(request.url);
  const headers = new Headers();
  for (const name of ["accept", "content-type", "x-session-empid", "x-session-id", "x-admin-empid"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const response = await (async () => {
    if (!process.env.MAXIWA_API_BASE) {
      return runLocalWorker(request, path, incomingUrl.search, headers);
    }

    const base = new URL(process.env.MAXIWA_API_BASE);
    if (!new Set(["http:", "https:"]).has(base.protocol)) throw new Error("Invalid MAXIWA API configuration");
    const target = new URL(path.map(encodeURIComponent).join("/"), base.href.endsWith("/") ? base : `${base.href}/`);
    target.search = incomingUrl.search;
    return fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(),
      redirect: "manual",
      cache: "no-store",
    });
  })().catch(() => null);
  if (!response) return Response.json({ error: "MAXIWA API is unavailable" }, { status: 503 });

  const responseHeaders = new Headers();
  responseHeaders.set("Content-Type", response.headers.get("content-type") || "application/json; charset=utf-8");
  responseHeaders.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, headers: responseHeaders });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
