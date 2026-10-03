import { copy } from "@/lib/copy";
import type { Metadata } from "next";
export const metadata: Metadata = { title: copy.pages.work_assign };
import { WorkRoutePage } from "@/components/work-route-page";
export default function WorkAssignPage() { return <WorkRoutePage view="assign" />; }
