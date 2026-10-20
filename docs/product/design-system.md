# Enterprise workspace design system

Status: Current foundation; domain selector migration remains incremental.

`src/styles/tokens.css` owns light/dark colors, semantic status, spacing, type, radii and elevation. Retired compatibility aliases must not be reintroduced. Fonts are bundled through `src/app/fonts.ts` and `src/app/fonts/` with their OFL licenses: Manrope, Nunito, Noto Sans Thai and Source Code Pro.

`shell.css` owns navigation geometry. `components.css` contains active shared presentation extracted from the retired theme, with compact typography and blue action tokens. `ui.css` defines shared status, page, form and table patterns. `globals.css` retains older structural selectors during strangler migration; global token definitions have been removed. Domain styles remain until consumer migration and visual checks.

React patterns live in `src/components/ui`. Neutral is neutral; green means success, amber attention, red danger, blue information. Status includes text. Local state must not decide server authorization.

Retired: coral-stay-theme.css, unused bouncebox-theme.css, old sidebar.css location. Do not append another override theme.

The owner-approved brand is corporate blue (ADR-0004), with brief purposeful motion and reduced-motion support. Auth surfaces use plain Thai feedback without exposing technical system details. Verify desktop/mobile, contrast and keyboard flows after presentation changes; compiling CSS does not establish WCAG compliance.
