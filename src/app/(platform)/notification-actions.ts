"use server";
import { and, eq, isNull, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { notifications } from "@/db/schema";
import { getIdentityAccessContext } from "@/lib/access";
import { isAuthorized } from "@/lib/authorization";

export async function markNotificationsRead(_state: { message: string }, form: FormData) {
  const access = await getIdentityAccessContext();
  if (!isAuthorized(access.subject, "notification.inbox.update", { ownerId: access.userId })) return { message: "ไม่มีสิทธิ์เปลี่ยนสถานะการแจ้งเตือน" };
  const id = form.get("id");
  if (id !== "all" && !z.string().uuid().safeParse(id).success) return { message: "รายการไม่ถูกต้อง" };
  try {
    const now = new Date();
    await getDb().update(notifications).set({ readAt: now }).where(and(eq(notifications.recipientId, access.userId),
      isNull(notifications.readAt), lte(notifications.createdAt, now), id === "all" ? undefined : eq(notifications.id, String(id))));
    revalidatePath("/", "layout");
    return { message: "อัปเดตสถานะการอ่านแล้ว" };
  } catch { return { message: "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง" }; }
}
