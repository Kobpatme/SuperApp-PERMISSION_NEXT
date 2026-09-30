import { WorkRoutePage } from "@/components/work-route-page";
import type { getWorkReadModel } from "@/lib/work-read-model";

type LegacyWorkWorkspaceProps = {
  model: Awaited<ReturnType<typeof getWorkReadModel>>;
  userId: string;
  view: string;
  canCreate: boolean;
};

/** Compatibility entry point retained for imports outside the current route tree. */
export async function WorkWorkspace({ view }: LegacyWorkWorkspaceProps) {
  return <WorkRoutePage view={view} />;
}
