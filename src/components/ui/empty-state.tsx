export function EmptyState({ title, description, action, error = false }: { title: string; description: string; action?: React.ReactNode; error?: boolean }) {
  return <section className="queue-empty" role={error ? "alert" : "status"}><h2>{title}</h2><p>{description}</p>{action}</section>;
}
