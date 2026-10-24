import { Button, ButtonLink } from "@/components/ui/button";
import { FilterBar } from "@/components/ui/form";
import { WorkspaceIcon } from "@/components/workspace-icon";
import styles from "@/features/work/screens/work-list.module.css";
import type { WorkReadModel } from "@/lib/work-read-model";
import type { WorkFilters } from "@/lib/work-query";
export function WorkFiltersForm({ filters = {}, model, appearance = "default", resetHref = "/work/mine" }: { filters?: WorkFilters; model?: Pick<WorkReadModel,"assignmentOptions"|"tasks">; appearance?: "default" | "workspace"; resetHref?: string }) {
  const teams = [...new Map([...(model?.assignmentOptions ?? []),...(model?.tasks ?? [])].filter(p=>p.teamId).map(p=>[p.teamId!,p.teamName])).entries()];
  const fields = <><label>ปี<input type="number" name="year" min={2000} max={2200} defaultValue={filters.year}/></label><label>เดือน<select name="month" defaultValue={filters.month ?? ""}><option value="">ทุกเดือน</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i+1}>{i+1}</option>)}</select></label><label>สถานะ<select name="status" defaultValue={filters.status ?? ""}><option value="">ทุกสถานะ</option><option value="queued">รอรับงาน</option><option value="in_progress">กำลังทำ</option><option value="blocked">พักงาน</option><option value="completed">เสร็จสิ้น</option><option value="cancelled">ยกเลิก</option></select></label><label>ทีม<select name="team" defaultValue={filters.team ?? ""}><option value="">ทุกทีม</option>{teams.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>แหล่งที่มา<select name="source" defaultValue={filters.source ?? ""}><option value="">ทุกแหล่ง</option><option value="personal">งานส่วนตัว</option><option value="assigned">มอบหมาย</option><option value="legacy">ข้อมูลเดิม</option></select></label></>;
  if (appearance === "workspace") {
    const count = [filters.year, filters.month, filters.status, filters.team, filters.source].filter(value => value !== undefined && value !== "").length;
    return <FilterBar method="get" className={styles.filters} aria-label="ตัวกรองงาน">
      <label className={styles.searchField}>ค้นหา Job / ชื่องาน<span className={styles.searchControl}><WorkspaceIcon name="search" size={18}/><input type="search" name="q" defaultValue={filters.q} placeholder="ค้นหางานหรือรหัส Job…"/></span></label>
      <div className={`${styles.filterActions} ui-filter-actions`}><Button variant="primary" type="submit">ค้นหางาน</Button><ButtonLink variant="secondary" href={resetHref}>ล้างตัวกรอง</ButtonLink></div>
      <details className={styles.advanced} open={count > 0}><summary><WorkspaceIcon name="filter" size={18}/>ตัวกรองเพิ่มเติม{count > 0 ? ` · ${count}` : ""}</summary><div className={styles.filterGrid}>{fields}</div></details>
      {filters.owner && <input type="hidden" name="owner" value={filters.owner}/>}
    </FilterBar>;
  }
  return <FilterBar method="get" className="work-panel work-form-grid work-filters" aria-label="ตัวกรองงาน"><label>ค้นหา Job / ชื่องาน<input type="search" name="q" defaultValue={filters.q}/></label>{fields}{filters.owner && <input type="hidden" name="owner" value={filters.owner}/>}<Button variant="secondary" type="submit">ใช้ตัวกรอง</Button></FilterBar>;
}
