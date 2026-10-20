import type { CSSProperties } from "react";
import { ICON_MARKUP, type IconName } from "./icons/icon-paths";

export type { IconName };

type Props = {
  name: IconName;
  /** Rendered square size in px. Visual scale: 16 badge · 18 compact · 20 default · 24 feature. */
  size?: number;
  /** Stroke weight. Defaults to 1.75, or 2 below 18px so small icons stay legible. */
  strokeWidth?: number;
  /** Accessible name. When omitted the icon is decorative (aria-hidden). */
  label?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * Single renderer for every product icon. Path markup comes from ./icons/icon-paths
 * (extracted from Tabler Icons, MIT) so the set is declared once for the whole app —
 * screens import this component and never define their own SVG copies.
 */
export function WorkspaceIcon({ name, size = 20, strokeWidth, label, className, style }: Props) {
  const weight = strokeWidth ?? (size < 18 ? 2 : 1.75);
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={weight}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      style={style}
      dangerouslySetInnerHTML={{ __html: ICON_MARKUP[name] }}
    />
  );
}

/**
 * The same icon as a raw SVG string, for contexts that need markup strings
 * (map overlay HTML, print templates). Keeps one source of truth.
 */
export function workspaceIconMarkup(name: IconName, size = 20, strokeWidth = 1.75): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICON_MARKUP[name]}</svg>`;
}
