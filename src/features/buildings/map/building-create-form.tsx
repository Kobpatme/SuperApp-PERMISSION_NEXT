"use client";

import { BuildingEditorForm } from "../building-editor-form";

export function BuildingCreateForm(props: { apiKey: string; teams: { id: string; name: string }[]; canCreateWithoutTeam: boolean }) {
  return <BuildingEditorForm {...props}/>;
}
