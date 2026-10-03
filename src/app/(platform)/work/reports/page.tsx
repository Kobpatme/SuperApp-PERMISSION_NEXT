import { copy } from "@/lib/copy";
import type { Metadata } from "next";
export const metadata: Metadata = { title: copy.pages.work_reports };
import { WorkRoutePage } from "@/components/work-route-page";
export default function WorkReportsPage() { return <WorkRoutePage view="reports" />; }
