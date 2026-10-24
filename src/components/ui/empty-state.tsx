export function EmptyState({ title, description, action, badge, error = false, className }: { title: string; description: string; action?: React.ReactNode; badge?: React.ReactNode; error?: boolean; className?: string }) {
  return <section className={["ui-empty", className].filter(Boolean).join(" ")} role={error ? "alert" : "status"}>{badge}<h2>{title}</h2><p>{description}</p>{action}</section>;
}
