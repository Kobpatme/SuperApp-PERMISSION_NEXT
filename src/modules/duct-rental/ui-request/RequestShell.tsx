import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DuctModuleNav } from "@/modules/duct-rental/ui-shared";
import styles from "./ui-request.module.css";

export function RequestShell({ title, description, parent, actions, current = "requests", utility, children, content, className }: { title: string; description?: string; parent?: { label: string; href: string }; actions?: ReactNode; current?: string; utility?: ReactNode; children?: ReactNode; content?: ReactNode; className?: string }) {
  return <div className={[styles.requestShell, className].filter(Boolean).join(" ")}>
    <PageHeader title={title} description={description} parent={parent} actions={actions} />
    <DuctModuleNav current={current} />
    {utility}
    <main className={styles.requestShellContent}>{content ?? children}</main>
  </div>;
}
