import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

function storageRoot() {
  const configured = process.env.GUARANTEE_STORAGE_DIR?.trim();
  if (!configured && process.env.NODE_ENV === "production") throw new Error("GUARANTEE_STORAGE_DIR is required in production");
  return resolve(/* turbopackIgnore: true */ configured || ".data/guarantee-evidence");
}

function safePath(storageKey: string) {
  if (!storageKey || isAbsolute(storageKey) || storageKey.includes("..") || storageKey.includes("\\")) throw new Error("Invalid storage key");
  const root = storageRoot();
  const target = resolve(root, storageKey);
  const inside = relative(root, target);
  if (!inside || inside.startsWith("..") || isAbsolute(inside)) throw new Error("Storage path escapes configured root");
  return target;
}

export async function writeGuaranteeEvidence(storageKey: string, bytes: Uint8Array) {
  const target = safePath(storageKey);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes, { flag: "wx" });
}

export async function readGuaranteeEvidence(storageKey: string) {
  return readFile(/* turbopackIgnore: true */ safePath(storageKey));
}

export async function removeGuaranteeEvidence(storageKey: string) {
  await unlink(safePath(storageKey)).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
}
