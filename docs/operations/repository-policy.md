# Repository contents

Keep application source/assets and licenses, package lock/configuration, migrations, repeatable tests and fixture generators, CI, deployment/import/recovery tools, and current architecture/domain/operations guidance in Git. Source parity references remain necessary while module migration and real-data cutover are incomplete.

Generated screenshots, logs, JSON reports, rendered HTML fixtures, build outputs, database backups, credentials, and operational state belong in ignored local directories or CI artifacts. `docs/quality/` retains Markdown summaries and output-directory placeholders only. Historical summaries describe a past run; links to generated artifacts refer to local/CI evidence rather than files available in a new clone. CI uploads browser artifacts with a 14-day retention period; retain release/recovery evidence separately according to operations policy.

The cleanup uses `git rm --cached`, preserving existing local evidence and completed one-time transformation scripts. It does not rewrite Git history: earlier commits still contain their original files. Active tests, fixture generators, runtime compatibility references and migrations remain tracked. No deployment or data migration is implied by pushing repository changes.

Use `npm ci` to install the locked dependencies. `npm run build` generates public build metadata and the Next.js production output. `npm run test:e2e` regenerates the isolated error-render fixture before browser tests; raw Playwright invocations must run `node scripts/render-ux-error-fixture.cjs` first when that spec is included. Generated evidence must not be force-added to Git.
