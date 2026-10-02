import type { Metadata } from "next";
export const metadata: Metadata = { title: "รายงานงาน" };
import { WorkRoutePage } from "@/components/work-route-page";
export default function WorkReportsPage() { return <WorkRoutePage view="reports" />; }
