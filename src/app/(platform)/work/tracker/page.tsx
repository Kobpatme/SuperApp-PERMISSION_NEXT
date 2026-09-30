import { WorkRoutePage } from "@/components/work-route-page";
export default async function WorkTrackerPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { const params = await searchParams; return <WorkRoutePage view="tracker" ownerId={typeof params.owner === "string" ? params.owner : undefined} />; }
