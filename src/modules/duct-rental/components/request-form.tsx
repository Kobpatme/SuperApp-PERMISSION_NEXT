"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DuctRentalSchema } from "../schemas/design";
import { DesignEditor, type DesignValues } from "./design-editor";
import { AttachmentPicker } from "./attachment-picker";
import { ApiError, apiPost, errorText, type RequestDetail } from "./api-client";
import { Field, Modal, ModuleNav, Notice } from "./common";
import { useResource } from "./use-resource";
import styles from "./workspace.module.css";
export type FormIdentity = { id: string; displayName: string; email: string };
export type FormOptions = { teams: { id: string; name: string }[]; coordinators: { id: string; display_name: string; email: string; phone: string }[] };
export function RequestForm({ request, user, permissions, pause }: { request?: RequestDetail; user: FormIdentity; permissions: string[]; pause?: (paused: boolean) => void }) {
  const router = useRouter();
  const [values, setValues] = useState<DesignValues>(request ? Object.fromEntries(Object.entries(request.design).filter(([, value]) => value !== undefined)) as DesignValues : { requestType: "NEW", ownerDuct: "NT", jobType: "Network", designContactName: user.displayName, designContactEmail: user.email });
  const [version, setVersion] = useState(request?.version ?? 1), [savedId, setSavedId] = useState(request?.id), [teamId, setTeamId] = useState(request?.teamId ?? "");
  const [memo, setMemo] = useState<File | null>(null), [drawing, setDrawing] = useState<File | null>(null), [coordinatorId, setCoordinatorId] = useState("");
  const [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState(""), [errors, setErrors] = useState<Record<string, string>>({}), [confirm, setConfirm] = useState(false);
  const readonly = !!request && (request.phase !== "DESIGN" || request.archivedAt != null || request.cancelledAt != null);
  const autoCoordinator = useRef("");
  const options = useResource<FormOptions>(`options?center=${encodeURIComponent(String(values.serviceCenter ?? ""))}`);
  useEffect(() => {
    const people = options.data?.coordinators;
    if (people?.length !== 1 || !values.serviceCenter || readonly || autoCoordinator.current === `${values.serviceCenter}:${people[0].id}`) return;
    let active = true;
    // Source auto-selects a sole coordinator. Core supplies the reviewed mapping.
    void Promise.resolve().then(() => {
      if (!active) return;
      const person = people[0];
      autoCoordinator.current = `${values.serviceCenter}:${person.id}`;
      setCoordinatorId(person.id);
      setValues(previous => ({ ...previous, installContactName: person.display_name, installContactEmail: person.email, installContactPhone: person.phone }));
    });
    return () => { active = false; };
  }, [options.data, values.serviceCenter, readonly]);
  const caps = request?.capabilities ?? permissions;
  const canSave = !readonly && caps.includes(savedId ? "duct_rental.request.update" : "duct_rental.request.create");
  const canSubmit = !readonly && caps.includes("duct_rental.design.submit") && (savedId ? true : caps.includes("duct_rental.request.create"));
  const change = (next: DesignValues) => { if (next.serviceCenter !== values.serviceCenter) { autoCoordinator.current = ""; setCoordinatorId(""); } setValues(next); setDirty(true); pause?.(true); setMessage(""); };
  const save = async (submit: boolean) => {
    setError(""); setErrors({}); setMessage("");
    if (submit) {
      const valid = DuctRentalSchema.safeParse(values);
      if (!valid.success) { setErrors(Object.fromEntries(valid.error.issues.map(issue => [issue.path.join("."), issue.message]))); setError("กรุณาตรวจช่องที่ระบุ ก่อนส่งคำขอ"); return; }
    }
    setBusy(true); pause?.(true);
    try {
      let id = savedId, currentVersion = version;
      if (!id) { const created = await apiPost<{ id: string; version: number }>("requests", { design: values, teamId: teamId || null, draft: !submit }); id = created.id; currentVersion = created.version; setSavedId(id); setVersion(currentVersion); }
      else if (!submit) { const saved = await apiPost(`requests/${id}/save`, { version: currentVersion, data: { design: values } }); currentVersion = saved.version; setVersion(currentVersion); }
      for (const [file, fileType] of [[memo, "memo"], [drawing, "duct_drawing"]] as const) if (file) {
        const form = new FormData(); form.set("version", String(currentVersion)); form.set("fileType", fileType); form.set("file", file);
        const uploaded = await apiPost(`requests/${id}/documents`, form); currentVersion = uploaded.version; setVersion(currentVersion);
        if (fileType === "memo") setMemo(null); else setDrawing(null);
      }
      if (submit) { await apiPost(`requests/${id}/submit`, { version: currentVersion, data: { design: values } }); router.push(`/duct-rental/${id}/draftsman?created=1`); }
      else { setMessage("บันทึกร่างเรียบร้อยแล้ว"); setDirty(false); pause?.(false); }
    } catch (reason) {
      setError(errorText(reason)); if (reason instanceof ApiError) setErrors(Object.fromEntries(reason.fields.map(field => [field.path.replace(/^design\./, ""), field.message])));
    } finally { setBusy(false); }
  };
  const required = ["projectName", "routeName", "ownerDuct", "routeDetail", "jobType", "serviceCenter", "cableType", "fiberType", "diameter", "distance", "startCoords", "endCoords", "district", "province"];
  return <div className={styles.workspace}>
    <PageHeader title={request ? `แก้ไขคำขอ ${request.code}` : "สร้างคำขอเช่าท่อร้อยสาย"} parent={{ label: "เช่าท่อร้อยสาย", href: "/duct-rental" }} description="บันทึกร่างได้ และกรอกข้อมูลให้ครบก่อนส่งให้ทีมเขียนแบบ" />
    <ModuleNav /><Notice text={error} error /><Notice text={message} />
    {readonly && <Notice text="คำขอนี้ผ่านขั้นออกแบบแล้ว ข้อมูลออกแบบแสดงแบบอ่านอย่างเดียว" />}
    <form noValidate onSubmit={event => { event.preventDefault(); setConfirm(true); }} className={styles.workspace}>
      {!request && <section className={styles.panel}><Field label="ทีมเจ้าของคำขอ"><select value={teamId} disabled={busy || !canSave} onChange={event => setTeamId(event.target.value)}><option value="">ไม่ระบุทีม</option>{options.data?.teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></Field></section>}
      <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}><div className={styles.workspace}><DesignEditor values={values} change={change} errors={errors} readonly={!canSave && !canSubmit} />
      {!readonly && <section className={styles.panel}><h2>เลือกผู้ประสานหน้างาน</h2><Field label="ผู้ประสานงานตามศูนย์บริการ"><select value={coordinatorId} disabled={!canSave && !canSubmit} onChange={event => { const person = options.data?.coordinators.find(item => item.id === event.target.value); setCoordinatorId(event.target.value); if (person) change({ ...values, installContactName: person.display_name, installContactEmail: person.email, installContactPhone: person.phone }); }}><option value="">กรอกข้อมูลผู้ประสานงานเอง</option>{options.data?.coordinators.map(person => <option key={person.id} value={person.id}>{person.display_name}</option>)}</select></Field>{!options.data?.coordinators.length && <p className={styles.muted}>ไม่พบผู้ประสานงานในศูนย์นี้ สามารถกรอกชื่อและข้อมูลติดต่อเองได้</p>}<Notice text={options.error} error /></section>}
      {caps.includes("duct_rental.document.upload") && !readonly && <section className={styles.panel}><h2>เอกสารจากทีมออกแบบ</h2><div className={styles.grid}><AttachmentPicker label="Memo (ถ้ามี)" file={memo} change={file => { setMemo(file); setDirty(true); pause?.(true); }} /><AttachmentPicker label="แบบท่อจากทีมออกแบบ (ถ้ามี)" file={drawing} change={file => { setDrawing(file); setDirty(true); pause?.(true); }} /></div></section>}
      </div></fieldset>
      <div className={`${styles.toolbar} ${styles.sticky}`}><span className={styles.muted}>กรอกแล้ว {required.filter(name => !!values[name]).length}/{required.length} ช่องที่จำเป็น · {busy ? "กำลังบันทึก…" : dirty ? "ยังไม่ได้บันทึก" : message || "พร้อมดำเนินการ"}</span><div className={styles.actions}><Link className={styles.button} href={savedId ? `/duct-rental/${savedId}` : "/duct-rental"}>กลับ</Link><button className={styles.button} type="button" disabled={busy || !canSave} onClick={() => void save(false)}>บันทึกร่าง</button><button className={styles.primary} type="submit" disabled={busy || !canSubmit}>ส่งให้ทีมเขียนแบบ</button></div></div>
    </form>
    {confirm && <Modal title="ยืนยันส่งคำขอ" close={() => setConfirm(false)}><p>ตรวจสอบข้อมูลและไฟล์แนบก่อนส่งให้ทีมเขียนแบบ เมื่อส่งแล้วข้อมูลออกแบบจะเป็นอ่านอย่างเดียว</p><div className={styles.actions}><button className={styles.button} type="button" onClick={() => setConfirm(false)}>กลับไปตรวจข้อมูล</button><button className={styles.primary} type="button" onClick={() => { setConfirm(false); void save(true); }}>ยืนยันส่งคำขอ</button></div></Modal>}
  </div>;
}
export function RequestEdit({ id, user, permissions }: { id: string; user: FormIdentity; permissions: string[] }) {
  const [paused, setPaused] = useState(false), model = useResource<RequestDetail>(`requests/${id}`, paused);
  if (!model.data) return <div className={styles.workspace}><Notice text={model.error || "กำลังโหลดคำขอ…"} error={!!model.error} /><Link href="/duct-rental">กลับรายการคำขอ</Link></div>;
  return <RequestForm key={`${id}:${model.data.version}`} request={model.data} user={user} permissions={permissions} pause={setPaused} />;
}
