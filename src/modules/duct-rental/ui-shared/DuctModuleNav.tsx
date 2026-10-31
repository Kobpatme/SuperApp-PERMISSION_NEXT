"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./ui-shared.module.css";

export type DuctModuleNavProps = { current?: string };

type NavItem = { key: string; href: string; label: string };

const items: NavItem[] = [
  { key: "requests", href: "/duct-rental", label: "คำขอเช่าท่อ" },
  { key: "renewal", href: "/duct-rental/renewal", label: "ต่อสัญญารายปี" },
  { key: "cancellation", href: "/duct-rental/cancellation", label: "ยกเลิกการใช้ท่อ" },
  { key: "tracking", href: "/duct-rental/tracking", label: "ติดตามต่อสัญญาและยกเลิก" },
  { key: "tasks", href: "/duct-rental/tasks", label: "งานลงนามและลายเซ็น" },
];

function ModuleNav({ current = "requests" }: DuctModuleNavProps) {
  return (
    <nav className={styles.ductModuleNav} aria-label="งานสนับสนุนเช่าท่อและพาดสาย">
      {items.map((item) => (
        <Link
          key={item.key}
          className={styles.ductModuleLink}
          href={item.href}
          aria-current={current === item.key ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/** Duct adapter around the shared module navigation contract. */
export function DuctModuleNav(props: DuctModuleNavProps): ReactNode {
  return <ModuleNav {...props} />;
}
