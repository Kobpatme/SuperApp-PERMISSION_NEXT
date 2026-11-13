import type { ModuleManifest, ModuleCapability } from "@/lib/module-contract";

const scopes = ["OWN", "TEAM", "SELECTED_TEAMS", "ALL"] as const;
export const permissionOutCapabilities: ModuleCapability[] = [
  ["module.view", "เข้าใช้งานวิเคราะห์เส้นทางและไซต์", "normal"],
  ["project.manage", "สร้างและจัดการโครงการวิเคราะห์", "normal"],
  ["analysis.run", "วิเคราะห์เปรียบเทียบเส้นทาง", "normal"],
  ["report.export", "ส่งออกรายงานและเส้นทาง", "sensitive"],
  ["dataset.manage", "นำเข้าชุดข้อมูลกลาง", "administrative"],
  ["dataset.publish", "เผยแพร่และย้อนกลับชุดข้อมูล", "administrative"],
  ["formula.manage", "จัดการสูตรค่าพาดสาย", "administrative"],
].map(([key, labelTh, risk]) => ({ code: `permission_out.${key}`, labelTh, descriptionTh: labelTh, risk: risk as ModuleCapability["risk"], allowedScopes: key.startsWith("dataset.") || key.startsWith("formula.") || key === "opex.read" ? ["ALL"] : [...scopes] }));

export const permissionOutManifest: ModuleManifest = {
  id: "permission-out", version: "0.2.0", number: 7, href: "/permission-out", name: "วิเคราะห์เส้นทาง PEA / UFM", shortLabel: "เส้นทาง PEA/UFM",
  description: "MOD 1 — วิเคราะห์และเปรียบเทียบโครงข่ายบนแผนที่", purpose: "วิเคราะห์เส้นทาง PEA / UFM", repository: "katathepAof/Permission-out@55380a5", owner: "Operations",
  icon: "buildings", accent: "blue", group: "operations", order: 70, lifecycle: "active", enabledByDefault: false,
  capabilities: permissionOutCapabilities, entryPermissions: ["permission_out.module.view"], searchProvider: "permission-out", dashboardProvider: "permission-out",
  searchTerms: ["PEA", "UFM", "KML", "KMZ", "เส้นทาง", "MOD 1"],
  navigationItems: [
    { href: "/permission-out", label: "วิเคราะห์เส้นทาง", icon: "work", activeMatch: "exact" },
    { href: "/permission-out/projects", label: "โครงการวิเคราะห์", icon: "work", activeMatch: "prefix" },
    { href: "/permission-out/reports", label: "รายงาน", icon: "work", activeMatch: "prefix" },
    { href: "/permission-out/datasets", label: "ชุดข้อมูลกลาง", icon: "settings", activeMatch: "prefix" },
    { href: "/permission-out/settings", label: "สูตรค่าพาดสาย", icon: "settings", activeMatch: "prefix" },
  ],
};
