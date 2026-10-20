# Docker deployment / GitLab handoff

สรุป: แพ็กแอปเป็น Docker โดยคง UI/workflow เดิม แยกบัญชี schema operator ออกจาก Core/Car/Duct runtime และแยกขั้น migrate/bootstrap ออกจากเว็บ **ยังไม่รับรอง production**: ต้องรัน acceptance บน Docker และให้ IT ยืนยันข้อจำกัด TencentDB โดยเฉพาะ helper roles/BYPASSRLS ก่อน คู่มือด้านล่างไม่อนุญาตให้ apply ลงฐานจริงโดยอัตโนมัติ

## Inspection baseline

Starting source: `ecf3b712b1843f3e80809df1c6e59d5a97a2bcff`. npm with `package-lock.json`; existing CI/hosting uses Node 22. Next requires >=20.9 and pdfjs-dist requires >=20.19 / >=22.13 / >=24. No root Node engines/version pin existed. Docker uses Node 22 Debian bookworm slim for the locked Argon2id/Sharp/optional PDF native binaries. IT should approve matching base-image digests for its architecture.

Originally `next.config.ts` had security headers/CSP and no standalone output. Core, Car and Duct each use postgres-js/Drizzle pools. Migrations were 58 ordered standalone PostgreSQL SQL files tracked in `public.schema_migrations`. Existing bootstrap was interactive and reset credentials on re-run. Health reports readiness plus short commit/branch/build time. Private guarantee/Duct files need persistent storage; PDF templates/font need to accompany standalone output. See [verification report](docs/quality/docker-deployment/README.md) for current evidence and limitations.

## Local disposable stack

Requirements: Docker Engine/Desktop running **Linux containers**, BuildKit and Docker Compose v2 supporting `service_completed_successfully`, `--wait` and build cache mounts. No host PostgreSQL is needed. The local DB port is not published. App defaults to `127.0.0.1:3000`.

```powershell
Copy-Item .env.example .env
# Optional public build identity; never put secrets into Docker build args.
$env:APP_COMMIT_SHA = git rev-parse HEAD
$env:APP_BRANCH = git branch --show-current
docker compose config --quiet
docker compose up --build -d --wait app
docker compose ps --all
```

The checked-in DB/bridge strings are **local placeholders**, so a clean copied example can start a disposable local stack. Replace them before any shared use. Do not use this local database service/account provisioning recipe on TencentDB. Keep `.env` private; never paste expanded `docker compose config`, `docker inspect` environments or credentials into logs/tickets.

Percent-encode special characters in URL usernames/passwords. In a Compose
`.env`, single-quote values containing `$` to prevent interpolation. Docker
`run --env-file` has different parsing rules; use its native format or IT's
secret manager, not a blindly reused Compose file.

`db` becomes healthy, `migrate` applies SQL and provisions distinct local runtime logins, then `app` starts. `nas` is a separate internal Node-only bridge using the existing bridge code and a private volume. The web image runs `node server.js` as UID 1000 (`node`), with NODE_ENV=production and telemetry disabled. Web startup never runs migrations or bootstrap. PORT configures the internal listener; APP_HOST_PORT configures the local host mapping. Production cookies remain Secure: provide IT HTTPS for actual browser use. The acceptance fixture uses a localhost-only test proxy without weakening app cookies.

For native npm development keep a separate `.env.local` with **localhost URLs and absolute host storage paths**. Do not replace an existing `.env.local` with container hostnames/paths. Native schema/bootstrap commands now require DATABASE_URL_MIGRATE explicitly.

## Build artifacts

```powershell
docker build --target runner --build-arg APP_COMMIT_SHA=$env:APP_COMMIT_SHA --build-arg APP_BRANCH=$env:APP_BRANCH -t superapp:local .
docker build --target tools -t superapp-tools:local .
```

Runner contains standalone output, `public`, `.next/static` and traced PDF assets only. It has no migration scripts/toolchain or Drizzle Kit. The separate tools image has production npm dependencies plus migrations/operator scripts. Optional `nas` and `verification` targets are not included in runner. `.dockerignore` allows only required source and excludes all real `.env*`, local data, dumps, repository metadata and private credential files. `.env.example` is allowed as documentation but is not copied by any production target.

Only APP_COMMIT_SHA, APP_BRANCH, APP_BUILT_AT are build args. They are public metadata. No NEXT_PUBLIC_* variables exist. Missing APP_BUILT_AT produces the build timestamp; missing commit remains null outside Git/CI, so supply the SHA when building a release. CI supplies the full commit SHA and health exposes its existing 12-character prefix. The same image is promoted between environments; no DB credentials are required to build it.

## Environment contract

All entries below are runtime unless marked. `.env.example` inventories optional/test/legacy variables too. Docker sets NODE_ENV=production, HOSTNAME=0.0.0.0, NEXT_TELEMETRY_DISABLED=1; NEXT_RUNTIME is managed by Next. Do not configure those through application secrets.

| Name | Phase | Required? | Description |
| --- | --- | --- | --- |
| APP_COMMIT_SHA, APP_BRANCH, APP_BUILT_AT | build / optional health runtime override | SHA required for release identification | Public build identity; no secrets |
| DATABASE_URL | runtime | yes | Core login, member only of permission_core_runtime, same DB as identity |
| DATABASE_URL_MIGRATE | operator only | migrate/bootstrap | DDL/bootstrap connection; never inject into web |
| CAR_BOOKING_DATABASE_URL | runtime | when Car used; local stack supplies it | Separate non-owner Car login with reviewed grants |
| DUCT_RENTAL_DATABASE_URL | runtime | when Duct used; local stack supplies it | Separate non-owner login inheriting duct_rental_runtime |
| DATABASE_SSL | runtime/operator | set explicitly | disable (local), require (encryption without certificate validation), verify-full (trusted chain + hostname) |
| DATABASE_SSL_CA_PATH | runtime/operator | optional verify-full | Path to read-only mounted CA PEM; invalid mode/CA fails closed |
| PORT | runtime | default 3000 | App listener; Docker EXPOSE documents the default |
| GUARANTEE_STORAGE_DIR | runtime | yes | Private persistent guarantee evidence directory |
| DUCT_RENTAL_STORAGE_DIR | runtime | if Duct used | Private persistent documents/signatures directory |
| AUTH_SINGLE_SESSION | runtime | default true | Existing single-active-session policy |
| AUTH_IDLE_TIMEOUT_MINUTES, AUTH_ABSOLUTE_TIMEOUT_HOURS | runtime | defaults 30 / 12 | Existing session limits |
| TRUSTED_PROXY_COUNT | runtime | default 0 | Set only after confirming trusted proxy chain |
| SUPPORT_CONTACT_TEXT | runtime | optional | Approved support copy |
| INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_DISPLAY_NAME, INITIAL_ADMIN_PASSWORD | one-time bootstrap | first admin only | No defaults; password 12–256 chars with letter, number, symbol |
| LONGDO_MAP_API_KEY | runtime, browser-visible | optional | Existing map adapter; missing key keeps existing unavailable state |
| PERMISSION_NAS_BRIDGE_URL, PERMISSION_NAS_BRIDGE_SECRET | runtime + bridge | if NAS used | Internal bridge endpoint and shared secret >=32 chars |
| NAS_BUILDING_ROOT | bridge | if NAS used | Mounted NAS root; not a web-image directory |
| PERMISSION_NAS_BRIDGE_EXTERNAL | native launcher | optional | 1 for externally managed bridge; standalone does not launch it |
| DEV_HOST | bridge | local Docker sets 0.0.0.0 | Bridge bind address; bridge PORT is separate from app PORT |
| M365_TENANT_ID, M365_CLIENT_ID, M365_CLIENT_SECRET | runtime | optional adapter | Server-side Graph credentials; secret is never a build arg |
| SHAREPOINT_HOSTNAME, SHAREPOINT_SITE_PATH | runtime | optional adapter | IT-provided site location |
| SHAREPOINT_DOCUMENT_LIBRARY, SHAREPOINT_ROOT_FOLDER, SHAREPOINT_SITE_ID, SHAREPOINT_DRIVE_ID | runtime | optional adapter | Library/folder/stable IDs |
| CAR_BOOKING_ACCEPT_NEW_BOOKINGS | runtime | default true | Existing intake switch |
| CAR_BOOKING_OSP_SYNC_ENABLED | runtime | default false | Enable only after integration review |
| CAR_BOOKING_OSP_SPREADSHEET_ID, CAR_BOOKING_OSP_SHEET_TITLE | runtime | optional sync | Spreadsheet and sheet title |
| CAR_BOOKING_GOOGLE_CLIENT_EMAIL, CAR_BOOKING_GOOGLE_PRIVATE_KEY | runtime | optional sync | Service-account credentials; preserve escaped newlines |
| CAR_BOOKING_OSP_WORKER_USER_ID, CAR_BOOKING_OSP_WORKER_SECRET | runtime | optional sync | Approved worker identity/secret |
| POSTGRES_VERSION, POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD | local Compose | local stack only | Local operator/fixture config; version default 16 matches existing CI/portable tooling, not a TencentDB assertion |
| APP_IMAGE, TOOLS_IMAGE, APP_BIND_ADDRESS, APP_HOST_PORT | Compose | local defaults supplied | Image tags / host binding |
| VERCEL_GIT_COMMIT_SHA, VERCEL_GIT_COMMIT_REF, CF_PAGES_COMMIT_SHA, CF_PAGES_BRANCH, GITHUB_SHA, GITHUB_HEAD_REF, GITHUB_REF_NAME | optional build/health fallback | no | Existing metadata fallback when APP_* omitted |

GUARANTEE_LEGACY_DIR, MAXIWA_LEGACY_DIR, MAXIWA_API_BASE, MAXIWA_DEV_EMP_ID are development-only. DASHBOARD_* entries are retained example placeholders, not active runtime requirements. CAR_BOOKING_IMPORT_DATABASE_URL and CAR_BOOKING_READINESS_DATABASE_URL are reviewed operator-tool inputs. All *_TEST_*, *_INTEGRATION, *_METRICS, DUCT_RENTAL_PDF_QA, PARITY_*, UX_TEST_DATABASE_URL, TZ and evidence/binary/Python paths in the example are test/tool-only; never inject them into production. COMPOSE_LOCAL_DATABASE, DEPLOY_TEST_BASE_URL, PLAYWRIGHT_BROWSERS_PATH are internal acceptance inputs.

## Production accounts and schema step

IT owns DB provisioning, backups and approval to apply changes. Keep the **operator-versus-runtime** account separation. This repository additionally requires distinct Core, Car and Duct runtime logins on the same database; do not reuse the operator or combine their roles.

1. Confirm PostgreSQL/extension/role capabilities and back up before any schema apply.
2. Run the tools image with an **operator-only env file** containing DATABASE_URL_MIGRATE and TLS settings. Do not mount an application's `.env.local` into the image.
3. Apply all ordered SQL using the existing tracked runner. Each file and its schema_migrations entry commits together. A session advisory lock serializes migration jobs. Re-running skips committed entries. A failure stops with nonzero exit; investigate/forward-fix, never blindly delete ledger rows.
4. Provision the three logins separately through DBA/secret-manager procedures. Core: GRANT permission_core_runtime. Car: apply the existing `scripts/car-booking-runtime-grants.sql` after replacing its **example login identifier** with the reviewed IT login. Duct: GRANT duct_rental_runtime. Grant CONNECT to the target DB if IT has revoked PUBLIC CONNECT. Logins must be LOGIN INHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS, not object owners, and must not inherit policy-worker/projection/access-manager or migration roles. Do not grant Core membership to Car/Duct.
5. Bootstrap first admin once, then deploy app with only runtime credentials and mounted private storage. Bootstrap can be run before web deployment.

```powershell
# IT supplies OPERATOR_ENV_FILE privately; no real path/secret is committed.
docker run --rm --env-file $env:OPERATOR_ENV_FILE superapp-tools:local
# If verify-full uses a custom CA, add a read-only bind mount and set its
# in-container path in the env file for both tools and app.
```

Do not use the Compose `migrate-compose.mjs` wrapper in production: it explicitly accepts only the internal local `db` host and provisions local fixture logins. Production calls `scripts/migrate-postgres.mjs` directly. No production URL/account is guessed here.

### Core/RLS change approved for this handoff

New additive migration **0059_core_runtime.sql** defines a NOLOGIN Core DML group, explicit existing-table/action grants and role-specific RLS policies. It replaces Core's former table-owner connection while leaving end-user RBAC/scopes in the existing trusted server services. It does **not** make the Core SQL account a per-user RLS account. Some Core queries (notably login) run before a user identity exists, so Core service policies allow the exact SQL operations the trusted backend needs. Append-only logs remain append-only; lifecycle checks keep their existing verified-identity policies. No DDL, TRUNCATE, ownership, default grants on future tables, Car/Duct business-table grants or helper-role memberships are added. Existing policies for other DB roles remain in place.

This migration is **authored but not applied/tested against a DB in this workspace**. Before release, run the disposable acceptance suite and representative existing Core/Car/Duct integration tests with these exact constrained logins. Future Core features must explicitly extend the allowlist only when needed. Do not solve missing privileges by granting table ownership, superuser or BYPASSRLS.

## First-admin command

For the local stack, fill INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_DISPLAY_NAME and INITIAL_ADMIN_PASSWORD in private `.env`, then:

```powershell
docker compose --profile tools run --rm bootstrap
```

For IT, use an operator-only bootstrap env file and the tools image:

```powershell
docker run --rm --env-file $env:BOOTSTRAP_ENV_FILE superapp-tools:local node scripts/bootstrap-admin.mjs
```

Bootstrap uses the existing Argon2id parameters, atomically adds the first platform-admin assignment/ALL scope and an audit entry, and forces a password change. It prints no password. It never resets/promotes an existing email. Any existing platform-admin assignment, including suspended/expired, makes re-run a no-op before reading credentials. Concurrent invocations serialize. This is no longer a break-glass reset command: use the reviewed recovery process for an existing organization. After first login change the temporary password and remove INITIAL_ADMIN_* from env/CI/secret injection.

## TLS, port, storage and health

DATABASE_SSL=disable is local only. `require` encrypts but accepts an unverified certificate; use `verify-full` when IT supplies a trusted endpoint/CA. With verify-full, mount the CA read-only, e.g. `--mount type=bind,src=<IT_CA_FILE>,dst=/run/certs/postgres-ca.pem,readonly` and set DATABASE_SSL_CA_PATH=/run/certs/postgres-ca.pem. The same policy covers all three app pools and schema/bootstrap tools. Unset DATABASE_SSL preserves existing postgres-js URL/PGSSL behaviour outside Compose; explicit mode takes precedence over URL sslmode. No client certificate/private-key requirement is assumed.

`/api/health` keeps its existing response/behaviour: ready=HTTP200, degraded=HTTP503, no-store, build.shortCommit/branch/builtAt. It is **readiness**, including SELECT 1, not an independent DB-free liveness check. Docker probes it every30s with a4s request timeout. IT must provide HTTPS and preserve authentication headers/cookies, streamed responses and long-lived Duct change connections; size timeouts appropriately. Single-session/live-refresh code is unchanged. Do not cache authenticated pages/health at the proxy. For multi-instance deployments, review Next shared-cache/server-action/deployment coordination separately; it is not configured by this single-stack reference.

| Local volume | Container path | Backup? |
| --- | --- | --- |
| postgres-data | /var/lib/postgresql/data | IT/Tencent-managed equivalent in production |
| guarantee-files | /data/guarantees | yes, consistent with DB attachment metadata |
| duct-files | /data/duct-rental | yes, documents and signatures, consistent with DB |
| nas-documents | /data/nas in bridge | IT NAS backup/ACL responsibility |
| next-cache | /app/.next/cache | no; disposable cache |

For IT storage, create private directories writable by UID1000 (or an IT-approved remapped UID) outside public. A bind mount must be permissioned on the host; Docker cannot repair arbitrary host ACLs. Avoid public/static serving of uploaded evidence. Preserve template/font licenses in the immutable image.

## Acceptance on a Docker host

```powershell
npm ci
npm run test:docker
```

The dependency-free Docker launcher also works as `node scripts/deployment/test-docker.mjs`. It reads only checked-in local placeholders, creates a unique `superapp-acceptance-<random>` project/database/storage, builds Linux images and verifies:

- All SQL migrations installed in order; re-run leaves ledger/timestamps unchanged.
- Distinct Core/Car/Duct logins are non-owner/NOSUPERUSER/NOBYPASSRLS without database/role creation, cannot DDL/TRUNCATE or cross module data/identity boundaries; Core cannot modify append-only logs or migration ledger.
- First-admin creation, unchanged repeat bootstrap, forced password change, health/build identity, main page responses and old-token rejection after another login.
- Runner is non-root, Docker healthcheck healthy, PDF assets present, no `.env`/`.git`/`.data`/Drizzle Kit or operator/initial-admin environment in the web image; prints image size.

It removes **only its uniquely named fixture volumes** in finally. It never invokes down -v on a developer/production project. On failure keep redacted CI logs and inspect before retrying. Images are left tagged for review. Do not run verify-compose directly against any populated database; it refuses a nonempty profiles table. Container acceptance is still pending in this workspace because Docker/WSL is absent and the owner chose Docker-only DB verification.

## GitLab CI and pre-push safety

The pipeline runs existing lint/type/unit/document gates plus TLS unit tests and full-history Gitleaks, builds/tests a disposable container stack, then transfers runner/tools images as an artifact to the registry-push stage. Registry authentication uses only predefined CI_REGISTRY, CI_REGISTRY_USER, CI_REGISTRY_PASSWORD, CI_REGISTRY_IMAGE. Images have immutable `$CI_COMMIT_SHA` and `$CI_COMMIT_SHA-tools` tags; app branch tag is mutable and latest updates only on the default branch. Deploy is a **manual failing TODO placeholder**; it cannot imply a server deployment succeeded.

Default runner recipe is matching Docker28 CLI/DinD over TLS, Linux Docker executor, privileged DinD and shared `/certs/client`. **TODO(IT)**: approve executor/privilege policy, pin matching maintained digests, enable registry and network access, configure artifact size limits for both compressed images and runner disk/timeout for Playwright/native builds. Shell/Kubernetes/rootless alternatives require an IT-reviewed pipeline change. See [GitLab Docker runner documentation](https://docs.gitlab.com/ci/docker/using_docker_build/) and [registry authentication](https://docs.gitlab.com/user/packages/container_registry/authenticate_with_container_registry/). No CI access to TencentDB is required by this test pipeline; no production migrations are automated.

Before adding the team's remote:

```powershell
gitleaks git . --log-opts="--all --full-history" --redact=100 --no-banner
git status --short
git diff --check
git remote -v
# Review and commit the selected deployment files first. Keep unrelated existing
# work (such as generated next-env.d.ts changes) out of that commit.
git add <REVIEWED_DEPLOYMENT_FILES>
git commit -m "build: prepare Docker and GitLab deployment"
# Replace the URL with IT's reviewed project URL; do not include tokens.
git remote add gitlab <IT_GITLAB_REPOSITORY_URL>
git push -u gitlab codex/docker-deploy
```

If `gitlab` already exists, inspect it; do not overwrite its URL blindly. The owner authorized publishing this handoff to the existing GitHub `origin/main` for IT code review. No GitLab remote or production deployment was configured; migrating the repository to the team's GitLab remains an IT follow-up.

Scan baseline:112commits/~9.18MB found one cache-key false positive and one legacy Firebase web key. Owner explicitly accepted the Firebase reference on16October2026 because the whole system is being migrated here. `.gitleaksignore` records only those exact fingerprints; other keys/paths remain scanned. The legacy HTML is excluded from every Docker target. No key was printed, revoked, rotated or removed from history. A green scan with these explicit exceptions does not mean the entire history contains no sensitive information. Stop/report any new finding; never rewrite history automatically.

## Rollback and backups

IT/Tencent owns DB snapshots/backups, restore access, encryption, retention and restore rehearsals. Record the backup ID/schema ledger and exact app/tools image SHA before applying a release. Keep previous immutable images. Rolling app code back is safe only if it remains compatible with the current schema. Do not run destructive down migrations, drop history/roles/tables or roll back the DB over newer business data automatically. Disable a module/forward-fix as appropriate.

Restore PostgreSQL **and** private guarantee/Duct files, plus IT NAS document storage and access-control metadata, to a mutually consistent point. Re-inject runtime secrets/CA, restore private-directory ownership and verify health/auth/scopes/files after restore. Next cache can be recreated. The new Core role migration is additive; code rollback can leave it installed, but revoke/deprovision logins only with IT review. There is no automatic production schema rollback.

## TODO(IT) before production

- [ ] Confirm TencentDB PostgreSQL version and pgcrypto/btree_gist availability.
- [ ] Confirm operator can create/transfer helper roles, including existing duct_rental_policy_worker BYPASSRLS. Managed-service restrictions may block current SQL; no workaround has been assumed.
- [ ] Confirm VPC/allowlist, app-to-DB network, optional operator/CI access and connection limits (Core10 + Car10 + Duct8 per production app instance, plus listeners/tools).
- [ ] Confirm TLS mode/hostname, trusted CA and mount path.
- [ ] Provision separate operator/Core/Car/Duct accounts; review inheritance, grants, ownership and schema CREATE/CONNECT policy.
- [ ] Choose server secrets injection/rotation and private-volume/NAS ACLs.
- [ ] Confirm GitLab project/branch/registry/runner, image architecture/digests, artifacts and disk limits.
- [ ] Provide reverse-proxy HTTPS, forwarded-header trust, stream/timeouts and host routing.
- [ ] Approve backup/restore retention, responsibility and rollback window; rehearse recovery.
- [ ] Run Docker acceptance and representative Core/Car/Duct constrained-role regression tests; review new0059 before applying it anywhere real.
- [ ] Complete existing module/UAT/release gates. Packaging is not production approval.
