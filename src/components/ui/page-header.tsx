import Link from "next/link";
import { TruncatedText } from "@/components/ui/truncated-text";

export function PageHeader({ title, description, parent, actions }: {
  title: string; description?: string; parent?: { label: string; href: string }; actions?: React.ReactNode;
}) {
  return <header className="page-heading"><div>
    {parent && <nav aria-label="เส้นทางนำทาง"><Link href={parent.href}>{parent.label}</Link><span aria-hidden="true"> / </span><span aria-current="page">{title}</span></nav>}
    <h1><TruncatedText text={title} lines={2}/></h1>
    {description && <TruncatedText className="sub" text={description} lines={2}/>}
  </div>{actions && <div className="heading-actions">{actions}</div>}</header>;
}
