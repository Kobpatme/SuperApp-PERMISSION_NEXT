import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { DuctModuleNav } from "@/modules/duct-rental/ui-shared";
import styles from "./ui-request.module.css";

export function RequestShell({ title, description, actions, current = "requests", children, content, className }: { title: string; description?: string; actions?: ReactNode; current?: string; children?: ReactNode; content?: ReactNode; className?: string }) {
  return <div className={[styles.requestShell, className].filter(Boolean).join(" ")}>
    <PageHeader title={title} description={description} actions={actions} />
    <DuctModuleNav current={current} />
    <main className={styles.requestShellContent}>{content ?? children}</main>
  </div>;
}
