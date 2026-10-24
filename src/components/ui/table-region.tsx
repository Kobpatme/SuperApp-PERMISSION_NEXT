export function TableRegion({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={["ui-table-scroll", className].filter(Boolean).join(" ")} role="region" aria-label={label} tabIndex={0}>{children}</div>;
}
