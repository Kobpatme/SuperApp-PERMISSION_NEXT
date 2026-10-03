# CSS consolidation — CP3

Owner blue palette remains the single semantic source in `src/styles/tokens.css` (ADR-0004). Auth presentation is extracted into `src/styles/auth.css`; imports retain cascade order. Local OFL fonts are under `src/app/fonts`, with four Next local-font variables and three preloaded faces (mono is lazy).

The six migration groups preserve selector order: auth, shell, dashboard, tables, details, modules. Each group has an independent Conventional Commit, full gate JSON and Light/Dark screenshots at 390/1024/1440 in `docs/quality/ux-login-evidence`. Additional staff browser tests cover 320px and modal keyboard focus.

`cp3-css-inventory.json` records selectors and static consumer evidence. Dynamic or uncertain selectors remain in place: static string search cannot prove runtime absence. No speculative selector deletion is authorized by this inventory. Future cleanup must identify every dynamic construction, verify all affected routes and states in both themes, and compare screenshots before moving obsolete selectors into the archive.

41 obsolete custom-property definitions were removed only after a whole-source consumer search returned zero references. `ux-remove-unused-aliases.mjs` refuses mutation if any consumer remains. Its PostCSS operation removes definitions only; source selectors with declarations remain. JEV evidence advice requested more evidence, so the script's deterministic precondition, post-mutation CSS checks and final browser matrix supplement the original inventory.

Original globals snapshot: `docs/archive/ux-login-v1/cp3-globals-before.css` (59,591 bytes). Consolidated globals: 58,064 bytes (1,527 fewer, 2.56%). Shared auth now has its own domain file; total CSS is not claimed to shrink by that extraction alone. Compatibility color/radius/shadow aliases are gone; spacing and functional layout variables remain intentional.

`npm run check:css` is required in CI. The check includes font-size numbers nested in clamp(), semantic color literals, undefined var references and negative tracking, excluding production-disabled legacy routes. Browser axe supplements token contrast; neither static check proves every future dynamic state.
