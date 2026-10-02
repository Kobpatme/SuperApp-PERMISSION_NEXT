import type { Metadata } from "next";
export const metadata: Metadata = { title: "บุคลากร" };
import { WorkRoutePage } from "@/components/work-route-page";
export default function WorkPeoplePage() { return <WorkRoutePage view="people" />; }
