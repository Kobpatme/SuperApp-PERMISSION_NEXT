import {WorkspaceLoading} from "./workspace-loading";
export function PageSkeleton({ shape = "dashboard", className = "" }: { shape?: "dashboard" | "table" | "detail"; className?: string }) {
  return <div className={`loading-workspace core-utility-loading skeleton-${shape} ${className}`.trim()}><div aria-hidden="true"><div className="loading-line heading"/><div className="loading-line"/>{shape === "dashboard" ? <div className="skeleton-summary">{[1,2,3].map(i=><div key={i} className="loading-table"/>)}</div> : shape === "table" ? <div className="loading-table">{[1,2,3,4].map(i=><div key={i} className="loading-line"/>)}</div> : <div className="skeleton-detail">{[1,2,3,4,5].map(i=><div key={i} className="loading-line"/>)}</div>}</div><WorkspaceLoading/></div>;
}
