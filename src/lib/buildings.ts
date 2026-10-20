import { z } from "zod";

export const buildingInputSchema = z.object({
  code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9._-]+$/),
  nameTh: z.string().trim().min(2).max(240),
  nameEn: z.string().trim().max(240).optional().or(z.literal("")),
  ownerTeamId: z.string().uuid().optional().nullable(),
});

export function normalizeBuildingAlias(value: string) {
  return value.normalize("NFC").trim().toLocaleLowerCase("th-TH").replace(/[\s._/-]+/g, " ");
}

export function prepareBuildingInput(input: unknown) {
  const parsed = buildingInputSchema.parse(input);
  const searchText = [parsed.code, parsed.nameTh, parsed.nameEn].filter(Boolean).map((value) => normalizeBuildingAlias(value!)).join(" ");
  return { ...parsed, nameEn: parsed.nameEn || null, ownerTeamId: parsed.ownerTeamId ?? null, searchText };
}
