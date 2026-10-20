import type { ModuleManifest } from "@/lib/module-contract";
import { ductRentalCapabilities } from "./capabilities";

// Local UAT may be enabled through Core Admin; deployment and real-data cutover need separate review.
export const ductRentalManifest: ModuleManifest = {
  id: "duct-rental", version: "0.1.0", number: 5, href: "/duct-rental",
  name: "เช่าท่อและพาดสาย", shortLabel: "เช่าท่อและพาดสาย", description: "เช่าท่อร้อยสาย ต่อสัญญา และพาดสายสื่อสาร",
  purpose: "การเช่าท่อและพาดสายสื่อสาร", repository: "Kobpatme/METRIX", owner: "Operations",
  icon: "buildings", accent: "blue", group: "operations", order: 50,
  lifecycle: "active", enabledByDefault: false,
  capabilities: ductRentalCapabilities, entryPermissions: ["duct_rental.module.view"],
  searchTerms: ["METRIX", "เช่าท่อ", "ท่อร้อยสาย", "ต่อสัญญา", "พาดสาย", "PEA", "MEA"],
};
