import { getAccessContext } from "@/lib/access";
import { AccessDenied } from "@/components/access-denied";
import { DuctSettings } from "@/modules/duct-rental/components/settings-workspace";
export default async function Page() { const access = await getAccessContext("duct-rental"); return access.allowed && access.permissions.includes("duct_rental.settings.manage") ? <DuctSettings /> : <AccessDenied moduleName="ตั้งค่าเช่าท่อ" />; }
