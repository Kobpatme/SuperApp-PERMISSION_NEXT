"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { guaranteeWorkEvents, guaranteeWorkItems } from "@/db/schema";
import { getAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";
import { canWorkAsAssignedTl, getDepositWorkItem, listTlAssignees } from "@/lib/deposit-v2-server";
import { isOnServiceItem, isOffServicePendingItem } from "@/lib/deposit-v2-domain";
import { depositItemInputSchema, depositStatusSchema, validateDepositTransition } from "@/lib/deposit-v2-workflow";
import { getInstallationTeamForArea } from "@/lib/installation-team-context";

export type DepositActionState = { ok: boolean; message: string; id?: string };
const invalid: DepositActionState = { ok: false, message: "ไม่สามารถบันทึกข้อมูลได้" };

function inputFromForm(form: FormData) {
  return Object.fromEntries([
    "place", "area", "customer", "cid", "pr", "contact", "tel", "mobile", "project", "deal", "no",
    "payTo", "payType", "detail", "note", "tl_team", "inspected_by",
    "deposit", "demolish", "fee", "other", "other_desc", "dateReq", "dateDue", "dateCheck", "dateAcc", "install_date",
    "tl_due_date", "date_return", "service_cancel_date", "depReturn", "demoReturn",
  ].map((key) => [key, String(form.get(key) ?? "")]));
}

export async function saveDepositWorkItem(_previous: DepositActionState, form: FormData): Promise<DepositActionState> {
  const access = await getAccessContext("guarantees");
  if (!access.allowed || access.isDevelopmentSession || !process.env.DATABASE_URL) return { ...invalid, message: "ต้องเชื่อมบัญชีและฐานข้อมูลกลางก่อนบันทึก" };
  const parsed = depositItemInputSchema.safeParse(inputFromForm(form));
  if (!parsed.success) return { ...invalid, message: parsed.error.issues[0]?.message || invalid.message };
  const id = String(form.get("id") || "");
  const tlAssigneeId = String(form.get("tlAssigneeId") || "");
  if (tlAssigneeId && !(await listTlAssignees()).some((person) => person.id === tlAssigneeId)) return { ...invalid, message: "ผู้รับมอบหมายทีมติดตั้งไม่ถูกต้อง" };
  const version = Number(form.get("version"));
  const now = new Date();
  try {
    const targetTeam = await getInstallationTeamForArea(parsed.data.area);
    if (!targetTeam) return { ...invalid, message: "พื้นที่นี้ยังไม่ได้ผูกกับทีมติดตั้ง กรุณาติดต่อผู้ดูแลระบบ" };
    if (!id) {
      if (!isAuthorized(access.subject, "guarantee.case.create", { ownerId: access.userId, teamId: targetTeam.id }) && !isAuthorized(access.subject, "guarantee.case.manage", { ownerId: access.userId, teamId: targetTeam.id })) return { ...invalid, message: "ไม่มีสิทธิ์สร้างรายการให้ทีมติดตั้งพื้นที่นี้" };
      const result = await getDb().transaction(async (tx) => {
        const [row] = await tx.insert(guaranteeWorkItems).values({ ownerId: access.userId, teamId: targetTeam.id, tlAssigneeId: tlAssigneeId || null, status: "new", place: parsed.data.place,
          area: parsed.data.area || null, data: parsed.data, updatedAt: now }).returning({ id: guaranteeWorkItems.id });
        await tx.insert(guaranteeWorkEvents).values({ itemId: row.id, actorId: access.userId, action: "create", toStatus: "new", occurredAt: now });
        return row;
      });
      revalidatePath("/guarantees");
      return { ok: true, message: "สร้างรายการแล้ว", id: result.id };
    }
    const item = await getDepositWorkItem(id);
    if (!item || (!isAuthorized(access.subject, "guarantee.case.update", { ownerId: item.ownerId, teamId: item.teamId }) && !isAuthorized(access.subject, "guarantee.case.manage", { ownerId: item.ownerId, teamId: item.teamId }))) return { ...invalid, message: "ไม่พบรายการหรือไม่มีสิทธิ์แก้ไข" };
    if (!isAuthorized(access.subject, "guarantee.case.update", { ownerId: item.ownerId, teamId: targetTeam.id }) && !isAuthorized(access.subject, "guarantee.case.manage", { ownerId: item.ownerId, teamId: targetTeam.id })) return { ...invalid, message: "ไม่มีสิทธิ์ย้ายรายการไปทีมติดตั้งพื้นที่นี้" };
    if (!Number.isInteger(version) || version !== item.version) return { ...invalid, message: "ข้อมูลมีการเปลี่ยนแปลง กรุณาโหลดใหม่" };
    const startingOffService = !item.service_cancel_date && Boolean(parsed.data.service_cancel_date);
    const completingOffService = item.demoReturn !== "Yes" && parsed.data.demoReturn === "Yes";
    if (startingOffService && !isOnServiceItem(item)) return { ...invalid, message: "เริ่ม Off Service ได้จากรายการ On Service เท่านั้น" };
    if (completingOffService && (!isOffServicePendingItem({ ...item, service_cancel_date: parsed.data.service_cancel_date }) || !item.pdf_demo_off)) {
      return { ...invalid, message: "ต้องแจ้งยกเลิกบริการและแนบหลักฐาน Off Service ก่อนคืนประกันรื้อถอน" };
    }
    await getDb().transaction(async (tx) => {
      const updated = await tx.update(guaranteeWorkItems).set({ place: parsed.data.place, area: parsed.data.area || null, teamId: targetTeam.id, tlAssigneeId: tlAssigneeId || null,
        data: { ...item, ...parsed.data, pdf_payment: item.pdf_payment || "", pdf_layout: item.pdf_layout || "",
          pdf_additional: item.pdf_additional || "", pdf_tl_work: item.pdf_tl_work || "", pdf_tl_extra: item.pdf_tl_extra || "",
          pdf_user_final: item.pdf_user_final || "", pdf_demo_off: item.pdf_demo_off || "",
          depReturn: ["clo", "done"].includes(item.status) ? "Yes" : parsed.data.depReturn,
          off_service_requested: startingOffService || Boolean(item.off_service_requested),
          off_service_status: completingOffService ? "completed" : startingOffService ? "pending" : item.off_service_status,
          off_service_completed_date: completingOffService ? now.toISOString().slice(0, 10) : item.off_service_completed_date,
          id: undefined, ownerId: undefined, teamId: undefined, tlAssigneeId: undefined, status: undefined, version: undefined },
        version: sql`${guaranteeWorkItems.version} + 1`, updatedAt: now })
        .where(and(eq(guaranteeWorkItems.id, id), eq(guaranteeWorkItems.version, version))).returning({ id: guaranteeWorkItems.id });
      if (!updated.length) throw new Error("ข้อมูลมีการเปลี่ยนแปลง กรุณาโหลดใหม่");
      await tx.insert(guaranteeWorkEvents).values({ itemId: id, actorId: access.userId, action: completingOffService ? "off_service_complete" : startingOffService ? "off_service_requested" : "update", fromStatus: item.status, toStatus: item.status, occurredAt: now });
    });
    revalidatePath("/guarantees"); revalidatePath(`/guarantees/${id}`);
    return { ok: true, message: "บันทึกข้อมูลแล้ว", id };
  } catch (error) {
    console.error("Unable to save deposit work item", error);
    return { ...invalid, message: error instanceof Error && error.message.includes("เปลี่ยนแปลง") ? error.message : "บันทึกไม่สำเร็จ กรุณาลองใหม่" };
  }
}

export async function transitionDepositWorkItem(_previous: DepositActionState, form: FormData): Promise<DepositActionState> {
  const access = await getAccessContext("guarantees");
  if (!access.allowed || access.isDevelopmentSession || !process.env.DATABASE_URL) return { ...invalid, message: "ต้องเชื่อมบัญชีและฐานข้อมูลกลางก่อนบันทึก" };
  const id = String(form.get("id") || "");
  const to = depositStatusSchema.safeParse(form.get("to"));
  const reason = String(form.get("reason") || "").trim().slice(0, 1000);
  const version = Number(form.get("version"));
  if (!to.success || !/^[0-9a-f-]{36}$/i.test(id)) return invalid;
  const item = await getDepositWorkItem(id);
  const manager = item && (isAuthorized(access.subject, "guarantee.case.update", { ownerId: item.ownerId, teamId: item.teamId }) || isAuthorized(access.subject, "guarantee.case.manage", { ownerId: item.ownerId, teamId: item.teamId }));
  const assignedTl = item && canWorkAsAssignedTl(access, item);
  if (!item || (!manager && !assignedTl)) return { ...invalid, message: "ไม่พบรายการหรือไม่มีสิทธิ์แก้ไข" };
  if (!manager && !(["tl", "On Process"].includes(item.status) && ["On Process", "att", "ret"].includes(to.data))) return { ...invalid, message: "ทีมติดตั้งเปลี่ยนได้เฉพาะขั้นตอนงานที่ได้รับมอบหมาย" };
  if (version !== item.version) return { ...invalid, message: "ข้อมูลมีการเปลี่ยนแปลง กรุณาโหลดใหม่" };
  try {
    validateDepositTransition(item, to.data, reason);
    const now = new Date();
    await getDb().transaction(async (tx) => {
      const updated = await tx.update(guaranteeWorkItems).set({ status: to.data,
        data: { ...item, status: undefined, status_final: to.data === "done" || to.data === "Cancel" ? to.data : item.status_final,
          complete_tl: to.data === "On Process" ? "On Process" : item.complete_tl,
          depReturn: to.data === "clo" || to.data === "done" ? "Yes" : item.depReturn,
          return_status: to.data === "clo" ? "Done" : undefined,
          cancel_reason: to.data === "Cancel" ? reason : undefined,
          id: undefined, ownerId: undefined, teamId: undefined, version: undefined },
        version: sql`${guaranteeWorkItems.version} + 1`, updatedAt: now })
        .where(and(eq(guaranteeWorkItems.id, id), eq(guaranteeWorkItems.version, version))).returning({ id: guaranteeWorkItems.id });
      if (!updated.length) throw new Error("ข้อมูลมีการเปลี่ยนแปลง กรุณาโหลดใหม่");
      await tx.insert(guaranteeWorkEvents).values({ itemId: id, actorId: access.userId, action: "transition", fromStatus: item.status,
        toStatus: to.data, reason: reason || null, occurredAt: now });
    });
    revalidatePath("/guarantees"); revalidatePath(`/guarantees/${id}`);
    return { ok: true, message: "เปลี่ยนสถานะแล้ว", id };
  } catch (error) {
    return { ...invalid, message: error instanceof Error ? error.message : invalid.message };
  }
}
