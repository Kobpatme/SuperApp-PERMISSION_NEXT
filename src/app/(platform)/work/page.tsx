import { AccessDenied } from "@/components/access-denied";
import { WorkWorkspace } from "@/components/work-workspace";
import { getAccessContext } from "@/lib/access";
import { getWorkReadModel } from "@/lib/work-read-model";

export default async function ModulePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, access] = await Promise.all([searchParams, getAccessContext("work")]);
  if (!access.allowed) return <AccessDenied moduleName="งานและ KPI"/>;
  const model = await getWorkReadModel(access);
  return <WorkWorkspace model={model} userId={access.userId} view={typeof params.view === "string" ? params.view : "mine"}/>;
}
