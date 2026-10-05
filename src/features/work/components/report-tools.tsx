"use client";
import { useSearchParams } from "next/navigation";
export function WorkReportTools() {
  const params = useSearchParams();
  return <div className="work-action-row work-report-tools"><button type="button" className="secondary-action" onClick={() => window.print()}>พิมพ์</button><a className="secondary-action" href={`/api/work/export?${params.toString()}`}>Export CSV</a></div>;
}
