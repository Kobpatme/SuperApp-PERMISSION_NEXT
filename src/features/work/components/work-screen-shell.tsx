import styles from "@/features/work/screens/work-composition.module.css";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricGrid } from "@/components/ui/metric-grid";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

export function WorkScreenShell({ title, description, parent, action, children, appearance = "default" }: { title: string; description: string; parent?: { label: string; href: string }; action?: React.ReactNode; children: React.ReactNode; appearance?: "default" | "workspace" }) {
  const workspace = appearance === "workspace";
  return <div className={`${styles.workspace} work-native${workspace ? " work-rollout" : ""}`} data-ui-screen data-work-appearance={appearance} data-work-rollout-content={workspace ? "" : undefined}><PageHeader title={title} description={description} parent={parent ?? { label: "ภาพรวม", href: "/" }} actions={action} className="page-enter" />{children}</div>;
}

export function WorkUnavailable({ message, detail }: { message: string; detail: string }) {
  return <EmptyState className="work-state work-state-unavailable" title={message} description={detail} badge={<StatusBadge label="ยังไม่พร้อมใช้งาน" tone="warning" />} />;
}

export function WorkEmpty({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <EmptyState className="work-state work-state-empty" title={title} description={detail} action={action} badge={<StatusBadge label="ยังไม่มีข้อมูล" tone="neutral" />} />;
}

export function WorkMetricStrip({ metrics }: { metrics: Array<{ label: string; value: string | number; detail: string; tone?: "neutral" | "info" | "success" | "warning" | "danger" }> }) {
  return <MetricGrid className="work-metric-strip" label="สรุปงาน" metrics={metrics} />;
}
