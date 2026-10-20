# Docker / GitLab handoff — 16 October 2026

สถานะ: เตรียม implementation และผ่าน local code/configuration checks แล้ว **ยังไม่ผ่าน container/DB acceptance** เพราะไม่มี Docker Engine/WSL ในเครื่อง เจ้าของเลือกให้รอทดสอบฐานข้อมูลบน Docker เท่านั้น ไม่ใช้ portable cluster

Starting HEAD `ecf3b712b1843f3e80809df1c6e59d5a97a2bcff`; prepared on branch `codex/docker-deploy`. Owner subsequently authorized committing and publishing this handoff to GitHub `origin/main` for IT code review. This is not production deployment or database-migration approval; no database was mutated. `next-env.d.ts` มีการแก้ค้างก่อนเริ่ม; คืน imports ที่ build สร้างกลับเป็น dev paths เดิมโดยไม่รวมในงานนี้

## 1. Step 0 findings

- npm / package-lock.json; เดิมไม่มี engines/version file ที่ root Existing CI/hosting contract ใช้ Node22; Next16.3.8 ต้อง >=20.9, pdfjs-dist ต้อง >=20.19 / >=22.13 / >=24; เครื่องตรวจเป็น Node24.19.0/npm11.17.0 เลือก node:22-bookworm-slim ให้ตรง CI และใช้ glibc สำหรับ Argon2/Sharp/optional canvas binaries
- next.config.ts เดิมมี CSP/security headers แต่ไม่มี standalone; เพิ่ม standalone และ trace Duct PDF/font assets ตามคู่มือ Next ที่ติดตั้งใน node_modules
- ไม่มี NEXT_PUBLIC_*; public build metadata ใช้ APP_COMMIT_SHA/APP_BRANCH/APP_BUILT_AT + hosting/Git fallback; runtime variables และ optional/test/legacy inventory อยู่ใน `.env.example` และตาราง [DEPLOY.md](../../../DEPLOY.md)
- Core/Car/Duct ใช้ postgres-js + Drizzle แยก pools เดิมไม่มีกลไก DATABASE_SSL/CA กลาง; เพิ่ม shared helper ทั้งสาม pools และ schema/bootstrap tools
- เดิมมี58migrationsใน supabase/migrations ซึ่งเป็น standalone PostgreSQL ไม่พึ่ง hosted Supabase; runnerเรียงชื่อและบันทึก schema_migrations transactionรายไฟล์ ไม่มี DATABASE_URL_MIGRATE แยก เดิม bootstrap upsert/reset credentials เมื่อรันซ้ำ
- เพิ่ม migration0059 ตามการอนุมัติขยายงานของเจ้าของ: Core NOLOGIN DML group/non-owner account พร้อม grants/RLS allowlist เพื่อแทน table-owner connection; end-user RBAC/scopes ยังบังคับใน server เดิม ไม่ให้ Core เข้าตารางธุรกิจ Car/Duct และไม่ให้ Car/Duct รับ Core group
- SQLเดิมต้องใช้ pgcrypto/btree_gist และสร้าง/โอน helper roles รวม duct_rental_policy_worker BYPASSRLS ต้องให้ IT ยืนยัน TencentDB capabilities
- `/api/health` เดิมเป็น readiness SELECT1 + configuration คืน ready200/degraded503 และ build.shortCommit/branch/builtAt; prebuildสร้าง ignored JSON ไม่มี Git call ใน request คง implementation/response เดิม
- Writable private storage: guarantee evidence, Duct documents/signatures, NAS bridge document storage; Next cache สร้างใหม่ได้ PDF templates/font ต้อง trace เข้า standalone; bridge เดิมถูกเปิดโดย npm start wrapper จึงแยกเป็น internal service สำหรับ standalone

## 2. Files added/changed and reasons

| Files | Reason |
| --- | --- |
| Dockerfile | Cached multi-stage deps/builder/non-root runner; separate tools/NAS/opt-in verification targets |
| .dockerignore | Allowlist context; exclude real env/credentials/local data/dumps/repository metadata |
| docker-compose.yml | Local DB + one-shot migrate + app startup dependencies; separate NAS/bootstrap/acceptance profiles and private volumes |
| .gitlab-ci.yml | Existing quality gates + scan + disposable container verification + build/push immutable SHA images; manual TODO deploy |
| .gitleaksignore | Exact owner-approved Firebase/reference cache false-positive fingerprints only |
| .env.example | Full phase-labelled inventory; local placeholder credentials, no initial-admin defaults |
| next.config.ts | Standalone output and PDF/font tracing |
| src/lib/database-ssl.mjs + .d.mts, three DB pool files | Consistent disable/require/verify-full and mounted CA support |
| scripts/migrate-postgres.mjs | Explicit operator-only URL; serialization lock and unchanged ordered/tracked SQL mechanism |
| scripts/bootstrap-admin.mjs | Env/TTY credentials using existing policy/hash; serialized audited first-admin creation; strict no-op on re-run |
| supabase/migrations/0059_core_runtime.sql | Owner-approved constrained Core service role and per-table/action RLS grants; no default grants/DDL/ownership |
| scripts/deployment/*, package.json | TLS unit tests, guarded local account provisioning, unique disposable Docker acceptance runner and DB/browser checks |
| DEPLOY.md, README.md, docs/README.md, hosting/Duct guides | Consistent commands, account/TLS/storage/CI/runbook/rollback and TODO(IT) handoff |
| docs/implementation-status.md, this report | Current evidence and explicit pending release gates |

## 3. Changes outside Docker/CI

Necessary packaging changes: standalone/asset tracing, TLS options and explicit migration URL. Bootstrap safety changes deliberately remove the old reset/upsert behaviour; it is no longer a break-glass password reset command. New0059CoreRLS was explicitly approved in this chat after explaining the old owner-connection limitation. No UI/design/copy/workflow/calculation/business-role assignments/module enablement/auth session policy/live-refresh code changed. No old SQL migration was rewritten.

Core's SQL group is a **trusted backend service**, not a per-user SQL account. Login and several existing Core services query before binding an end-user identity. New role-specific policies preserve that service behaviour while restricting table/action/DDL privileges. Existing policies for other SQL roles and scoped lifecycle checks stay intact. Append-only records receive no UPDATE/DELETE grants. Runtime logins must inherit only their approved group/grants; schema CREATE via PUBLIC is revoked in0059. This model and its negative SQL/browser checks still require actual Docker execution.

## 4. Verification results

| Check | Observed result |
| --- | --- |
| npm run lint | PASS |
| npm run typecheck | PASS |
| npm test | PASS:79files,6,166tests;5files/66opt-in tests skipped |
| npm run test:documents | PASS:1 |
| npm run test:deployment | PASS:4 transport-policy unit tests; no DB connection |
| npm run build | PASS:standalone production output generated |
| Standalone no-DB smoke | PASS:server started, login200, public font200, PDF/font files present, health503 with database=false and public build identity. No DB connection. This is not container/ready-health evidence |
| node --check on deployment tools | PASS |
| Docker Compose2.39.4 portable CLI config --quiet with .env.example | PASS; official release SHA256 verified; no daemon/container started |
| GitLab YAML parse / all script entries strings | PASS; actual GitLab runner execution pending |
| git diff --check | PASS (generated/EOL notices are not diff failures) |
| Gitleaks8.24.3 full history | PASS with explicit accepted fingerprints;112commits/~9.18MB scanned |
| Gitleaks working source/migration/config/deployment scripts | PASS on scanned paths; no new findings |
| npm run test:docker | NOT RUN to completion:docker command unavailable; launcher stops before creating any fixture |

Fresh baseline before changes also passed lint/typecheck/unit6,166/document1/build. Logs are ignored under `.data/docker-deploy-*`; generated results/screenshots/secrets are not committed. Compose CLI and Gitleaks are portable tools under ignored `.data/`, not global installations.

### Requested container acceptance (section5)

1. Clean docker compose up/build: **PENDING Docker Engine**. Compose configuration was validated independently.
2. Empty-DB migration all59files and harmless re-run: **PENDING**. Authored acceptance compares full ledger/timestamps; no SQL applied here.
3. First-admin creation/no-op/concurrency lock behaviour: **PENDING actual PostgreSQL**. Script/authored fixture uses existing Argon2id parameters and random test-only credentials.
4. Non-root container, ready-health200/build identity, healthy Docker probe: **PENDING**. Dockerfile USER/HEALTHCHECK and fixture assertions present; local standalone no-DB smoke cannot replace this.
5. Bootstrapped login, forced password change, all main module routes and single-session: **PENDING**. Fixture includes browser/old-token checks; no application DB/user was changed here.
6. Image size, final layers/env/data absence: **PENDING image build**. Fixture checks files/operator environment/assets and prints docker image ls/inspect size; no fabricated size reported.

## 5. Risks, assumptions, owner decisions and next gate

- Owner explicitly said to disregard the legacy Firebase web key because the whole system moves here. Exact accepted fingerprint is documented; the other scan hit is CacheService columns_initialized_v2. No key value printed/revoked/rotated and no Git history rewrite. Do not claim an unqualified "no secrets ever existed" from an exception-aware scan.
- Owner approved extending scope to constrained Core/RLS, and selected **Docker-only** DB testing. New0059 is therefore authored/unapplied, not accepted for a real DB yet. No portable/main database was used.
- IT must confirm TencentDB version/extensions/helper-role privileges/BYPASSRLS; these existing managed-service requirements may block the SQL unchanged. Keep that gate open rather than silently weakening RLS.
- IT must confirm network/VPC, TLS/CA, separate schema/Core/Car/Duct logins, secrets injection, private storage/NAS ACLs, registry/project/branch, Docker runner/TLS certificate sharing/artifact limits, HTTPS/streaming/proxy trust, backup/restore and connection limits. No infrastructure fact/credential is invented.
- Docker CI/default uses Linux Docker28CLI/DinD over TLS; IT must approve privileges and pin maintained matching image digests. Release artifact transfer must fit both compressed images. Deploy job is manual and intentionally exits1 until IT implements it.
- Next gate on a Docker host: `npm ci` then `npm run test:docker`, followed by representative existing constrained Core/Car/Duct integration/UAT/release checks. Investigate any missing explicit grant; never grant ownership/superuser/BYPASSRLS to make tests pass.
- Rollback: keep previous immutable app/tools artifacts; retain additive schema/audit/file history, disable module or forward-fix. IT backs up/restores PostgreSQL and private evidence/documents/signatures/NAS consistently. No destructive automatic migration rollback.

Jev health was available in initial inspection. Its advisory risk tool hard-gated migration/admin wording without calling the model; it was not treated as permission or correctness evidence. Owner authorizations and deterministic checks govern this work.
