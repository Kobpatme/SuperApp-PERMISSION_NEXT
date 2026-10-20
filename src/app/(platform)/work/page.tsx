import { copy } from "@/lib/copy";
import type { Metadata } from "next";
export const metadata: Metadata = { title: copy.pages.work };
import { WorkRoutePage } from "@/components/work-route-page";

export default async function ModulePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <WorkRoutePage view={typeof params.view === "string" ? params.view : "mine"} recordId={typeof params.record === "string" ? params.record : undefined}/>;
}
