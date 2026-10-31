import type { HTMLAttributes } from "react";

export type VisuallyHiddenProps = HTMLAttributes<HTMLSpanElement>;

/** Visually hides content while keeping it available to assistive technology. */
export function VisuallyHidden({ style, ...props }: VisuallyHiddenProps) {
  return (
    <span
      {...props}
      style={{
        position: "absolute",
        width: "var(--space-1)",
        height: "var(--space-1)",
        padding: "0",
        margin: "calc(var(--space-1) * -1)",
        overflow: "hidden",
        clipPath: "inset(var(--space-1))",
        whiteSpace: "nowrap",
        border: "0",
        ...style,
      }}
    />
  );
}
