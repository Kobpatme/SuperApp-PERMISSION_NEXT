import { sql } from "drizzle-orm";
import { z } from "zod";
import { SERVICE_CENTER_OPTIONS } from "../schemas/design";
import { id, version } from "../schemas/operations";
import { DuctError, material, mutation, requirePermission, transaction, type DuctContext } from "./transaction";
type Settings = { id: string; version: number; service_center_teams: Record<string, string>; coordinator_phones: Record<string, string> };
export async function readOptions(context: DuctContext, center = "") {
  z.union([z.literal(""), z.enum(SERVICE_CENTER_OPTIONS)]).parse(center);
  return transaction(context, async tx => ({
    teams: Array.from(await tx.execute<{ id: string; name: string }>(sql`select * from public.duct_rental_team_options()`)),
    coordinators: Array.from(await tx.execute<{ id: string; display_name: string; email: string; phone: string }>(sql`select * from public.duct_rental_install_coordinators(${center})`)),
  }));
}
export async function readSettings(context: DuctContext) {
  return transaction(context, async tx => {
    await requirePermission(tx, "duct_rental.settings.manage", null);
    const [row] = await tx.execute<Settings>(sql`select id,version,service_center_teams,coordinator_phones from public.duct_rental_settings where id='default'`);
    if (!row) throw new DuctError("NOT_CONFIGURED", "ยังไม่ได้เตรียมการตั้งค่าโมดูล", 503);
    return row;
  });
}
export async function saveSettings(raw: unknown, key: string, context: DuctContext) {
  const input = z.object({ version, serviceCenterTeams: z.record(z.enum(SERVICE_CENTER_OPTIONS), id), coordinatorPhones: z.record(id, z.string().max(100)) }).strict().parse(raw);
  return mutation(context, key, "settings.updated", input, async tx => {
    await requirePermission(tx, "duct_rental.settings.manage", null);
    const [row] = await tx.execute<Settings>(sql`select * from public.duct_rental_settings where id='default' for update`);
    if (!row || row.version !== input.version) throw new DuctError("STATE", "การตั้งค่าเปลี่ยนแล้ว กรุณาโหลดใหม่", 409);
    await material(tx, context, "settings.updated", "default", context.actorId, async () => {
      await tx.execute(sql`update public.duct_rental_settings set service_center_teams=${JSON.stringify(input.serviceCenterTeams)}::jsonb,coordinator_phones=${JSON.stringify(input.coordinatorPhones)}::jsonb,version=version+1,updated_by=${context.actorId}::uuid,updated_at=now() where id='default'`);
    }, { serviceCenterTeams: row.service_center_teams, coordinatorPhones: row.coordinator_phones }, { serviceCenterTeams: input.serviceCenterTeams, coordinatorPhones: input.coordinatorPhones });
    return { id: "default", version: row.version + 1 };
  });
}
