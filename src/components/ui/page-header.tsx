import Link from "next/link";

export function PageHeader({ title, description, parent, actions }: {
  title: string; description?: string; parent?: { label: string; href: string }; actions?: React.ReactNode;
}) {
  return <header className="page-heading"><div>
    {parent && <nav aria-label="เส้นทางนำทาง"><Link href={parent.href}>{parent.label}</Link><span aria-hidden="true"> / </span><span aria-current="page">{title}</span></nav>}
    <h1>{title}</h1>{description && <p className="sub">{description}</p>}
  </div>{actions && <div className="heading-actions">{actions}</div>}</header>;
}
