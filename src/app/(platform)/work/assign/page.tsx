import type { Metadata } from "next";
export const metadata: Metadata = { title: "มอบหมายงาน" };
import { WorkRoutePage } from "@/components/work-route-page";
export default function WorkAssignPage() { return <WorkRoutePage view="assign" />; }
