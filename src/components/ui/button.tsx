import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonExtras = { variant?: ButtonVariant; pending?: boolean; pendingLabel?: string };

function classes(variant: ButtonVariant, className?: string) {
  return ["ui-button", `ui-button-${variant}`, className].filter(Boolean).join(" ");
}

export function Button({ variant = "secondary", className, type = "button", pending = false, pendingLabel = "กำลังดำเนินการ…", children, disabled, ["aria-busy"]: ariaBusy, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & ButtonExtras) {
  return <button {...props} type={type} className={classes(variant, className)} disabled={disabled || pending} aria-busy={pending ? true : ariaBusy}>{pending ? pendingLabel : children}</button>;
}

export function ButtonLink({ variant = "secondary", className, ...props }: LinkProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & { variant?: ButtonVariant }) {
  return <Link {...props} className={classes(variant, className)} />;
}
