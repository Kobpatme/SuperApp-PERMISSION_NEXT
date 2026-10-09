import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ductRentalCapabilities } from "../capabilities";

describe("duct rental permission catalog seed", () => {
  const migration = readFileSync("supabase/migrations/0029_duct_rental_catalog.sql", "utf8");
  it("registers exactly the assignable manifest codes and Thai labels", () => {
    const seeded = [...migration.matchAll(/\('(duct_rental\.[a-z0-9_]+\.[a-z_]+)','duct-rental'/g)].map(m => m[1]);
    expect(seeded.sort()).toEqual(ductRentalCapabilities.map(c => c.code).sort());
    for (const capability of ductRentalCapabilities) expect(migration).toContain(capability.labelTh);
  });
  it("keeps user activation explicit and existing module grants intact", () => {
    expect(migration).toContain("new.module_id in ('car-booking','duct-rental')");
    expect(migration).toContain("or new.code like 'duct_rental.%'");
    expect(migration).not.toContain("insert into public.user_role_assignments");
    expect(migration).toContain("on conflict(code) do update set description=excluded.description");
  });
});
