import type { Metadata } from "next";
export const metadata: Metadata = { title: "ภาพรวมทีม" };
import { WorkRoutePage } from "@/components/work-route-page";
export default function WorkTeamPage() { return <WorkRoutePage view="team" />; }
