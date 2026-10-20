import { notFound } from "next/navigation";
import { getAccessContext } from "@/lib/access";
import { AccessDenied } from "@/components/access-denied";
import { RequestWorkspace } from "@/modules/duct-rental/components/request-workspace";
const views = ["design", "draftsman", "permission", "install", "draftsman2", "permission2", "3rdparty", "permission3", "contract", "missing-docs"];
export default async function DuctPhasePage({ params, searchParams }: { params: Promise<{ id: string; view: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const access = await getAccessContext("duct-rental"); if (!access.allowed) return <AccessDenied moduleName="เช่าท่อร้อยสาย" />;
  const { id, view } = await params, query = await searchParams; if (!views.includes(view)) notFound(); return <RequestWorkspace id={id} view={view} userId={access.userId} created={view === "draftsman" && query.created === "1"} />;
}
