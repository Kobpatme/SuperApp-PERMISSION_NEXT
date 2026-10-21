import Link from "next/link";
import { TruncatedText } from "@/components/ui/truncated-text";

export function PageHeader({ title, description, eyebrow, parent, actions, className }: {
 title: string; description?: string; eyebrow?: string; parent?: { label: string; href: string }; actions?: React.ReactNode; className?: string;
}) {
  return (
    <header className={`page-heading ${className ?? ""}`.trim()}>
      <div className="page-heading-row">
        <div className="page-heading-content">
          {parent && (
            <nav aria-label="เส้นทางนำทาง" className="page-heading-breadcrumb">
              <Link href={parent.href}>{parent.label}</Link>
              <span aria-hidden="true"> / </span>
              <span aria-current="page">{title}</span>
            </nav>
          )}
          {!parent && eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1><TruncatedText text={title} lines={2}/></h1>
          {description && <TruncatedText className="sub" text={description} lines={2}/>}
        </div>
        {actions && <div className="page-heading-actions">{actions}</div>}
      </div>
    </header>
  );
}
