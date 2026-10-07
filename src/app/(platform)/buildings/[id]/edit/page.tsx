import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { teams } from "@/db/schema";
import { buildingEditorInitial, getBuildingEditor } from "@/lib/building-editor-server";
import { BuildingEditorForm } from "@/features/buildings/building-editor-form";
import { copy } from "@/lib/copy";
import "@/features/buildings/map/building-map.css";

export const metadata: Metadata = { title: copy.buildingEditor.editTitle };

export default async function EditBuildingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getBuildingEditor(id);
  if (!data) notFound();
  const rows = data.building.ownerTeamId ? await getDb().select({ id: teams.id, name: teams.name }).from(teams).where(eq(teams.id, data.building.ownerTeamId)).limit(1) : [];
  return <main className="building-create-page">
    <header><Link href={`/buildings/${id}`}>← {copy.pages.buildings_id}</Link><h1>{copy.buildingEditor.editTitle}</h1><p>{copy.buildingEditor.editDescription}</p></header>
    <BuildingEditorForm id={id} initial={buildingEditorInitial(data)} teams={rows} canCreateWithoutTeam apiKey={process.env.LONGDO_MAP_API_KEY ?? ""}/>
  </main>;
}
