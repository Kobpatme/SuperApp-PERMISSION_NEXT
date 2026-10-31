/** Semantic token aliases backed by src/styles/tokens.css. */
export const color = {
  bg: "var(--color-bg)",
  surface: "var(--color-surface)",
  surfaceSubtle: "var(--color-surface-subtle)",
  border: "var(--color-border)",
  borderStrong: "var(--color-border-strong)",
  text: "var(--color-text)",
  textMuted: "var(--color-text-muted)",
  textSubtle: "var(--color-text-subtle)",
  brand: "var(--color-brand)",
  brandDeep: "var(--color-brand-deep)",
  brandSoft: "var(--color-brand-soft)",
  brandHover: "var(--color-brand-hover)",
  onBrand: "var(--color-on-brand)",
  focusRing: "var(--color-focus-ring)",
  success: "var(--color-success)",
  successSoft: "var(--color-success-soft)",
  warning: "var(--color-warning)",
  warningSoft: "var(--color-warning-soft)",
  danger: "var(--color-danger)",
  dangerSoft: "var(--color-danger-soft)",
  info: "var(--color-info)",
  infoSoft: "var(--color-info-soft)",
  overlay: "var(--color-overlay)",
} as const;

export const spacing = {
  1: "var(--space-1)",
  2: "var(--space-2)",
  3: "var(--space-3)",
  4: "var(--space-4)",
  5: "var(--space-5)",
  6: "var(--space-6)",
  7: "var(--space-7)",
  8: "var(--space-8)",
  9: "var(--space-9)",
  10: "var(--space-10)",
} as const;

export const radius = {
  xs: "var(--radius-xs)",
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  pill: "var(--radius-pill)",
} as const;

export const typography = {
  micro: "var(--text-micro)",
  caption: "var(--text-caption)",
  body: "var(--text-body)",
  bodyStrong: "var(--text-body-strong)",
  h3: "var(--text-h3)",
  h2: "var(--text-h2)",
  h1: "var(--text-h1)",
  stat: "var(--text-stat)",
  ui: "var(--font-ui)",
  heading: "var(--font-heading)",
  mono: "var(--font-mono)",
} as const;

export const shadow = {
  xs: "var(--shadow-xs)",
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
} as const;

export const motion = {
  fast: "var(--motion-fast)",
  base: "var(--motion-base)",
  slow: "var(--motion-slow)",
  easeOut: "var(--ease-out)",
  easeInOut: "var(--ease-in-out)",
  easeBack: "var(--ease-back)",
} as const;

export const zIndex = {
  sticky: "var(--z-sticky)",
  dropdown: "var(--z-dropdown)",
  module: "var(--z-module)",
  skip: "var(--z-skip)",
} as const;

export const touchTarget = "var(--size-control-touch)";

export const tokens = { color, spacing, radius, typography, shadow, motion, zIndex, touchTarget } as const;
export default tokens;
