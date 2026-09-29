# Enterprise workspace design system

Status: Current foundation; domain selector migration remains incremental.

`src/styles/tokens.css` owns light/dark colors, semantic status, spacing, type, radii and elevation. Existing `--app-*` aliases resolve to these tokens. System fonts: Segoe UI/Leelawadee UI/Tahoma, without remote dependency or implied bundled fonts.

`shell.css` owns navigation geometry. `components.css` contains active shared presentation extracted from the retired theme, with compact typography and blue action tokens. `ui.css` defines shared status, page, form and table patterns. `globals.css` retains older structural selectors during strangler migration; global token definitions have been removed. Domain styles remain until consumer migration and visual checks.

React patterns live in `src/components/ui`. Neutral is neutral; green means success, amber attention, red danger, blue information. Status includes text. Local state must not decide server authorization.

Retired: coral-stay-theme.css, unused bouncebox-theme.css, old sidebar.css location. Do not append another override theme.

Planned: authenticated desktop/tablet/mobile visuals, contrast and keyboard verification. Compiling CSS does not establish WCAG compliance.
