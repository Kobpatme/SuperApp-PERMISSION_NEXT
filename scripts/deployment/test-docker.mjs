// Always creates a uniquely named, disposable Compose project. Never resets the
// normal developer project/database and never inherits real database settings.
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

const project = `superapp-acceptance-${randomBytes(6).toString("hex")}`;
// The checked-in fixture has plain NAME=value lines, not secret/multiline data.
// Keep this launcher dependency-free so it also runs in the Docker CLI CI image.
const fixture = Object.fromEntries(readFileSync(".env.example", "utf8").split(/\r?\n/)
  .filter(line => /^[A-Z][A-Z0-9_]*=/.test(line))
  .map(line => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]));
function git(...args) {
  try { return execFileSync("git", args, { encoding: "utf8", windowsHide: true }).trim(); } catch { return ""; }
}
const env = { ...process.env, ...fixture, COMPOSE_PROFILES: "", COMPOSE_PROJECT_NAME: project,
  APP_IMAGE: `${project}:app`, TOOLS_IMAGE: `${project}:tools`,
  APP_HOST_PORT: "0", APP_COMMIT_SHA: process.env.CI_COMMIT_SHA || git("rev-parse", "HEAD"), APP_BRANCH: process.env.CI_COMMIT_REF_NAME || git("branch", "--show-current") };
const common = ["compose", "-f", "docker-compose.yml", "--env-file", ".env.example", "-p", project];
function docker(args, capture = false) {
  return execFileSync("docker", args, { env, windowsHide: true, stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit", encoding: "utf8" });
}
let started = false;
try {
  docker(["info"], true);
  docker([...common, "config", "--quiet"]);
  started = true;
  docker([...common, "up", "--build", "--wait", "--wait-timeout", "300", "app"]);
  docker([...common, "--profile", "verification", "run", "--no-deps", "--build", "--rm", "verify"]);
  docker([...common, "exec", "-T", "app", "node", "-e", `
    const fs=require('node:fs');
    if(process.getuid()===0)throw Error('Root app user');
    for(const name of ['DATABASE_URL_MIGRATE','POSTGRES_PASSWORD','INITIAL_ADMIN_PASSWORD'])if(process.env[name])throw Error('Operator environment in app');
    for(const path of ['.env','.env.local','.git','.data','node_modules/drizzle-kit'])if(fs.existsSync(path))throw Error('Unexpected image file: '+path);
    for(const path of ['src/modules/duct-rental/assets/Sarabun-Regular.ttf','src/modules/duct-rental/assets/nt-duct-rental.pdf'])if(!fs.existsSync(path))throw Error('Missing PDF asset');
    console.log('Non-root app, runtime-only environment and required PDF assets verified');
  `]);
  const id = docker([...common, "ps", "-q", "app"], true).trim();
  const health = docker(["inspect", "--format", "{{.State.Health.Status}}", id], true).trim();
  if (health !== "healthy") throw new Error("App container healthcheck is not healthy");
  docker(["image", "ls", env.APP_IMAGE, "--format", "{{.Repository}}:{{.Tag}} {{.Size}}"]);
  docker(["image", "inspect", "--format", "Image bytes: {{.Size}}", env.APP_IMAGE]);
  console.log("Disposable Docker acceptance checks passed.");
} catch (error) {
  console.error(error.code === "ENOENT" ? "Docker CLI is not installed or not in PATH; container checks were not run." : "Docker acceptance did not pass; inspect the preceding check output.");
  process.exitCode = 1;
} finally {
  if (started && /^superapp-acceptance-[a-f0-9]{12}$/.test(project)) {
    try { docker([...common, "down", "--volumes", "--remove-orphans"]); }
    catch { console.error(`Fixture cleanup incomplete; inspect Compose project ${project}.`); process.exitCode = 1; }
  }
}
