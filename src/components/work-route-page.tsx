import { AccessDenied } from "@/components/access-denied";
import { WorkWorkspace } from "@/components/work-workspace";
import { getAccessContext } from "@/lib/access";
import { getWorkReadModel } from "@/lib/work-read-model";

export async function WorkRoutePage({ view }: { view: string }) {
  const access = await getAccessContext("work");
  if (!access.allowed) return <AccessDenied moduleName="งานและ KPI" />;
  const model = await getWorkReadModel(access);
  return <WorkWorkspace model={model} userId={access.userId} canCreate={Boolean(access.subject?.grants.some((grant) => grant.permission === "work.task.create"))} view={view} />;
}
