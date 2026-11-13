import type { Metadata } from "next";
import { getAccessContext } from "@/lib/access";
import { AccessDenied } from "@/components/access-denied";
import { CableTestWorkspace } from "@/modules/duct-rental/components/cable-test-workspace";

export const metadata: Metadata = { title: "พาดสายสื่อสาร · ทดสอบใช้งาน" };

export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const access = await getAccessContext("duct-rental");
  if (!access.allowed) return <AccessDenied moduleName="เช่าท่อและพาดสาย" />;
  const query=await searchParams,reference=typeof query.analysisProject==="string"?query.analysisProject:undefined;
  const initialDraft=reference?await (await import("@/lib/permission-out-composition")).loadCableAnalysisHandoff(reference):undefined;
  if(reference&&!initialDraft)return <AccessDenied moduleName="ผลวิเคราะห์เส้นทางที่อ้างอิง"/>;
  return <CableTestWorkspace permissions={access.permissions} initialDraft={initialDraft??undefined} />;
}
