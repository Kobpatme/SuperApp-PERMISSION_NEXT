"use client";
import { AdminActionForm } from "@/components/admin-action-form";
import { FormGrid } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { useActionState, useState } from "react";
import { saveWorkAdminAction, previewWorkAdminAction, confirmWorkAdminAction, type WorkAdminState } from "@/app/(platform)/admin/work-actions";
import { restoreWorkTaskAction, type WorkActionState } from "@/app/(platform)/work/actions";
import type { WorkAdminData } from "@/lib/work-admin-read";
const initial: WorkAdminState = { ok: false, message: "" };

/**
 * ฟอร์มหีบห่อแอ็กชันของแผง admin แต่ละแผง.
 *
 * หมายเหตุเรื่อง payload: เดิม AdminForm ห่อ children ด้วย `<fieldset disabled={pending}>`
 * ซ้อนทับ fieldset ของ AdminActionForm อีกชั้นหนึ่ง ในขณะที่ pending ฟอร์มควบคุมทุกตัว
 * จะถูกปิดและหลุดออกจาก FormData ทำให้ payload หายระหว่างบันทึก. แก้โดยไม่ห่อ fieldset
 * เองอีก — AdminActionForm เป็นเจ้าของ fieldset เดียวของแอ็กชัน (ไฟล์ร่วม ไม่แตะที่นี่),
 * อ่าน FormData ก่อนจะตั้ง pending ดังนั้นค่าในช่องทุกชื่อยังคงอยู่ใน payload ของการส่ง
 * ครั้งนั้นเสมอ การกันส่งซ้ำระหว่างทำงานใช้ปุ่มส่งที่ disabled ตอน pending ร่วมกับ
 * guard ใน onSubmit ของ AdminActionForm และ aria-busy บนฟอร์ม
 */
function AdminForm({ kind, title, children }: { kind: string; title: string; children: React.ReactNode }) {
  const [state, action, pending] = useActionState(saveWorkAdminAction, initial);
  return (
    <AdminActionForm action={action} className="work-admin-form">
      <h3>{title}</h3>
      <input type="hidden" name="kind" value={kind} />
      {children}
      <div className="work-action-row">
        <Button type="submit" variant="primary" disabled={pending}>{pending ? "กำลังบันทึก…" : "บันทึก"}</Button>
        <Button variant="secondary" type="reset" disabled={pending}>ล้างฟอร์ม</Button>
      </div>
      <p role="status">{state.message}</p>
    </AdminActionForm>
  );
}

function Version({ id, version }: { id?: string; version?: number }) {
  return <><input type="hidden" name="id" value={id ?? ""} /><input type="hidden" name="expectedVersion" value={version ?? ""} /></>;
}

/* ---------------- ฟิลด์หน้าประกอบของแต่ละแผง (ส่งออกเพื่อทดสอบ edit/dynamic โดยไม่ต้องพึ่ง browser) ---------------- */

export function HolidayFormFields({ edit }: { edit?: WorkAdminData["calendar"][number] }) {
  return (
    <>
      <label>วันที่<input className="ui-building-field" name="holidayDate" type="date" required defaultValue={edit?.holidayDate} /></label>
      <label>ชื่อวันหยุด<input className="ui-building-field" name="name" required maxLength={180} defaultValue={edit?.name} /></label>
      <label>แหล่งที่มา<select className="ui-building-field" name="source" defaultValue={edit?.source ?? "company"}>
        <option value="company">บริษัท</option>
        <option value="thai">วันหยุดไทย</option>
      </select></label>
      <label><input type="checkbox" name="isActive" defaultChecked={edit?.isActive ?? true} /> ใช้งาน</label>
    </>
  );
}

export function KpiRuleFields({ edit, data }: { edit?: WorkAdminData["catalog"][number]; data: WorkAdminData }) {
  return (
    <>
      <input type="hidden" name="metricId" value={edit?.metricId ?? ""} />
      <input type="hidden" name="expectedVersion" value={edit?.version ?? 0} />
      <label>ทีม<select className="ui-building-field" name="teamId" defaultValue={edit?.teamId ?? ""} required>
        <option value="">เลือกทีม</option>
        {data.teams.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select></label>
      <label>Main KPI<input className="ui-building-field" name="mainKpi" required maxLength={180} defaultValue={edit?.mainKpi} /></label>
      <label>Sub KPI<input className="ui-building-field" name="subKpi" required maxLength={180} defaultValue={edit?.subKpi} /></label>
      <label>SLA (วันทำการ)<input className="ui-building-field" name="slaDays" type="number" min={0} max={366} required defaultValue={edit?.slaDays} /></label>
      <label>น้ำหนัก Main KPI<input className="ui-building-field" name="mainWeight" type="number" step="0.000001" min="0.000001" max={100} required defaultValue={edit?.mainWeight} /></label>
      <label><input type="checkbox" name="active" defaultChecked={edit?.status !== "retired"} /> ใช้งาน</label>
    </>
  );
}

type KpiAssignment = { metricId: string; weight: string; enabled: boolean };
export function PersonalKpiFields({ person, latest, catalog, all, onUseAll }: {
  person: WorkAdminData["people"][number];
  latest?: { version: number; assignments: KpiAssignment[] };
  catalog: WorkAdminData["catalog"];
  all: boolean;
  onUseAll: () => void;
}) {
  return (
    <>
      <input type="hidden" name="userId" value={person.id} />
      <input type="hidden" name="teamId" value={person.teamId} />
      <input type="hidden" name="expectedVersion" value={latest?.version ?? 0} />
      <p>น้ำหนักที่เลือกใช้ต้องรวมเป็น 100% การเปลี่ยนแปลงสร้างรุ่นใหม่และไม่แก้น้ำหนักงานเก่า</p>
      <Button type="button" variant="secondary" onClick={onUseAll}>ใช้ KPI ที่แสดงทั้งหมด</Button>
      {catalog.map(r => {
        const previous = latest?.assignments.find(a => a.metricId === r.metricId);
        return (
          <div key={r.metricId} className="work-personal-kpi-row">
            <input type="hidden" name="metricIds" value={r.metricId} />
            <label><input type="checkbox" name={`enabled:${r.metricId}`} defaultChecked={all || previous?.enabled || false} /> ใช้กับคนนี้ · {r.mainKpi} / {r.subKpi}</label>
            <label>น้ำหนักของคนนี้ (%)<input className="ui-building-field" type="number" name={`weight:${r.metricId}`} min="0.000001" max={100} step="0.000001" defaultValue={previous?.weight ?? r.mainWeight} required /></label>
          </div>
        );
      })}
    </>
  );
}

export function SystemLinkFields({ edit, data }: { edit?: Partial<WorkAdminData["links"][number]>; data: WorkAdminData }) {
  return (
    <>
      <Version id={edit?.id} version={edit?.version} />
      <label>ชื่อ<input className="ui-building-field" name="name" required maxLength={180} defaultValue={edit?.name} /></label>
      <label>คำอธิบาย<textarea className="ui-building-field" name="description" maxLength={1000} defaultValue={edit?.description} /></label>
      <label>URL<input className="ui-building-field" name="url" required maxLength={2000} defaultValue={edit?.url} placeholder="https:// หรือ /path" /></label>
      <label>ไอคอน<input className="ui-building-field" name="icon" defaultValue={edit?.icon ?? "link"} maxLength={80} /></label>
      <label>สถานะ<select className="ui-building-field" name="status" defaultValue={edit?.status ?? "Active"}>
        <option>Active</option>
        <option>Maintenance</option>
        <option>Coming Soon</option>
        <option>Hidden</option>
      </select></label>
      <label><input type="checkbox" name="visibleToAll" defaultChecked={edit?.visibleToAll} /> แสดงให้ผู้ใช้ทุกคน</label>
      <fieldset><legend>บทบาทที่ดูได้</legend>{data.roles.map(r => <label key={r.id}><input type="checkbox" name="roleIds" value={r.id} defaultChecked={edit?.roleIds?.includes(r.id)} /> {r.name}</label>)}</fieldset>
      <fieldset><legend>ทีมที่ดูได้</legend>{data.teams.map(r => <label key={r.id}><input type="checkbox" name="teamIds" value={r.id} defaultChecked={edit?.teamIds?.includes(r.id)} /> {r.name}</label>)}</fieldset>
    </>
  );
}

export function AnnouncementFormFields({ announcement, required }: { announcement?: { message: string; isActive: boolean }; required?: boolean }) {
  return (
    <>
      <label>ข้อความ<textarea className="ui-building-field" name="message" defaultValue={announcement?.message} maxLength={4000} {...(required ? { required: true } : {})} /></label>
      <label><input name="isActive" type="checkbox" defaultChecked={announcement?.isActive} /> แสดงบนหน้าหลัก</label>
    </>
  );
}

/* ---------------- แผงย่อยแต่ละเรื่อง ---------------- */

function CalendarPanel({ data }: { data: WorkAdminData }) {
  const [edit, setEdit] = useState<WorkAdminData["calendar"][number] | undefined>();
  const [year, setYear] = useState("");
  const [source, setSource] = useState("");
  const [active, setActive] = useState("");
  const rows = data.calendar.filter(r => (!year || r.holidayDate.startsWith(year)) && (!source || r.source === source) && (!active || String(r.isActive) === active));
  return (
    <section id="calendar" data-admin-surface="calendar" className="admin-panel">
      <div className="admin-panel-title">
        <h2>วันหยุด</h2>
        <span className="admin-status-badge admin-status-neutral">งานและ KPI</span>
      </div>
      <p>เพิ่มวันหยุดบริษัทหรือวันหยุดไทยด้วยมือ แล้วดูผลกระทบก่อนคำนวณกำหนดใหม่</p>
      <FormGrid>
        <label>ปี<input className="ui-building-field" value={year} onChange={e => setYear(e.target.value)} placeholder="2026" /></label>
        <label>แหล่งที่มา<select className="ui-building-field" value={source} onChange={e => setSource(e.target.value)}>
          <option value="">ทั้งหมด</option>
          <option value="company">บริษัท</option>
          <option value="thai">วันหยุดไทย</option>
        </select></label>
        <label>สถานะ<select className="ui-building-field" value={active} onChange={e => setActive(e.target.value)}>
          <option value="">ทั้งหมด</option>
          <option value="true">ใช้งาน</option>
          <option value="false">ปิดใช้งาน</option>
        </select></label>
      </FormGrid>
      <ul>
        {rows.map(r => (
          <li key={r.id}>
            {r.holidayDate} · {r.name} · {r.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
            <Button type="button" variant="ghost" onClick={() => setEdit(r)}>แก้ไข / ปิดใช้งาน</Button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="secondary" onClick={() => setEdit(undefined)}>เพิ่มวันหยุด</Button>
      <AdminForm key={`${edit?.id}:${edit?.version}`} kind="holiday" title={edit ? "แก้ไขวันหยุด" : "เพิ่มวันหยุด"}>
        <Version id={edit?.id} version={edit?.version} />
        <HolidayFormFields edit={edit} />
      </AdminForm>
    </section>
  );
}

function KpiPanel({ data }: { data: WorkAdminData }) {
  const [edit, setEdit] = useState<WorkAdminData["catalog"][number] | undefined>();
  return (
    <section id="kpi" data-admin-surface="kpi" className="admin-panel">
      <div className="admin-panel-title">
        <h2>กฎ KPI / SLA</h2>
        <span className="admin-status-badge admin-status-neutral">งานและ KPI</span>
      </div>
      <p>แต่ละการบันทึกสร้างรุ่นใหม่ งานเก่าเก็บกฎที่ใช้เดิม การปิดใช้งานยังรักษาประวัติไว้</p>
      <ul>
        {data.catalog.map(r => (
          <li key={r.id}>
            {r.mainKpi} / {r.subKpi} · {r.slaDays} วันทำการ · น้ำหนัก {r.mainWeight} · รุ่น {r.version} · {r.status === "active" ? "ใช้งาน" : "ปิดใช้งาน"}
            <Button type="button" variant="ghost" onClick={() => setEdit(r)}>แก้ไข / ปิดใช้งาน</Button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="secondary" onClick={() => setEdit(undefined)}>เพิ่มกฎ</Button>
      <AdminForm key={`${edit?.id}:${edit?.version}`} kind="rule" title={edit ? "สร้างรุ่นใหม่" : "เพิ่ม KPI"}>
        <KpiRuleFields edit={edit} data={data} />
      </AdminForm>
    </section>
  );
}

function PersonalPanel({ data }: { data: WorkAdminData }) {
  const [personKey, setPersonKey] = useState("");
  const [all, setAll] = useState(false);
  const person = data.people.find(p => `${p.id}:${p.teamId}` === personKey);
  const latest = data.personals.find(p => p.userId === person?.id && p.teamId === person?.teamId);
  const catalog = data.catalog.filter(r => r.teamId === person?.teamId && r.status === "active");
  return (
    <section id="personal-kpi" data-admin-surface="personal-kpi" className="admin-panel">
      <div className="admin-panel-title">
        <h2>KPI รายบุคคล</h2>
        <span className="admin-status-badge admin-status-neutral">งานและ KPI</span>
      </div>
      <label>ผู้รับผิดชอบ<select className="ui-building-field" value={personKey} onChange={e => { setPersonKey(e.target.value); setAll(false); }}>
        <option value="">เลือกผู้รับผิดชอบ</option>
        {data.people.map(p => <option key={`${p.id}:${p.teamId}`} value={`${p.id}:${p.teamId}`}>{p.name} · {data.teams.find(t => t.id === p.teamId)?.name}</option>)}
      </select></label>
      {person && (
        <AdminForm key={`${personKey}:${latest?.version}:${all}`} kind="personal" title="น้ำหนักของคนนี้ (%)">
          <PersonalKpiFields person={person} latest={latest} catalog={catalog} all={all} onUseAll={() => setAll(true)} />
        </AdminForm>
      )}
    </section>
  );
}

function RecalculationPanel({ kind }: { kind: "deadlines" | "kpi_migration" }) {
  const [preview, previewAction, previewPending] = useActionState(previewWorkAdminAction, initial);
  const [result, confirmAction, confirmPending] = useActionState(confirmWorkAdminAction, initial);
  return (
    <section data-admin-surface="recalculate" className="admin-panel">
      <div className="admin-panel-title">
        <h2>{kind === "deadlines" ? "คำนวณกำหนดส่งใหม่" : "ย้าย KPI งานเก่า — ตัวอย่างเท่านั้น"}</h2>
        <span className="admin-status-badge admin-status-neutral">ตรวจผลกระทบก่อนบันทึก</span>
      </div>
      <AdminActionForm action={previewAction}>
        <input type="hidden" name="kind" value={kind} />
        <Button type="submit" variant="secondary" disabled={previewPending || confirmPending}>{previewPending ? "กำลังตรวจผลกระทบ…" : "ดูตัวอย่างผลกระทบ"}</Button>
      </AdminActionForm>
      <p role="status">{preview.message}</p>
      {preview.rows && (
        <>
          <div className="admin-table-wrap" role="region" aria-label="รายการที่จะได้รับผลกระทบ เลื่อนแนวนอนได้" tabIndex={0}>
            <table>
              <caption>รายการที่จะได้รับผลกระทบ</caption>
              <thead>
                <tr>
                  <th scope="col">งาน</th>
                  <th scope="col">เดิม</th>
                  <th scope="col">ใหม่</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map(r => (
                  <tr key={r.taskId}>
                    <td>{r.title}</td>
                    <td>{kind === "deadlines" ? r.beforeDueAt : r.beforeWeight}</td>
                    <td>{kind === "deadlines" ? r.afterDueAt : r.afterWeight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {kind === "deadlines" && preview.rows.length > 0 && (
            <AdminActionForm action={confirmAction}>
              <input type="hidden" name="previewId" value={preview.previewId} />
              <label><input type="checkbox" name="confirm" required /> ยืนยันรายการข้างต้น (ตัวอย่างมีอายุ 15 นาที)</label>
              <Button type="submit" variant="primary" disabled={confirmPending || previewPending || result.ok}>{confirmPending ? "กำลังคำนวณ…" : "ยืนยันคำนวณใหม่"}</Button>
              <p role="status">{result.message}</p>
            </AdminActionForm>
          )}
        </>
      )}
    </section>
  );
}

function SystemsPanel({ data }: { data: WorkAdminData }) {
  const [edit, setEdit] = useState<Partial<WorkAdminData["links"][number]> | undefined>();
  const [revision, setRevision] = useState(0);
  function choose(value: typeof edit) {
    setEdit(value);
    setRevision(r => r + 1);
  }
  return (
    <section id="systems" data-admin-surface="systems" className="admin-panel">
      <div className="admin-panel-title">
        <h2>ลิงก์ระบบ</h2>
        <span className="admin-status-badge admin-status-neutral">พื้นที่ทำงาน</span>
      </div>
      <ul>
        {data.links.map(r => (
          <li key={r.id}>
            {r.name} · {r.status}
            <Button type="button" variant="ghost" onClick={() => choose(r)}>แก้ไข / ซ่อน</Button>
            <Button type="button" variant="ghost" onClick={() => choose({ ...r, id: undefined, version: undefined, name: `${r.name} (สำเนา)` })}>สร้างสำเนา</Button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="secondary" onClick={() => choose(undefined)}>เพิ่ม / ล้างฟอร์ม</Button>
      <AdminForm key={revision} kind="system" title={edit?.id ? "แก้ไขลิงก์" : "เพิ่มลิงก์"}>
        <SystemLinkFields edit={edit} data={data} />
      </AdminForm>
    </section>
  );
}

function RestoreForm({ task }: { task: WorkAdminData["deleted"][number] }) {
  const [state, action, pending] = useActionState(restoreWorkTaskAction, { ok: false, message: "" } as WorkActionState);
  return (
    <AdminActionForm action={action}>
      <span>{task.title}</span>
      <input type="hidden" name="taskId" value={task.id} />
      <input type="hidden" name="version" value={task.version} />
      <input type="hidden" name="idempotencyKey" value={`restore:${task.id}:${task.version}`} />
      <label>เหตุผลที่กู้คืน<input className="ui-building-field" name="reason" required maxLength={1000} /></label>
      <Button type="submit" variant="primary" disabled={pending}>กู้คืนงาน</Button>
      <p role="status">{state.message}</p>
    </AdminActionForm>
  );
}

export function WorkAdminPanels({ data, section }: { data: WorkAdminData; section: string }) {
  return (
    <div className="work-admin-panels">
      {data.granted.kpi && section === "kpi" && <KpiPanel data={data} />}
      {data.granted.kpi && section === "personal-kpi" && <PersonalPanel data={data} />}
      {data.granted.kpi && section === "recalculate" && (
        <>
          <RecalculationPanel kind="deadlines" />
          <RecalculationPanel kind="kpi_migration" />
        </>
      )}
      {data.granted.calendar && section === "calendar" && <CalendarPanel data={data} />}
      {data.granted.systems && section === "systems" && <SystemsPanel data={data} />}
      {data.granted.announcement && section === "announcement" && (
        <section id="announcement" data-admin-surface="announcement" className="admin-panel">
          <div className="admin-panel-title">
            <h2>ประกาศแอดมิน</h2>
            <span className="admin-status-badge admin-status-neutral">พื้นที่ทำงาน</span>
          </div>
          {data.announcements.map(r => (
            <AdminForm key={`${r.id}:${r.version}`} kind="announcement" title="แก้ไขประกาศ">
              <Version id={r.id} version={r.version} />
              <AnnouncementFormFields announcement={r} />
            </AdminForm>
          ))}
          <AdminForm kind="announcement" title="เพิ่มประกาศ">
            <AnnouncementFormFields announcement={undefined} required />
          </AdminForm>
        </section>
      )}
      {section === "restore" && (
        <section data-admin-surface="restore" className="admin-panel">
          <div className="admin-panel-title">
            <h2>กู้คืนงานที่ลบ</h2>
            <span className="admin-status-badge admin-status-neutral">ตรวจสอบย้อนหลัง</span>
          </div>
          {data.deleted.length ? data.deleted.map(task => <RestoreForm key={task.id} task={task} />) : <p className="admin-empty">ไม่มีงานที่รอกู้คืนในขอบเขตสิทธิ์ของคุณ</p>}
        </section>
      )}
    </div>
  );
}
