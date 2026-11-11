"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import type { AuthorizationSubject } from "@/lib/authorization";
import type { WorkReadModel } from "@/lib/work-read-model";
import { PageHeader } from "@/components/ui/page-header";
import { WorkspaceIcon } from "@/components/workspace-icon";
import { WorkEmpty, WorkUnavailable } from "@/features/work/components/work-screen-shell";
import { WorkTaskTable } from "@/features/work/components/task-table";
import { pageWorkItems, sortWorkItems, type WorkListSort } from "@/features/work/components/work-list-presentation";
import styles from "./work-list.module.css";
import composition from "./work-composition.module.css";

type Props = { model: WorkReadModel; subject?: AuthorizationSubject; userId: string; canCreate?: boolean; filters?: ReactNode };

/** Actual /work/mine presentation. Query, permissions and task mutations stay with their existing owners. */
export function MyTasksWorkspace({ model, subject, userId, canCreate, filters }: Props) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [sort, setSort] = useState<WorkListSort>("recent");
  const mine = useMemo(() => model.tasks.filter(task => task.ownerId === userId), [model.tasks, userId]);
  const sorted = useMemo(() => sortWorkItems(mine, sort), [mine, sort]);
  const result = pageWorkItems(sorted, page, size);
  const number = (value: number) => value.toLocaleString("th-TH");

  return <div className={`${styles.workspace} ${composition.workspace} work-native work-rollout`} data-ui-screen data-work-appearance="workspace" data-work-mine-prototype>
    <PageHeader className={styles.pageHeader} title="งานของฉัน" description="จัดลำดับงาน ติดตามกำหนด และทำงานต่อจากจุดที่ค้างไว้" parent={{ label: "งานและ KPI", href: "/work" }} actions={canCreate ? <Link className="btn-primary" href="/work/new"><WorkspaceIcon name="info" size={18}/>เพิ่มงานใหม่</Link> : undefined}/>
    {model.source.status !== "ready" ? <WorkUnavailable message="ยังโหลดรายการงานไม่ได้" detail={model.source.message}/> : <>
      <section className={styles.summary} aria-label="สรุปงานในผลลัพธ์ปัจจุบัน">
        <span><i className={styles.summaryDot}/><strong>{number(mine.length)}</strong> งานในรายการนี้</span>
        <span><i className={styles.infoDot}/><strong>{number(mine.filter(task => task.status === "in_progress").length)}</strong> กำลังทำ</span>
        <span><i className={styles.warningDot}/><strong>{number(mine.filter(task => task.status === "blocked").length)}</strong> พักงาน</span>
        <span><i className={styles.successDot}/><strong>{number(mine.filter(task => task.status === "completed").length)}</strong> เสร็จสิ้น</span>
      </section>
      <section className={styles.panel} aria-label="พื้นที่รายการงานของฉัน">
        <div className={styles.panelHeading}><div className={styles.panelTitle}><WorkspaceIcon name="work" size={20}/><h2>รายการงาน</h2><span className={styles.count}>{number(mine.length)}</span></div><span className={styles.scope}>เฉพาะงานของคุณ · ตามสิทธิ์เดิม</span></div>
        {filters}
        <div className={styles.listMeta}><p role="status">{mine.length ? `แสดง ${number(result.start)}–${number(result.end)} จาก ${number(result.total)} งานในผลลัพธ์นี้` : "ยังไม่มีงานที่ตรงกับเงื่อนไข"}</p><label>เรียงตาม<select className="ui-building-field" value={sort} onChange={event => { setSort(event.target.value as WorkListSort); setPage(1); }}><option value="recent">ลำดับจากระบบ</option><option value="due">กำหนดส่งใกล้ที่สุด</option><option value="title">ชื่องาน ก–ฮ</option></select></label></div>
        {mine.length ? <WorkTaskTable tasks={result.items} subject={subject} showNotes appearance="workspace"/> : <WorkEmpty title="ยังไม่มีงานในรายการนี้" detail="ลองปรับตัวกรอง หรือเพิ่มงานใหม่เมื่อคุณพร้อม งานที่ได้รับมอบหมายจะแสดงที่นี่ตามสิทธิ์เดิม" action={canCreate ? <Link className="btn-primary" href="/work/new">เพิ่มงานใหม่</Link> : undefined}/>}
        <footer className={styles.footer}><label>แสดงต่อหน้า<select className="ui-building-field" value={size} onChange={event => { setSize(Number(event.target.value)); setPage(1); }}>{[10, 25, 50].map(value => <option key={value} value={value}>{value} งาน</option>)}</select></label><nav aria-label="หน้ารายการงาน" className={styles.pagination}><button type="button" disabled={result.page <= 1} onClick={() => setPage(result.page - 1)} aria-label="หน้าก่อนหน้า"><span aria-hidden="true">‹</span></button><span aria-live="polite">หน้า <strong>{number(result.page)}</strong> / {number(result.pages)}</span><button type="button" disabled={result.page >= result.pages} onClick={() => setPage(result.page + 1)} aria-label="หน้าถัดไป"><span aria-hidden="true">›</span></button></nav></footer>
      </section>
      <p className={styles.footnote}>ค้นหาและตัวกรองใช้ข้อมูลจากระบบเดิม · การแบ่งหน้าและเรียงลำดับใช้เฉพาะผลลัพธ์ที่โหลดมาแล้ว</p>
    </>}
  </div>;
}
