import { getHomeWorkMessages } from "@/lib/work-admin-read";
import { copy } from "@/lib/copy";
import type { Metadata } from "next";
export const metadata: Metadata = { title: copy.pages.home };
import { DashboardOverview } from "@/components/dashboard-overview";
import { getWorkspaceData } from "@/lib/workspace-server";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const data = await getWorkspaceData(params.preview === "1");
  const messages = await getHomeWorkMessages();
  return <>{messages.announcements.map(row => <aside key={row.id} className="work-home-announcement" role="note">{row.message}</aside>)}{messages.links.length > 0 && <section className="work-panel"><h2>ลิงก์ระบบ</h2><ul>{messages.links.map(row => <li key={row.id}>{row.status === "Active" ? <a href={row.url} rel="noopener noreferrer">{row.name}</a> : <span>{row.name} · {row.status === "Maintenance" ? "กำลังปรับปรุง" : "เร็ว ๆ นี้"}</span>}<p>{row.description}</p></li>)}</ul></section>}<DashboardOverview displayName={data.identity?.displayName || "ผู้ใช้งาน"} userId={data.identity?.userId || ""} allowedModuleIds={data.allowedModuleIds} developmentMode={data.developmentMode} preview={data.preview} snapshot={data.snapshot}/></>;
}
