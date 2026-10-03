import { copy } from "@/lib/copy";
import type { Metadata } from "next";
export const metadata: Metadata = { title: copy.pages.work_team };
import { WorkRoutePage } from "@/components/work-route-page";
export default function WorkTeamPage() { return <WorkRoutePage view="team" />; }
