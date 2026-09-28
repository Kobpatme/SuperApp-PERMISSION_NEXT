# Reusable asset register

| Source | Asset | Decision | Conditions |
| --- | --- | --- | --- |
| MAXIWA KPI | Bangkok date and holiday-aware working-day logic | ADAPT | Port to typed pure domain functions and verify with existing 11 tests plus edge cases. |
| MAXIWA KPI | Status vocabulary and task/job grouping semantics | KEEP/ADAPT | Preserve import compatibility; target transitions become explicit server rules. |
| MAXIWA KPI | Weighted report formulas | ADAPT | Use only as historical reconciliation logic, not as the new KPI engine. |
| MAXIWA KPI | Existing audit/product documentation | KEEP | Treat as source evidence, not target authority where it conflicts with the master specification. |
| Guarantee | Six-step UI vocabulary and handoff flow | ADAPT | Normalize compact legacy statuses; validate every transition on the server. |
| Guarantee | Evidence categories and area/TL routing map | ADAPT | Move to typed configuration/master data. |
| Guarantee | Dashboard definitions and CSV columns | KEEP | Use as acceptance/reconciliation fixtures. |
| Permission Next | Map/search/filter interaction patterns | ADAPT | Rebuild as accessible client components with server pagination/search. |
| Permission Next | Permission/BOQ calculation formulas | ADAPT | Extract into versioned server-side calculation policies with golden-master tests. |
| Permission Next | Duplicate-name/coordinate detection | ADAPT | Add normalized database columns, confidence scoring and review workflow. |
| Permission Next | NAS folder normalization, containment and no-overwrite behavior | KEEP/ADAPT | Place behind a server-side attachment provider; never trust browser role headers. |
| Permission Next | Quotation PDF/image layout | ADAPT | Reproduce only after a durable estimate/version/snapshot model exists. |
| Current SuperApp | Next.js App Router shell, theme, basic Supabase session middleware | REFACTOR | Keep the platform direction, replace coarse RBAC and legacy frames. |
| Current SuperApp | Drizzle/Supabase baseline and secure environment split | REFACTOR | Expand schema, connection lifecycle, RLS context and migrations. |
| Current SuperApp | NAS server proxy with server secret | ADAPT | Add resource-level authorization, metadata registry and integration tests. |

Static screenshots and large legacy HTML/CSS files are reference artifacts only. They must not become production module implementations or be embedded by iframe in the finished platform.
