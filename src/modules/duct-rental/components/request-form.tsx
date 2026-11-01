"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { TableRegion } from "@/components/ui/table-region";
import { DuctRentalSchema } from "../schemas/design";
import { DesignEditor, type DesignValues } from "./design-editor";
import { AttachmentPicker } from "./attachment-picker";
import { ApiError, apiPost, errorText, type RequestDetail } from "./api-client";
import { Modal, Notice } from "./common";
import { useResource } from "./use-resource";
import { RequestFormShell, RequestStatusBadge, RequestTabs, type RequestTab } from "../ui-request";
import { DuctModuleNav, DuctSyncUtility, announce } from "../ui-shared";
import styles from "../ui-request/ui-request.module.css";
export type FormIdentity = { id: string; displayName: string; email: string };
export type FormOptions = { teams: { id: string; name: string }[]; coordinators: { id: string; display_name: string; email: string; phone: string }[] };
const required = ["projectName", "routeName", "ownerDuct", "routeDetail", "jobType", "serviceCenter", "cableType", "fiberType", "diameter", "distance", "startCoords", "endCoords", "district", "province"];

type RequestSync = { online: boolean; error: string; at?: string; refresh: () => unknown; changed?: boolean; realtime?: string };

export function RequestForm({ request, user, permissions, pause, sync }: { request?: RequestDetail; user: FormIdentity; permissions: string[]; pause?: (paused: boolean) => void; sync?: RequestSync }) {
  const router = useRouter();
  const [values, setValues] = useState<DesignValues>(request ? Object.fromEntries(Object.entries(request.design).filter(([, value]) => value !== undefined)) as DesignValues : { requestType: "NEW", ownerDuct: "NT", jobType: "Network", designContactName: user.displayName, designContactEmail: user.email });
  const [version, setVersion] = useState(request?.version ?? 1), [savedId, setSavedId] = useState(request?.id), [teamId, setTeamId] = useState(request?.teamId ?? "");
  const [memo, setMemo] = useState<File | null>(null), [drawing, setDrawing] = useState<File | null>(null), [coordinatorId, setCoordinatorId] = useState("");
  const [busy, setBusy] = useState(false), [dirty, setDirty] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState(""), [errors, setErrors] = useState<Record<string, string>>({}), [confirm, setConfirm] = useState(false), [section, setSection] = useState("design");
  const readonly = !!request && (request.phase === "COMPLETE" || request.archivedAt != null || request.cancelledAt != null);
  const autoCoordinator = useRef("");
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const options = useResource<FormOptions>(`options?center=${encodeURIComponent(String(values.serviceCenter ?? ""))}`);
  useEffect(() => {
    const people = options.data?.coordinators;
    if (!people?.length || !values.serviceCenter || readonly || autoCoordinator.current === `${values.serviceCenter}:${people[0].id}`) return;
    let active = true;
    // Source auto-selects the first mapped coordinator. Core supplies the reviewed mapping.
    void Promise.resolve().then(() => {
      if (!active) return;
      const person = people[0];
      autoCoordinator.current = `${values.serviceCenter}:${person.id}`;
      setCoordinatorId(person.id);
      setValues(previous => ({ ...previous, installContactName: person.display_name, installContactEmail: person.email, installContactPhone: person.phone }));
      announce(`เลือกผู้ประสานงานอัตโนมัติ ${person.display_name}`);
    });
    return () => { active = false; };
  }, [options.data, values.serviceCenter, readonly]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const caps = request?.capabilities ?? permissions;
  const canSave = !readonly && caps.includes(savedId ? "duct_rental.request.update" : "duct_rental.request.create");
  const canSubmit = !readonly && (!request || request.phase === "DESIGN") && caps.includes("duct_rental.design.submit") && (savedId ? true : caps.includes("duct_rental.request.create"));
  const change = (next: DesignValues) => { if (next.serviceCenter !== values.serviceCenter) { autoCoordinator.current = ""; setCoordinatorId(""); } setValues(next); setDirty(true); pause?.(true); setMessage(""); };
  const save = async (submit: boolean) => {
    setError(""); setErrors({}); setMessage("");
    if (submit) {
      const valid = DuctRentalSchema.safeParse(values);
      if (!valid.success) { setErrors(Object.fromEntries(valid.error.issues.map(issue => [issue.path.join("."), issue.message]))); setError("กรุณาตรวจช่องที่ระบุ ก่อนส่งคำขอ"); setSection("design"); announce("พบข้อผิดพลาดในการตรวจสอบ กรุณาตรวจช่องที่ระบุ", "assertive"); return; }
    }
    setBusy(true); pause?.(true); announce(submit ? "กำลังส่งคำขอ" : "กำลังบันทึกร่าง");
    try {
      let id = savedId, currentVersion = version;
      if (!id) { const created = await apiPost<{ id: string; version: number }>("requests", { design: values, teamId: teamId || null, draft: !submit }); id = created.id; currentVersion = created.version; setSavedId(id); setVersion(currentVersion); }
      else if (!submit) { const saved = await apiPost(`requests/${id}/save`, { version: currentVersion, data: { design: values } }); currentVersion = saved.version; setVersion(currentVersion); }
      for (const [file, fileType] of [[memo, "memo"], [drawing, "duct_drawing"]] as const) if (file) {
        const form = new FormData(); form.set("version", String(currentVersion)); form.set("fileType", fileType); form.set("file", file);
        const uploaded = await apiPost(`requests/${id}/documents`, form); currentVersion = uploaded.version; setVersion(currentVersion);
        if (fileType === "memo") setMemo(null); else setDrawing(null);
      }
      if (submit) { await apiPost(`requests/${id}/submit`, { version: currentVersion, data: { design: values } }); announce("ส่งคำขอเรียบร้อยแล้ว"); router.push(`/duct-rental/${id}/draftsman?created=1`); }
      else { setMessage("บันทึกร่างเรียบร้อยแล้ว"); setDirty(false); pause?.(false); announce("บันทึกร่างเรียบร้อยแล้ว"); }
    } catch (reason) {
      setError(errorText(reason)); announce(`บันทึกไม่สำเร็จ: ${errorText(reason)}`, "assertive"); if (reason instanceof ApiError) setErrors(Object.fromEntries(reason.fields.map(field => [field.path.replace(/^design\./, ""), field.message])));
    } finally { setBusy(false); }
  };
  const leave = (event: MouseEvent<HTMLAnchorElement>) => { if (busy || dirty) { event.preventDefault(); if (!busy) setLeaveTo(event.currentTarget.href); } };
  const sectionTabs: RequestTab[] = [
    { id: "design", label: "Design" }, { id: "documents", label: "Documents" }, { id: "review", label: "Review" },
    { id: "nt-form", label: "NT Form" }, { id: "signing", label: "Signing" }, { id: "complete", label: "Complete", disabled: !request || request.phase !== "COMPLETE" },
  ];
  const documents = caps.includes("duct_rental.document.upload") && !readonly ? <Panel title="เอกสารจากทีมออกแบบ"><div className={styles.attachmentStack}><AttachmentPicker label="Memo (ถ้ามี)" file={memo} change={file => { setMemo(file); setDirty(true); pause?.(true); }} /><AttachmentPicker label="แบบท่อจากทีมออกแบบ (ถ้ามี)" file={drawing} change={file => { setDrawing(file); setDirty(true); pause?.(true); }} /></div></Panel> : <EmptyState title="ไม่มีเอกสารที่ต้องแนบ" description="คุณสามารถดำเนินการต่อได้โดยไม่แนบเอกสาร" />;
  return <div className={`${styles.workspace} ${styles.ductSurface} ${styles.ductForm}`} data-ui-screen={request ? "duct-rental-request-edit" : "duct-rental-request-new"}>
    <PageHeader title={request ? `แก้ไขคำขอ ${request.code}` : "สร้างคำขอเช่าท่อร้อยสาย"} parent={{ label: "เช่าท่อร้อยสาย", href: "/duct-rental" }} description="บันทึกร่างได้ และกรอกข้อมูลให้ครบก่อนส่งให้ทีมเขียนแบบ" />
    <DuctModuleNav current="requests" />
    {sync && <DuctSyncUtility {...sync} paused={busy || dirty} />}
    <div className={styles.formStatus} aria-live="polite"><RequestStatusBadge label={readonly ? "อ่านอย่างเดียว" : dirty ? "ยังไม่ได้บันทึก" : "พร้อมดำเนินการ"} tone={error ? "danger" : dirty ? "warning" : "success"} description={message || undefined} /><StatusBadge label={sync?.online === false ? "ออฟไลน์" : "พร้อมแก้ไข"} tone={sync?.online === false ? "warning" : "info"} /></div>
    <Notice text={error} error /><Notice text={message} />{readonly && <Notice text="คำขอนี้สิ้นสุดแล้ว ข้อมูลออกแบบแสดงแบบอ่านอย่างเดียว" />}
    <RequestTabs tabs={sectionTabs} activeTab={section} onChange={setSection} label="ส่วนของคำขอ" selectionMode="radiogroup" />
    <form noValidate onSubmit={event => { event.preventDefault(); setConfirm(true); }}>
      <fieldset disabled={busy} className={styles.formFieldset}>
        <RequestFormShell form={<div className={styles.requestFormContent}>
          {section === "design" && <DesignEditor values={values} change={change} errors={errors} readonly={!canSave && !canSubmit} />}
          {section === "documents" && documents}
          {section === "review" && <Panel title="Review"><TableRegion label="ตารางตรวจสอบข้อมูลคำขอ เลื่อนแนวนอนได้" className={styles.reviewTableWrap}><table className={styles.reviewTable}><caption className={styles.visuallyHidden}>ข้อมูลที่กรอกในแบบคำขอ</caption><thead><tr><th scope="col">รายการ</th><th scope="col">ข้อมูล</th></tr></thead><tbody>{required.map(name => <tr key={name}><th scope="row">{name}</th><td>{String(values[name] ?? "—") || "—"}</td></tr>)}</tbody></table></TableRegion></Panel>}
          {section === "nt-form" && <Panel title="NT Form"><p className={styles.muted}>ตรวจสอบข้อมูล Design และเอกสารให้ครบก่อนดำเนินการ</p></Panel>}
          {section === "signing" && <Panel title="Signing"><p className={styles.muted}>ยังไม่สามารถลงนามได้ในขั้นตอนออกแบบ</p></Panel>}
          {section === "complete" && <Panel title="Complete"><p>คำขอนี้เสร็จสมบูรณ์แล้ว</p></Panel>}
        </div>} coordinatorPanel={<div className={styles.coordinatorStack}>
          {!request && <Panel title="ทีมเจ้าของคำขอ"><FormField label="ทีมเจ้าของคำขอ"><select value={teamId} disabled={busy || !canSave} onChange={event => setTeamId(event.target.value)}><option value="">ไม่ระบุทีม</option>{options.data?.teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></FormField></Panel>}
          {!readonly && <Panel title="เลือกผู้ประสานหน้างาน"><FormField label="ผู้ประสานงานตามศูนย์บริการ"><select value={coordinatorId} disabled={!canSave && !canSubmit} onChange={event => { const person = options.data?.coordinators.find(item => item.id === event.target.value); setCoordinatorId(event.target.value); if (person) change({ ...values, installContactName: person.display_name, installContactEmail: person.email, installContactPhone: person.phone }); }}><option value="">กรอกข้อมูลผู้ประสานงานเอง</option>{options.data?.coordinators.map(person => <option key={person.id} value={person.id}>{person.display_name}</option>)}</select></FormField>{!options.data?.coordinators.length && <EmptyState title="ไม่พบผู้ประสานงาน" description="สามารถกรอกชื่อและข้อมูลติดต่อเองได้" />}<Notice text={options.error} error /></Panel>}
          {documents}
        </div>} />
      </fieldset>
      <div className={`${styles.formToolbar} ${styles.sticky}`}><span className={styles.muted}>กรอกแล้ว {required.filter(name => !!values[name]).length}/{required.length} ช่องที่จำเป็น · {busy ? "กำลังบันทึก…" : dirty ? "ยังไม่ได้บันทึก" : message || "พร้อมดำเนินการ"}</span><div className={styles.actions}><ButtonLink variant="ghost" href={savedId ? `/duct-rental/${savedId}` : "/duct-rental"} onClick={leave}>กลับ</ButtonLink><Button disabled={busy || !canSave} onClick={() => void save(false)}>บันทึกร่าง</Button><Button variant="primary" type="submit" disabled={busy || !canSubmit}>ส่งให้ทีมเขียนแบบ</Button></div></div>
    </form>
    {confirm && <Modal title="ยืนยันส่งคำขอ" busy={busy} close={() => setConfirm(false)}><p>ตรวจสอบข้อมูลและไฟล์แนบก่อนส่งให้ทีมเขียนแบบ เมื่อส่งแล้วข้อมูลออกแบบจะเป็นอ่านอย่างเดียว</p><div className={styles.actions}><Button variant="ghost" disabled={busy} onClick={() => setConfirm(false)}>กลับไปตรวจข้อมูล</Button><Button variant="primary" disabled={busy} onClick={() => { setConfirm(false); void save(true); }}>ยืนยันส่งคำขอ</Button></div></Modal>}
    <ConfirmDialog open={!!leaveTo} title="ทิ้งข้อมูลที่ยังไม่ได้บันทึกหรือไม่" consequence="ข้อมูลและไฟล์ที่ยังไม่บันทึกจะไม่ถูกเก็บ" confirmLabel="ทิ้งข้อมูล" pending={busy} onCancel={() => setLeaveTo(null)} onConfirm={() => { if (leaveTo) router.push(leaveTo); }} />
  </div>;
}
export function RequestEdit({ id, user, permissions }: { id: string; user: FormIdentity; permissions: string[] }) {
  const [paused, setPaused] = useState(false), model = useResource<RequestDetail>(`requests/${id}`, paused);
  if (!model.data) {
    if (model.loading) return <PageSkeleton shape="detail" />;
    return (
      <div className={styles.workspace} data-ui-state="error">
        <Notice text="โหลดคำขอไม่สำเร็จ กรุณาลองอีกครั้ง" error />
        <ErrorState embedded reset={() => void model.refresh()} />
        <Button type="button" onClick={() => void model.refresh()}>ลองโหลดอีกครั้ง</Button>
        <Link href="/duct-rental">กลับรายการคำขอ</Link>
      </div>
    );
  }
  return <RequestForm key={`${id}:${model.data.version}`} request={model.data} user={user} permissions={permissions} pause={setPaused} sync={model} />;
}
