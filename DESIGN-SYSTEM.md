# Historical design system — superseded

> Deprecated. Use [Enterprise workspace design system](docs/product/design-system.md). The following is a retained historical reference, not the active product direction.

## Product character

Warm, approachable, fast and dependable. The workspace adopts Coral Stay's welcoming coral accent, neutral surfaces and rounded but disciplined geometry. The Core Shell owns global navigation and identity; each MOD keeps its original workflow and domain-specific navigation.

## Shared foundations

| Token | Value | Usage |
| --- | --- | --- |
| Brand | `#FF5A5F` | Primary actions and key highlights |
| Brand hover | `#E04E52` | Hover and pressed primary actions |
| Brand soft | `#FFF1F1` | Selected rows, badges and focus support |
| Secondary | `#00A699` | Verified, healthy and supporting accents |
| Canvas | `#F7F7F7` | Application background |
| Surface | `#ffffff` | Cards, navigation and panels |
| Text | `#222222` | Primary text |
| Muted | `#717171` | Secondary text |
| Border | `#DDDDDD` | Dividers and control outlines |
| Success | `#008A05` | Completed and healthy states |
| Warning | `#E07912` | Attention and near-SLA states |
| Danger | `#C13515` | Destructive and overdue states |
| Radius | `8 / 12 / 16px` | Controls, cards and large containers |

Typography uses `Nunito Sans` for display text, `DM Sans` for UI text and `JetBrains Mono` for codes, with `Noto Sans Thai` and system fallbacks for Thai content. Headings use compact spacing and stronger weight; body text prioritizes readability over decoration.

## Module rules

- Core Shell top bar is the only global module switcher.
- Light/Dark mode is controlled only from the Workspace top bar and synchronized to every embedded MOD.
- MOD navigation remains inside each MOD when it controls domain workflow.
- Embedded MOD login/logout controls are hidden; authentication belongs to the Core Shell.
- Embedded MOD theme controls are hidden; MODs receive `WORKSPACE_THEME` from the Core Shell.
- Shared colors, border radii, shadows, focus rings and status meanings are mapped through a theme adapter instead of rewriting original MOD source files.
- MOD 1 keeps its command-center sidebar, MOD 2 keeps its map-first interface, and MOD 3 keeps its operational sidebar and document workflow.
- Responsive behavior keeps the module switcher reachable before secondary global actions.

## Safety and accessibility

- Interactive controls retain visible focus states.
- Status is communicated by text as well as color.
- Destructive actions keep the red semantic color and are not restyled as primary actions.
- Theme adapters are scoped under `.super-app-embedded` to prevent CSS leaking between MODs.
