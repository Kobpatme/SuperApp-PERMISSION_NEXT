"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./ui-shared.module.css";

export type DuctModuleNavProps = { current?: string };

type NavItem = { key: string; href: string; label: string };

const items: NavItem[] = [
  { key: "requests", href: "/duct-rental", label: "เช่าท่อร้อยสาย" },
  { key: "communication-cable", href: "/duct-rental/communication-cable", label: "พาดสายสื่อสาร" },
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
