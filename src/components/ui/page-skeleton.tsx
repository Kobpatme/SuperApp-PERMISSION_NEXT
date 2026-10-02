import { copy } from "@/lib/copy";
export function PageSkeleton({ shape = "dashboard" }: { shape?: "dashboard" | "table" | "detail" }) {
  return <div className={`loading-workspace skeleton-${shape}`} role="status" aria-live="polite"><div className="loading-line heading"/><div className="loading-line"/>{shape === "dashboard" ? <div className="skeleton-summary">{[1,2,3].map(i=><div key={i} className="loading-table"/>)}</div> : shape === "table" ? <div className="loading-table">{[1,2,3,4].map(i=><div key={i} className="loading-line"/>)}</div> : <div className="skeleton-detail">{[1,2,3,4,5].map(i=><div key={i} className="loading-line"/>)}</div>}<span>{copy.feedback.loading}</span></div>;
}
