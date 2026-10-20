import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { DuctError, transaction, type DuctContext } from "./transaction";

function pathFor(key: string) {
  if (!/^(documents|signatures)\/[0-9a-f-]{36}\.(pdf|png|jpg|kmz|kml|dwg|dxf)$/.test(key)) throw new DuctError("STORAGE_KEY", "เส้นทางไฟล์ไม่ถูกต้อง");
  const configured = process.env.DUCT_RENTAL_STORAGE_DIR?.trim();
  if (!configured && process.env.NODE_ENV === "production") throw new DuctError("STORAGE_UNAVAILABLE", "ยังไม่ได้ตั้งค่าที่เก็บเอกสารส่วนตัว", 503);
  const root = resolve(/* turbopackIgnore: true */ configured || ".data/duct-rental-private"), target = resolve(root, key), inside = relative(root, target);
  if (!inside || inside.startsWith("..") || isAbsolute(inside)) throw new DuctError("STORAGE_KEY", "เส้นทางไฟล์ไม่ถูกต้อง");
  return target;
}
export function checksum(bytes: Uint8Array) { return createHash("sha256").update(bytes).digest("hex"); }
export async function putPrivateFile(key: string, bytes: Uint8Array) { const target = pathFor(key); await mkdir(dirname(target), { recursive: true }); await writeFile(target, bytes, { flag: "wx" }); }
export async function readPrivateFile(key: string, expected: string) {
  const bytes = await readFile(/* turbopackIgnore: true */ pathFor(key));
  if (checksum(bytes) !== expected) throw new DuctError("CHECKSUM", "ไฟล์เสียหาย กรุณาติดต่อผู้ดูแล", 409);
  return bytes;
}
export async function removeOrphanFile(key: string, context: DuctContext) {
  // A lost COMMIT response is ambiguous. Delete only after a new DB transaction
  // proves no committed metadata references this key. On DB/authorization failure
  // retain a private orphan for the reviewed reconciliation tool.
  try {
    const committed = await transaction(context, async tx => {
      const [row] = await tx.execute<{ committed: boolean }>(sql`select public.duct_rental_file_committed(${key}) as committed`);
      return row?.committed ?? true;
    });
    if (!committed) await unlink(pathFor(key)).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
  } catch { /* Keep the private file when commit status cannot be established. */ }
}
