import { notFound } from "next/navigation";
import Link from "next/link";
import { AccessDenied } from "@/components/access-denied";
import { DepositEditor } from "@/components/deposit-editor";
import { DepositTlWorkspace } from "@/components/deposit-tl-workspace";
import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { getOutstandingAmount, getWorkflowStatusKey, parseMoney, workflowLabels } from "@/lib/deposit-v2-domain";
import { canWorkAsAssignedTl, getDepositWorkEvents, getDepositWorkItem, listTlAssignees } from "@/lib/deposit-v2-server";
import "../deposit.css";

export default async function DepositDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, access] = await Promise.all([params, getAccessContext("guarantees")]);
  if (!access.allowed) return <AccessDenied moduleName="เงินประกันอาคาร" />;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const item = await getDepositWorkItem(id);
  if (!item) notFound();
  const events = await getDepositWorkEvents(id);
  const manager = isAuthorized(access.subject, "guarantee.case.update", { ownerId: item.ownerId, teamId: item.teamId }) || isAuthorized(access.subject, "guarantee.case.manage", { ownerId: item.ownerId, teamId: item.teamId });
  if (!manager && canWorkAsAssignedTl(access, item)) return <DepositTlWorkspace item={item} />;
  if (!manager) {
    const currentKey = getWorkflowStatusKey(item);
    const steps = [["new", "ข้อมูลทั่วไป"], ["fin", "การเงิน"], ["att", "เอกสาร"], ["tl_wait", "ทีมติดตั้ง"], ["ret", "ขอคืนเงิน"], ["clo", "ปิดงาน"], ["done", "เสร็จสิ้น"]] as const;
    const stageMap: Record<string, number> = { new: 0, fin: 1, att: 2, tl_wait: 3, tl_process: 3, ret: 4, refund_process: 4, clo: 5, done: 6, on_service: 6, off_service_pending: 6, cancel: 0 };
    const stage = stageMap[currentKey] ?? 0;
    const total = parseMoney(item.deposit) + parseMoney(item.demolish) + parseMoney(item.fee) + parseMoney(item.other);
    const evidence = [["หลักฐานการจ่าย", item.pdf_payment], ["แบบ Drawing", item.pdf_layout], ["เอกสารเพิ่มเติม", item.pdf_additional], ["หลักฐานงานทีมติดตั้ง", item.pdf_tl_work], ["เอกสารทีมติดตั้งเพิ่มเติม", item.pdf_tl_extra], ["หลักฐานปิดงาน", item.pdf_user_final], ["หลักฐาน Off Service", item.pdf_demo_off]];
    return <div className="deposit-detail legacy-detail"><div className="deposit-detail-head"><div><p className="eyebrow">เงินประกันอาคาร / รายละเอียดรายการ</p><h1>{item.place}</h1><p className="sub">#{item.id_firestore || item.id} · {item.project || "—"} · {item.area || "—"}</p></div><div className="legacy-detail-actions"><span className={`deposit-status status-${currentKey}`}>{workflowLabels[currentKey]}</span><Link href="/guarantees">← กลับรายการ</Link></div></div>
      <section className="legacy-progress" aria-label="ขั้นตอนการดำเนินงาน">{steps.map(([key, label], index) => <div key={key} className={index < stage ? "done" : index === stage ? "current" : ""}><span>{index < stage ? "✓" : index + 1}</span><small>{label}</small></div>)}</section>
      <div className="deposit-detail-grid"><main className="deposit-side"><section className="deposit-panel"><h2>ข้อมูลหลัก</h2><dl className="deposit-readonly legacy-readonly">
        <div><dt>ลูกค้า</dt><dd>{item.customer || "—"}</dd></div><div><dt>เจ้าของงาน</dt><dd>{item.owner || "—"}</dd></div><div><dt>พื้นที่</dt><dd>{item.area || "—"}</dd></div><div><dt>Project Code</dt><dd>{item.project || "—"}</dd></div>
        <div><dt>PR No.</dt><dd>{item.pr || "—"}</dd></div><div><dt>CID</dt><dd className="legacy-cid">{item.cid || "—"}</dd></div><div><dt>ทีมติดตั้ง</dt><dd>{item.tl_team || "—"}</dd></div><div><dt>ผู้ประสานงาน</dt><dd>{item.contact || "—"}</dd></div>
        <div><dt>วันที่ตั้งเบิก</dt><dd>{item.dateReq || "—"}</dd></div><div><dt>กำหนดตรวจรับทีมติดตั้ง</dt><dd>{item.tl_due_date || "—"}</dd></div><div><dt>เบอร์โทร</dt><dd>{item.mobile || item.tel || "—"}</dd></div><div><dt>หมายเหตุ</dt><dd>{item.note || "—"}</dd></div>
      </dl></section>
      <section className="deposit-panel"><h2>ไฟล์แนบทั้งหมดของงาน</h2><div className="legacy-evidence-grid">{evidence.map(([label, value]) => <div key={label}><span>{value ? "✓" : "—"}</span><div><strong>{label}</strong><small>{value ? "มีไฟล์แล้ว" : "ยังไม่มีไฟล์"}</small></div></div>)}</div></section>
      <section className="deposit-panel deposit-history"><h2>ประวัติการทำงาน</h2>{events.map((event) => <p key={event.id}>{event.occurredAt.toLocaleString("th-TH")} · {event.action === "transition" ? `${event.fromStatus} → ${event.toStatus}` : event.action}{event.reason ? ` · ${event.reason}` : ""}</p>)}{!events.length && <p>ยังไม่มีประวัติ</p>}</section></main>
      <aside className="deposit-side"><section className="deposit-panel legacy-finance"><h2>ข้อมูลสรุปค่าใช้จ่าย</h2><dl><div><dt>เงินประกันติดตั้ง</dt><dd>฿{parseMoney(item.deposit).toLocaleString("th-TH")}</dd></div><div><dt>เงินประกันรื้อถอน</dt><dd>฿{parseMoney(item.demolish).toLocaleString("th-TH")}</dd></div><div><dt>ค่าธรรมเนียมอาคาร</dt><dd>฿{parseMoney(item.fee).toLocaleString("th-TH")}</dd></div><div><dt>ค่าใช้จ่ายอื่น {item.other_desc ? `(${item.other_desc})` : ""}</dt><dd>฿{parseMoney(item.other).toLocaleString("th-TH")}</dd></div><div className="total"><dt>ยอดรวมสุทธิ</dt><dd>฿{total.toLocaleString("th-TH")}</dd></div><div className="refund"><dt>เงินประกันที่ต้องได้รับคืน</dt><dd>฿{getOutstandingAmount(item).toLocaleString("th-TH")}</dd></div></dl></section>
      <section className="deposit-panel"><h2>สถานะการคืนเงิน</h2><dl><div><dt>ประกันติดตั้ง</dt><dd>{item.depReturn === "Yes" ? "คืนแล้ว" : "ยังไม่คืน"}</dd></div><div><dt>ประกันรื้อถอน</dt><dd>{item.demoReturn === "Yes" ? "คืนแล้ว" : "ยังไม่คืน"}</dd></div><div><dt>วันที่คืนเงิน</dt><dd>{item.date_return || "—"}</dd></div><div><dt>Off Service</dt><dd>{item.off_service_status || "—"}</dd></div></dl></section></aside></div></div>;
  }
  return <DepositEditor item={item} assignees={await listTlAssignees()} events={events.map((event) => ({ ...event, occurredAt: event.occurredAt.toISOString() }))} />;
}
