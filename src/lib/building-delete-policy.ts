import type { AccessContext } from "./access";
import { isAuthorized } from "./authorization";

/** Only the server-resolved platform_admin role can delete a building. */
export function canDeleteBuilding(access: AccessContext, teamId: string | null) {
  return access.allowed && !access.passwordChangeRequired && access.role === "admin" && Boolean(access.userId) &&
    isAuthorized(access.subject, "building.record.read", { teamId }) &&
    isAuthorized(access.subject, "building.record.update", { teamId });
}
