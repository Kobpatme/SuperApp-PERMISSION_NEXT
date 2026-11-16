import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { capabilities } from "@/lib/module-registry";

const prefixes = ["work", "building", "guarantee", "kpi", "core", "activity", "notification", "car_booking", "duct_rental", "po_tracking", "permission_out", "site_facility"];
const codePattern = `((?:${prefixes.join("|")})\\.[a-z0-9_]+\\.[a-z0-9_]+)`;
/** Only strings passed to an authorization helper are permission checks; audit/log names are ignored. */
const guards = ["assertAuthorized(", "isAuthorized(", "requirePermission(", "has_scoped_permission("];
/**
 * 0068 maps these legacy internal labels onto site_facility.* capabilities inside
 * public.pout_access(), so they stay grantable through the site_facility catalog.
 */
const legacyAliases = new Set(["permission_out.site.read", "permission_out.site.update", "permission_out.comment.create", "permission_out.opex.read"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", ".next", ".data"].includes(entry.name)) walk(path, out);
    } else if (/\.tsx?$/.test(entry.name) && !/\.test\.|\.spec\./.test(entry.name)) {
      out.push(path);
    }
  }
  return out;
}

function enforcedCodes(source: string) {
  const found: string[] = [];
  for (const guard of guards) {
    const guardPattern = new RegExp(`${guard.replace(/[()]/g, "\\$&")}[\\s\\S]{0,240}?"${codePattern}"`, "g");
    for (const match of source.matchAll(guardPattern)) found.push(match[1]);
  }
  // Codes embedded in SQL predicates are enforced too, but only where a policy/guard reads pout_access-style helpers.
  for (const match of source.matchAll(new RegExp(`(?:pout_access|pout_domain_access|pout_dataset_permission|pout_version_permission|has_scoped_permission)\\(\\s*'${codePattern}'`, "g"))) {
    found.push(match[1]);
  }
  return found;
}

describe("capability enforcement coverage", () => {
  it("only enforces capability codes the admin catalog can grant", () => {
    const known = new Set(capabilities.map((capability) => capability.code));
    const used = new Map<string, string[]>();
    for (const file of walk("src")) {
      for (const code of enforcedCodes(readFileSync(file, "utf8"))) {
        used.set(code, [...new Set([...(used.get(code) ?? []), file])]);
      }
    }
    const missing = [...used.keys()].filter((code) => !known.has(code) && !legacyAliases.has(code)).sort();
    const byModule = Object.entries([...used.keys()].reduce<Record<string, number>>((acc, code) => {
      const moduleId = code.split(".")[0];
      acc[moduleId] = (acc[moduleId] ?? 0) + 1;
      return acc;
    }, {}));
    console.log(JSON.stringify({ catalog: known.size, enforced: used.size, byModule, missing, legacyMapped: [...used.keys()].filter((code) => legacyAliases.has(code)) }, null, 2));
    expect(missing).toEqual([]);
  });
});
