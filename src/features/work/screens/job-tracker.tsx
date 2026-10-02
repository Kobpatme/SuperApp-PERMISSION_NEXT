"use client";

import { useMemo, useState } from "react";
import type { WorkReadModel } from "@/lib/work-read-model";
import type { AuthorizationSubject } from "@/lib/authorization";
import { formatWorkspaceDate } from "@/lib/workspace-view";
import { WorkEmpty, WorkScreenShell, WorkUnavailable } from "@/features/work/components/work-screen-shell";
import { StatusBadge } from "@/components/ui/status-badge";

export function JobTrackerScreen({ model, subject, ownerId }: { model: WorkReadModel; subject?: AuthorizationSubject; ownerId?: string }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const groups = useMemo(() => model.jobGroups.filter((group) => (!ownerId || group.tasks.some((task) => task.ownerId === ownerId)) && (!query.trim() || `${group.label} ${group.tasks.map((task) => `${task.title} ${task.ownerName} ${task.jobCode ?? ""}`).join(" ")}`.toLocaleLowerCase("th-TH").includes(query.trim().toLocaleLowerCase("th-TH")))), [model.jobGroups, ownerId, query]);
  if (model.source.status !== "ready") return <WorkScreenShell title="Job Tracker" description="ค้นหาและติดตามงานย่อยภายใต้ Job เดียวกัน"><WorkUnavailable message="ยังโหลด Job Tracker ไม่ได้" detail={model.source.message} /></WorkScreenShell>;
  return <WorkScreenShell title="Job Tracker" description="ค้นหา Job code และเปิดดูงานย่อยทั้งหมดโดยไม่ตัดรายการที่ถูกต้อง" parent={{ label: "งานของทีม", href: "/work/team" }}>
    <section className="work-panel"><div className="work-section-head"><div><span className="work-eyebrow">Job Tracker</span><h2>ติดตามงานตาม Job</h2><p>หนึ่ง Job อาจมีหลายงานย่อย แต่ละรายการมีสถานะ ผู้รับผิดชอบ และกำหนดของตัวเอง</p></div><span className="work-form-count">{groups.length} กลุ่ม</span></div><label className="work-search-field">ค้นหา Job code ชื่องาน หรือผู้รับผิดชอบ<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="เช่น JOB-001 หรือชื่อผู้รับผิดชอบ" /></label>{groups.length ? <div className="work-job-list">{groups.map((group) => <article className="work-job-group" key={group.key}><button className="work-job-toggle" type="button" aria-expanded={expanded === group.key} onClick={() => setExpanded(expanded === group.key ? null : group.key)}><span><strong>{group.label}</strong><small>{group.hasJobCode ? "รหัสงานจากข้อมูลระบบ" : "ยังไม่มีรหัส Job ที่ยืนยัน"} · {group.tasks.length} งานย่อย</small></span><span className="secondary-action">{expanded === group.key ? "ย่อรายละเอียด" : "ขยายรายละเอียด"}</span></button>{expanded === group.key && <div className="work-job-details">{group.tasks.map((task) => <div className="work-job-task" key={task.id}><div><strong>{task.title}</strong><span>{task.ownerName} · {task.teamName}</span><span>{task.mainKpi || "ยังไม่ระบุ KPI"} · กำหนด {task.dueAt ? formatWorkspaceDate(task.dueAt) : "ไม่กำหนด"}</span></div><StatusBadge label={task.statusLabel} tone={task.status === "completed" ? "success" : task.status === "blocked" ? "warning" : task.status === "cancelled" ? "danger" : "info"}/></div>)}</div>}</article>)}</div> : <WorkEmpty title="ไม่พบ Job ที่ตรงกับคำค้น" detail={query ? "ลองใช้รหัสงาน ชื่องาน หรือชื่อผู้รับผิดชอบที่สั้นลง" : "ยังไม่มีงานที่มีข้อมูล Job ในขอบเขตของคุณ"} />}</section>
  </WorkScreenShell>;
}
