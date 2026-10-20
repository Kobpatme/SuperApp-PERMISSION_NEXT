const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');
const crypto = require('node:crypto');

const mode = process.argv[2] === 'start' ? 'start' : 'dev';
const projectRoot = path.resolve(__dirname, '..');
const children = [];
let shuttingDown = false;

if (!process.env.PERMISSION_NAS_BRIDGE_SECRET) {
  process.env.PERMISSION_NAS_BRIDGE_SECRET = crypto.randomBytes(32).toString('hex');
}

function launch(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit',
    windowsHide: true,
    ...options
  });
  children.push(child);
  return child;
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exitCode = exitCode;
}

function bridgeIsReady() {
  const baseUrl = process.env.PERMISSION_NAS_BRIDGE_URL || 'http://127.0.0.1:8766';
  const url = new URL('/api/nas/building-documents?nameTh=__bridge_probe__', baseUrl);
  return new Promise(resolve => {
    const request = http.get(url, { headers: {
      'x-permission-bridge-secret': process.env.PERMISSION_NAS_BRIDGE_SECRET,
      'x-permission-actor-id': 'system-health-check'
    } }, response => {
      response.resume();
      resolve(response.headers['x-permission-nas-bridge'] === '1');
    });
    request.setTimeout(800, () => request.destroy());
    request.on('error', () => resolve(false));
  });
}

async function main() {
  const useExternalBridge = process.env.PERMISSION_NAS_BRIDGE_EXTERNAL === '1';
  if (!useExternalBridge && !(await bridgeIsReady())) {
    const bridge = launch(process.execPath, [path.join('mods', 'permission-next', 'dev-server.js')]);
    bridge.on('exit', code => {
      if (!shuttingDown && code && code !== 0) {
        console.error(`Permission NAS bridge stopped with exit code ${code}.`);
      }
    });
  }

  const nextBin = require.resolve('next/dist/bin/next');
  const next = launch(process.execPath, mode === 'dev' ? [nextBin, mode, '--hostname', '127.0.0.1'] : [nextBin, mode]);
  next.on('exit', code => shutdown(code || 0));
}

main().catch(error => {
  console.error(error);
  shutdown(1);
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('exit', () => {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
});
