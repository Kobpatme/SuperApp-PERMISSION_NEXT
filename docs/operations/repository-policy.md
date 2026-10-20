# Repository contents

Keep application source/assets and licenses, package lock/configuration, migrations, repeatable tests and fixture generators, CI, deployment/import/recovery tools, and current architecture/domain/operations guidance in Git. Source parity references remain necessary while module migration and real-data cutover are incomplete.

Generated screenshots, logs, JSON reports, rendered HTML fixtures, build outputs, database backups, credentials, and operational state belong in ignored local directories or CI artifacts. `docs/quality/` retains repeatable verification guidance and output-directory placeholders only. Completed phase plans and historical audit/result reports are also untracked; current handoff information is consolidated in `docs/implementation-status.md`. CI uploads browser artifacts with a 14-day retention period; retain release/recovery evidence separately according to operations policy.

The cleanup uses `git rm --cached`, preserving existing local evidence and completed one-time transformation scripts. It does not rewrite Git history: earlier commits still contain their original files. Active tests, fixture generators, runtime compatibility references and migrations remain tracked. No deployment or data migration is implied by pushing repository changes.

METRIX handoff keeps its current module/rule/data/parity/owner-decision/ADR/import contracts and repeatable QA guide. Completed discovery/inventory/audit/closure reports remain local and can be recovered with `git show 392c327:docs/metrix-integration/<filename>`; no Source runtime assets, licenses, migrations, tests or fixture generators are removed. Use the current documentation index in a new checkout.

Use `npm ci` to install the locked dependencies. `npm run build` generates public build metadata and the Next.js production output. `npm run test:e2e` regenerates the isolated error-render fixture before browser tests; raw Playwright invocations must run `node scripts/render-ux-error-fixture.cjs` first when that spec is included. Generated evidence must not be force-added to Git.
