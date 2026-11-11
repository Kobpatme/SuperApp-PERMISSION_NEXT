import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("platform field opt-in", () => {
  it("opts admin text and select fields in without adopting hidden or checkbox controls", () => {
    for (const path of ["src/app/(platform)/admin/page.tsx", "src/components/admin-workspace.tsx", "src/components/admin-workspace-ux.tsx"]) {
      const source = read(path);
      const controls = source.match(/<(?:input|select)\b[^>]*>/g) ?? [];
      for (const control of controls) {
        if (/type="(?:hidden|checkbox|radio|file)"/.test(control)) {
          expect(control).not.toContain("ui-building-field");
        } else {
          expect(control).toContain("ui-building-field");
        }
      }
    }
  });

  it("keeps login and password field opt-in alongside existing class", () => {
    expect(read("src/components/login-form.tsx")).toContain('className="ui-field-control ui-building-field"');
    expect(read("src/components/change-password-form-ux.tsx")).toContain('className="ui-field-control ui-building-field"');
    expect(read("src/components/auth/password-field.tsx")).toContain("<input {...input}");
  });
});
