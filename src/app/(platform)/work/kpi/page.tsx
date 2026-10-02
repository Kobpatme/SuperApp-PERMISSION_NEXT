import type { Metadata } from "next";
export const metadata: Metadata = { title: "ผลการทำงานของฉัน" };
import { WorkRoutePage } from "@/components/work-route-page";
export default function WorkKpiPage() { return <WorkRoutePage view="kpi" />; }
