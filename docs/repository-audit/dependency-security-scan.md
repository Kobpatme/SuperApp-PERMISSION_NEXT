# Dependency security scan

Scan date: 2026-09-04

## Result

- Production dependency scan: `npm audit --omit=dev` reports **0 vulnerabilities**.
- Full dependency scan: 4 moderate advisories remain in the development-only `drizzle-kit` dependency chain (`@esbuild-kit/*` -> older `esbuild`).
- No high or critical advisories remain after upgrading Next.js, React, Drizzle ORM, Vitest and Playwright.

## Decision

Do not apply the automated full-audit fix because npm proposes downgrading `drizzle-kit` to `0.18.1`, which is a breaking regression and does not improve production runtime exposure. Keep `drizzle-kit` out of production dependencies and monitor for an upstream release that removes the advisory chain.

## Gates

The accepted dev-only advisory does not permit database tooling to run in the production application process. CI and operator environments must use pinned lockfile installs; the scan must run again before each release.
