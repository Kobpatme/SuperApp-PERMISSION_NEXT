import type { Metadata } from "next";
export const metadata: Metadata = { title: copy.pages.buildings_new };

import { copy } from "@/lib/copy";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { teams } from "@/db/schema";
import { getDb } from "@/db";
import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { BuildingCreateForm } from "@/features/buildings/map/building-create-form";
import "@/features/buildings/map/building-map.css";

export default async function NewBuildingPage() {
  const access = await getAccessContext("buildings");
  const grants = access.subject?.grants.filter((grant) => grant.permission === "building.record.create") ?? [];
  const canCreate = access.allowed && !access.passwordChangeRequired && grants.some((grant) =>
    grant.scope === "ALL" || grant.scope === "TEAM" && Boolean(access.subject?.teamIds.length) || grant.scope === "SELECTED_TEAMS" && Boolean(grant.selectedTeamId));
  if (!canCreate) return <main className="building-map-state" role="status"><strong>ไม่มีสิทธิ์สร้างอาคาร</strong><Link href="/buildings">กลับไปอาคารและค่าใช้จ่าย</Link></main>;
  const scopeTeamIds = new Set(grants.flatMap((grant) => grant.scope === "ALL" ? [] : grant.scope === "TEAM" ? access.subject?.teamIds ?? [] : grant.selectedTeamId ? [grant.selectedTeamId] : []));
  if (!process.env.DATABASE_URL) return <main className="building-map-state" role="status"><strong>{copy.feedback.unavailable}</strong><Link href="/buildings">กลับไปอาคารและค่าใช้จ่าย</Link></main>;
  const rows = await getDb().select({ id: teams.id, name: teams.name }).from(teams).where(eq(teams.isActive, true)).limit(100);
  const allowedTeams = grants.some((grant) => grant.scope === "ALL") ? rows : rows.filter((team) => scopeTeamIds.has(team.id));
  const canCreateWithoutTeam = grants.some((grant) => grant.scope === "ALL");
  return <main className="building-create-page">
    <header><Link href="/buildings">← อาคารและค่าใช้จ่าย</Link><h1>เพิ่มอาคาร</h1><p>บันทึกข้อมูลอาคารในขอบเขตทีมที่ได้รับอนุญาต และเลือกตำแหน่งได้ก่อนสร้าง</p></header>
    <BuildingCreateForm apiKey={process.env.LONGDO_MAP_API_KEY ?? ""} teams={allowedTeams} canCreateWithoutTeam={canCreateWithoutTeam} />
  </main>;
}
