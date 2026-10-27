import Link from "next/link";
import { TruncatedText } from "@/components/ui/truncated-text";

export function PageHeader({ title, description, eyebrow, parent, actions, className }: {
 title: string; description?: string; eyebrow?: string; parent?: { label: string; href: string }; actions?: React.ReactNode; className?: string;
}) {
  return (
    <header className={`page-heading border-b border-[var(--color-border)] pb-6 ${className ?? ""}`.trim()}>
      <div className="page-heading-row flex flex-wrap items-start justify-between gap-5">
        <div className="page-heading-content min-w-0 flex-1">
          {parent && (
            <nav aria-label="เส้นทางนำทาง" className="page-heading-breadcrumb flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <Link className="underline-offset-4 hover:text-[var(--color-brand)] hover:underline" href={parent.href}>{parent.label}</Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page" className="font-semibold text-[var(--color-text)]">{title}</span>
            </nav>
          )}
          {!parent && eyebrow && <p className="eyebrow text-sm font-bold text-[var(--color-brand)]">{eyebrow}</p>}
          <h1 className="my-1 text-2xl font-extrabold leading-tight tracking-tight text-[var(--color-text)] sm:text-3xl"><TruncatedText text={title} lines={2}/></h1>
          {description && <TruncatedText className="text-sm leading-6 text-[var(--color-text-muted)]" text={description} lines={2}/>}
        </div>
        {actions && <div className="page-heading-actions ml-auto flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
