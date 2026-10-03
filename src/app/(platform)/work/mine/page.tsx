import { copy } from "@/lib/copy";
import type { Metadata } from "next";
export const metadata: Metadata = { title: copy.pages.work_mine };
import { WorkRoutePage } from "@/components/work-route-page";
export default function WorkMinePage() { return <WorkRoutePage view="mine-list" />; }
