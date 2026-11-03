"use client";
import { useSearchParams } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";

export function WorkReportTools() {
  const params = useSearchParams();
  return <div className="work-action-row work-report-tools"><Button variant="secondary" type="button" onClick={() => window.print()}>พิมพ์</Button><ButtonLink variant="secondary" href={`/api/work/export?${params.toString()}`}>Export CSV</ButtonLink></div>;
}
