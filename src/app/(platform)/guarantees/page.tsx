import { AccessDenied } from "@/components/access-denied";
import { DepositWorkspace } from "@/components/deposit-workspace";
import { getAccessContext } from "@/lib/access";
import { isInstallationTeamPending } from "@/lib/deposit-v2-domain";
import { depositPreviewItems } from "@/lib/deposit-v2-preview";
import { canCreateDepositWorkItem, listDepositWorkItems } from "@/lib/deposit-v2-server";
import "./deposit.css";

export default async function GuaranteesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, access] = await Promise.all([searchParams, getAccessContext("guarantees")]);
  if (!access.allowed) return <AccessDenied moduleName="เงินประกันอาคาร" />;
  const preview = process.env.NODE_ENV === "development" && access.isDevelopmentSession && params.preview === "1";
  const requestedTeamId = typeof params.team === "string" ? params.team : undefined;
  const requestedView = Array.isArray(params.view) ? params.view[0] : params.view;
  const installationTeamView = requestedView === "installation-team";
  const data = preview ? { items: installationTeamView ? depositPreviewItems.filter(isInstallationTeamPending) : depositPreviewItems, state: "ready" as const, truncated: false, generatedAt: "2026-09-29T00:00:00.000Z" } : await listDepositWorkItems(500, requestedTeamId, installationTeamView);
  return <DepositWorkspace items={data.items} preview={preview} state={data.state} truncated={data.truncated}
    generatedAt={data.generatedAt}
    canCreate={canCreateDepositWorkItem(access)}
    installationTeamView={installationTeamView}
    canPreview={process.env.NODE_ENV === "development" && access.isDevelopmentSession} />;
}
