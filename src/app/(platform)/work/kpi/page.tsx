import { copy } from "@/lib/copy";
import type { Metadata } from "next";
export const metadata: Metadata = { title: copy.pages.work_kpi };
import { WorkRoutePage } from "@/components/work-route-page";
export default function WorkKpiPage() { return <WorkRoutePage view="kpi" />; }
