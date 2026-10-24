import { useId } from "react";

export function Panel({ title, description, actions, children, className, headingId }: { title?: string; description?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string; headingId?: string }) {
  const generatedId = useId();
  const id = title ? (headingId ?? `ui-panel-${generatedId}`) : undefined;
  return <section className={["ui-panel", className].filter(Boolean).join(" ")} aria-labelledby={id}>
    {(title || description || actions) && <header className="ui-panel-header"><div>{title && <h2 id={id}>{title}</h2>}{description && <p>{description}</p>}</div>{actions && <div className="ui-panel-actions">{actions}</div>}</header>}
    <div className="ui-panel-body">{children}</div>
  </section>;
}
