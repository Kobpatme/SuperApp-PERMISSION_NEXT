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
  return <>{messages.announcements.map(row => <aside key={row.id} className="work-home-announcement mb-4 rounded-xl border border-[var(--color-border)] border-l-4 border-l-[var(--color-brand)] bg-[var(--color-info-soft)] px-4 py-3 text-sm leading-6 text-[var(--color-text)] shadow-sm" role="note">{row.message}</aside>)}{messages.links.length > 0 && <section className="work-panel mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold text-[var(--color-text)]">ลิงก์ระบบ</h2><ul className="grid gap-3 sm:grid-cols-2">{messages.links.map(row => <li key={row.id} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4"><div className="font-semibold text-[var(--color-text)]">{row.status === "Active" ? <a className="text-[var(--color-brand)] underline-offset-4 hover:underline" href={row.url} rel="noopener noreferrer">{row.name}</a> : <span>{row.name} · {row.status === "Maintenance" ? "กำลังปรับปรุง" : "เร็ว ๆ นี้"}</span>}</div><p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{row.description}</p></li>)}</ul></section>}<DashboardOverview displayName={data.identity?.displayName || "ผู้ใช้งาน"} userId={data.identity?.userId || ""} allowedModuleIds={data.allowedModuleIds} developmentMode={data.developmentMode} preview={data.preview} snapshot={data.snapshot}/></>;
}
