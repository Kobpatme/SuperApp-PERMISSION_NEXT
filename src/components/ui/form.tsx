import type { FormHTMLAttributes } from "react";

export function FilterBar({ className, children, ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return <form {...props} className={["ui-filter", className].filter(Boolean).join(" ")}>{children}</form>;
}

export function FormField({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return <label className={["ui-field", className].filter(Boolean).join(" ")}><span className="ui-field-label">{label}</span>{children}{hint && <small className="ui-field-hint">{hint}</small>}</label>;
}
