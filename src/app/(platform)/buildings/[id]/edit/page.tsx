import type { Metadata } from "next";

import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { teams } from "@/db/schema";
import { buildingEditorInitial, getBuildingEditor } from "@/lib/building-editor-server";
import { BuildingEditorForm } from "@/features/buildings/building-editor-form";
import { PageHeader } from "@/components/ui/page-header";
import { copy } from "@/lib/copy";
import "@/features/buildings/map/building-map.css";
import "../../buildings-presentation.css";

export const metadata: Metadata = { title: copy.buildingEditor.editTitle };

export default async function EditBuildingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getBuildingEditor(id);
  if (!data) notFound();
  const rows = data.building.ownerTeamId ? await getDb().select({ id: teams.id, name: teams.name }).from(teams).where(eq(teams.id, data.building.ownerTeamId)).limit(1) : [];
  return <main className="building-form-page building-create-page" data-ui-screen="building-edit">
    <PageHeader title={copy.buildingEditor.editTitle} description={copy.buildingEditor.editDescription} parent={{ label: copy.pages.buildings_id, href: `/buildings/${id}` }} className="page-enter" />
    <BuildingEditorForm id={id} initial={buildingEditorInitial(data)} teams={rows} canCreateWithoutTeam apiKey={process.env.LONGDO_MAP_API_KEY ?? ""}/>
  </main>;
}
