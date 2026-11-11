import { Button, ButtonLink } from "@/components/ui/button";
import { FilterBar, FormField } from "@/components/ui/form";
import { WorkspaceIcon } from "@/components/workspace-icon";
import styles from "@/features/work/screens/work-list.module.css";
import type { WorkReadModel } from "@/lib/work-read-model";
import type { WorkFilters } from "@/lib/work-query";
export function WorkFiltersForm({ filters = {}, model, appearance = "default", resetHref = "/work/mine" }: { filters?: WorkFilters; model?: Pick<WorkReadModel,"assignmentOptions"|"tasks"|"filterTeams">; appearance?: "default" | "workspace"; resetHref?: string }) {
  const teams = model?.filterTeams?.map(team => [team.id, team.name] as const) ?? [...new Map([...(model?.assignmentOptions ?? []),...(model?.tasks ?? [])].filter(p=>p.teamId).map(p=>[p.teamId!,p.teamName])).entries()];
  const fields = <><label>ปี<input type="number" name="year" min={2000} max={2200} defaultValue={filters.year} className="ui-field-control ui-building-field"/></label><label>เดือน<select name="month" defaultValue={filters.month ?? ""} className="ui-field-control ui-building-field"><option value="">ทุกเดือน</option>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i+1}>{i+1}</option>)}</select></label><label>สถานะ<select name="status" defaultValue={filters.status ?? ""} className="ui-field-control ui-building-field"><option value="">ทุกสถานะ</option><option value="queued">รอรับงาน</option><option value="in_progress">กำลังทำ</option><option value="blocked">พักงาน</option><option value="completed">เสร็จสิ้น</option><option value="cancelled">ยกเลิก</option></select></label><label>ทีม<select name="team" defaultValue={filters.team ?? ""} className="ui-field-control ui-building-field"><option value="">ทุกทีม</option>{teams.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label><label>แหล่งที่มา<select name="source" defaultValue={filters.source ?? ""} className="ui-field-control ui-building-field"><option value="">ทุกแหล่ง</option><option value="personal">งานส่วนตัว</option><option value="assigned">มอบหมาย</option><option value="legacy">ข้อมูลเดิม</option></select></label></>;
  if (appearance === "workspace") {
    const count = [filters.year, filters.month, filters.status, filters.team, filters.source].filter(value => value !== undefined && value !== "").length;
    return <FilterBar method="get" className={styles.filters} aria-label="ตัวกรองงาน">
      <FormField label="ค้นหา Job / ชื่องาน" className={styles.searchField}><input type="search" name="q" defaultValue={filters.q} placeholder="ค้นหางานหรือรหัส Job…" className="ui-field-control ui-building-field"/></FormField>
      <div className={`${styles.filterActions} ui-filter-actions`}><Button variant="primary" type="submit">ค้นหางาน</Button><ButtonLink variant="secondary" href={resetHref}>ล้างตัวกรอง</ButtonLink></div>
      <details className={styles.advanced} open={count > 0}><summary><WorkspaceIcon name="filter" size={18}/>ตัวกรองเพิ่มเติม{count > 0 ? ` · ${count}` : ""}</summary><div className={styles.filterGrid}>{fields}</div></details>
      {filters.owner && <input type="hidden" name="owner" value={filters.owner}/>}
    </FilterBar>;
  }
  return <FilterBar method="get" className="work-panel work-filters" aria-label="ตัวกรองงาน"><label>ค้นหา Job / ชื่องาน<input type="search" name="q" defaultValue={filters.q} className="ui-field-control ui-building-field"/></label>{fields}{filters.owner && <input type="hidden" name="owner" value={filters.owner}/>}<Button variant="secondary" type="submit">ใช้ตัวกรอง</Button></FilterBar>;
}
