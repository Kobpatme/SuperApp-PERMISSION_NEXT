import { readFile } from "node:fs/promises";
import { parse } from "dotenv";
export async function poTestEnvironment() {
  const ci = process.env.PO_TEST_DATABASE_URL;
  if (ci) {
    const url = new URL(ci);
    if (!["127.0.0.1", "localhost"].includes(url.hostname) || url.pathname !== "/permission_next_po_test") throw new Error("Dedicated loopback PO fixture required");
    return { DATABASE_URL: ci, DATABASE_URL_MIGRATE: ci };
  }
  return parse(await readFile(".env.local", "utf8"));
}
