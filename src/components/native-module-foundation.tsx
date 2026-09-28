import { AccessDenied } from "@/components/access-denied";
import { PreviewNotice, RefreshButton, SourceDetails } from "@/components/workspace-feedback";
import { WorkspaceQueue } from "@/components/workspace-queue";
import { getModule, type ModuleId } from "@/lib/module-registry";
import { getWorkspaceData } from "@/lib/workspace-server";
import { formatWorkspaceDate } from "@/lib/workspace-view";
import { PageHeader } from "@/components/ui/page-header";

const moduleCopy = {
  work: { title: "งานและกิจกรรม", description: "ติดตามงานของคุณ ตรวจสอบกำหนด และประสานงานกับทีม" },
  buildings: { title: "อาคารและค่าใช้จ่าย", description: "ค้นหาอาคารและติดตามรายการเกี่ยวกับค่าใช้จ่าย เงื่อนไขราคา และเอกสาร" },
  guarantees: { title: "ติดตามเงินประกัน", description: "ติดตามเอกสาร ผู้รับผิดชอบ และขั้นตอนการขอคืนเงินประกันอาคาร" },
};

export async function NativeModuleFoundation({ moduleId, previewRequested = false }: { moduleId: ModuleId; previewRequested?: boolean }) {
  const data = await getWorkspaceData(previewRequested);
  if (!data.accessByModule[moduleId].allowed) return <AccessDenied moduleName={getModule(moduleId)!.name}/>;
  const copy = moduleCopy[moduleId];
  const snapshot = { ...data.snapshot, items: data.snapshot.items.filter((item) => item.moduleId === moduleId), sources: data.snapshot.sources.filter((source) => source.moduleId === moduleId) };
  const ready = snapshot.sources.some((source) => source.status === "ready");
  return <div className="native-module">
    <PreviewNotice developmentMode={data.developmentMode} preview={data.preview}/>
    <PageHeader title={copy.title} description={copy.description} parent={{ label: "ภาพรวม", href: "/" }} actions={<><RefreshButton/><span className="updated-at">{ready ? `ข้อมูล ณ ${formatWorkspaceDate(snapshot.generatedAt, true)}` : "อยู่ระหว่างเตรียมข้อมูล"}</span></>}/>
    <WorkspaceQueue snapshot={snapshot} userId={data.identity.userId} moduleId={moduleId} preview={data.preview}/>
    <SourceDetails snapshot={snapshot} preview={data.preview}/>
    <p className="workspace-footnote">แสดงข้อมูลตามสิทธิ์ของคุณ · เปิดรายละเอียดจากชื่อรายการ</p>
  </div>;
}
