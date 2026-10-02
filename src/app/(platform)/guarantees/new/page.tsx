import type { Metadata } from "next";
export const metadata: Metadata = { title: "เพิ่มรายการเงินประกัน" };

import { copy } from "@/lib/copy";
import { AccessDenied } from "@/components/access-denied";
import { DepositEditor } from "@/components/deposit-editor";
import { getAccessContext } from "@/lib/access";
import { canCreateDepositWorkItem, listTlAssignees } from "@/lib/deposit-v2-server";
import "../deposit.css";

export default async function NewDepositPage() {
  const access = await getAccessContext("guarantees");
  if (!access.allowed || !canCreateDepositWorkItem(access)) return <AccessDenied moduleName="สร้างรายการเงินประกัน" />;
  if (!process.env.DATABASE_URL) return <div className="deposit-banner">{copy.feedback.unavailable}</div>;
  return <DepositEditor assignees={await listTlAssignees()} />;
}
