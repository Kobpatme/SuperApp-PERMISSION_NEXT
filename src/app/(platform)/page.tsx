import { getHomeWorkMessages } from "@/lib/work-admin-read";
import { copy } from "@/lib/copy";
import type { Metadata } from "next";
export const metadata: Metadata = { title: copy.pages.home };
import { DashboardOverview } from "@/components/dashboard-overview";
import { OverviewMessages } from "@/components/overview-messages";
import { getWorkspaceData } from "@/lib/workspace-server";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const data = await getWorkspaceData(params.preview === "1");
  const messages = await getHomeWorkMessages();
  return <><OverviewMessages announcements={messages.announcements} links={messages.links}/><DashboardOverview displayName={data.identity?.displayName || "ผู้ใช้งาน"} userId={data.identity?.userId || ""} allowedModuleIds={data.allowedModuleIds} developmentMode={data.developmentMode} preview={data.preview} snapshot={data.snapshot}/></>;
}
