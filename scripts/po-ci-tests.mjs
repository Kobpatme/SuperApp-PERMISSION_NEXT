import net from "node:net";
import { spawn } from "node:child_process";
if (process.env.GITLAB_CI !== "true") throw new Error("GitLab disposable service fixture only");
// GitLab's disposable PostgreSQL service is on its job network. Forward only
// this fixture service; production/database URLs are never consulted.
const sockets = new Set();
const server = net.createServer(socket => {
  const upstream = net.connect(5432, "postgres");
  for (const connection of [socket, upstream]) { sockets.add(connection); connection.on("close", () => sockets.delete(connection)); connection.on("error", () => { socket.destroy(); upstream.destroy(); }); }
  socket.pipe(upstream); upstream.pipe(socket);
});
await new Promise((resolve, reject) => { server.once("error", reject); server.listen(5432, "127.0.0.1", resolve); });
try {
  for (const script of ["test:po:import", "test:po:db", "test:po:excel"]) {
    const status = await new Promise((resolve, reject) => { const child = spawn("npm", ["run", script], { stdio: "inherit", env: process.env }); child.on("error", reject); child.on("close", resolve); });
    if (status !== 0) { process.exitCode = 1; break; }
  }
  if (!process.exitCode) {
    const status = await new Promise((resolve, reject) => { const child = spawn(process.execPath, ["scripts/system-review-test-db.mjs"], { stdio: "inherit", env: process.env }); child.on("error", reject); child.on("close", resolve); });
    if (status !== 0) process.exitCode = 1;
  }
} finally { for (const socket of sockets) socket.destroy(); await new Promise(resolve => server.close(resolve)); }
