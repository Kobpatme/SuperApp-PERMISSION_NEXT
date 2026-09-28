"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { InstallationTeamContext } from "@/lib/installation-team-context";
import { WorkspaceIcon } from "@/components/workspace-icon";

export function SidebarTeamSelector({ context, collapsed = false, onNavigate }: { context: InstallationTeamContext; collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const requested = pathname.startsWith("/guarantees") ? searchParams.get("team") : null;
  const allowedRequested = context.teams.some((team) => team.id === requested);
  const value = allowedRequested ? requested! : context.canViewAll ? "all" : context.teams.length === 1 ? context.teams[0].id : "mine";

  function selectTeam(next: string) {
    const params = new URLSearchParams(pathname.startsWith("/guarantees") ? searchParams.toString() : "");
    if (next === "all" || next === "mine") params.delete("team"); else params.set("team", next);
    router.push(`/guarantees${params.size ? `?${params}` : ""}`);
    detailsRef.current?.removeAttribute("open");
    onNavigate?.();
  }

  return <details ref={detailsRef} className={`sidebar-team-selector ${collapsed ? "collapsed" : ""}`}>
    <summary className="sidebar-link" aria-label={collapsed ? "ทีมติดตั้ง" : undefined} title={collapsed ? "ทีมติดตั้ง" : undefined}><WorkspaceIcon name="team" size={21}/><span className="sidebar-link-label">ทีมติดตั้ง</span><WorkspaceIcon name="chevron" size={15}/></summary>
    <div className="sidebar-team-dropdown" role="group" aria-label="เลือกทีมติดตั้ง">
      {context.canViewAll && <button type="button" className={value === "all" ? "selected" : ""} onClick={() => selectTeam("all")}><span>ทุกทีม</span>{value === "all" && <WorkspaceIcon name="check" size={15}/>}</button>}
      {!context.canViewAll && context.teams.length > 1 && <button type="button" className={value === "mine" ? "selected" : ""} onClick={() => selectTeam("mine")}><span>ทีมของฉันทั้งหมด</span>{value === "mine" && <WorkspaceIcon name="check" size={15}/>}</button>}
      {!context.teams.length && <p>ยังไม่ได้กำหนดทีม</p>}
      {context.teams.map((team) => <button type="button" key={team.id} className={value === team.id ? "selected" : ""} onClick={() => selectTeam(team.id)}><span>{team.name.replace(/^ทีมติดตั้ง /, "")}</span>{value === team.id && <WorkspaceIcon name="check" size={15}/>}</button>)}
    </div>
  </details>;
}
