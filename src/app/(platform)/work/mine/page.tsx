import type { Metadata } from "next";
export const metadata: Metadata = { title: "งานของฉัน" };
import { WorkRoutePage } from "@/components/work-route-page";
export default function WorkMinePage() { return <WorkRoutePage view="mine-list" />; }
