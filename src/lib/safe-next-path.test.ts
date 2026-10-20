import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("keeps internal paths and query strings", () => {
    expect(safeNextPath("/buildings?status=active")).toBe("/buildings?status=active");
  });

  it("rejects external and malformed paths", () => {
    expect(safeNextPath("https://example.com")).toBe("/");
    expect(safeNextPath("//example.com")).toBe("/");
    expect(safeNextPath("/\\example.com")).toBe("/");
  });
  it("rejects control characters that browsers normalize into external URLs",()=>{
    for(const path of ["/\n/evil.example","/\r/evil.example","/\t/evil.example","/work\u0000","/work\u007f"]){expect(safeNextPath(path)).toBe("/");expect(new URL(safeNextPath(path),"http://localhost:3100").origin).toBe("http://localhost:3100");}
  });
});
