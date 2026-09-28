import { DashboardOverview } from "@/components/dashboard-overview";
import { getWorkspaceData } from "@/lib/workspace-server";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const data = await getWorkspaceData(params.preview === "1");
  return <DashboardOverview displayName={data.identity?.displayName || "ผู้ใช้งาน"} userId={data.identity?.userId || ""} allowedModuleIds={data.allowedModuleIds} developmentMode={data.developmentMode} preview={data.preview} snapshot={data.snapshot}/>;
}
