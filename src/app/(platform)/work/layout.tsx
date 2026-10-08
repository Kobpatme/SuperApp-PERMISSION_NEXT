import { WorkLiveRefresh } from "@/components/work-live-refresh";
export default function WorkLayout({ children }: { children: React.ReactNode }) {
  return <><WorkLiveRefresh initialUpdatedAt={new Date().toISOString()} />{children}</>;
}
