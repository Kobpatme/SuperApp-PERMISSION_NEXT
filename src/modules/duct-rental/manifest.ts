import type { ModuleManifest } from "@/lib/module-contract";
import { ductRentalCapabilities } from "./capabilities";

// Release switch stays closed until source conflicts, workflow tests and UAT are resolved.
export const ductRentalManifest: ModuleManifest = {
  id: "duct-rental", version: "0.1.0", number: 5, href: "/duct-rental",
  name: "เช่าท่อร้อยสาย", shortLabel: "เช่าท่อ", description: "คำขอเช่าท่อ ต่อสัญญา และยกเลิกการใช้ท่อ",
  purpose: "การเช่าท่อร้อยสาย", repository: "Kobpatme/METRIX", owner: "Operations",
  icon: "buildings", accent: "blue", group: "operations", order: 50,
  lifecycle: "development", enabledByDefault: false,
  capabilities: ductRentalCapabilities, entryPermissions: ["duct_rental.module.view"],
  searchTerms: ["METRIX", "เช่าท่อ", "ท่อร้อยสาย", "ต่อสัญญา"],
};
