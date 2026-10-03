import { copy } from "@/lib/copy";
import type { Metadata } from "next";
export const metadata: Metadata = { title: copy.pages.work_people };
import { WorkRoutePage } from "@/components/work-route-page";
export default function WorkPeoplePage() { return <WorkRoutePage view="people" />; }
