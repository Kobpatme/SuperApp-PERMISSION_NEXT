import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

function classes(variant: ButtonVariant, className?: string) {
  return ["ui-button", `ui-button-${variant}`, className].filter(Boolean).join(" ");
}

export function Button({ variant = "secondary", className, type = "button", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button {...props} type={type} className={classes(variant, className)} />;
}

export function ButtonLink({ variant = "secondary", className, ...props }: LinkProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & { variant?: ButtonVariant }) {
  return <Link {...props} className={classes(variant, className)} />;
}
