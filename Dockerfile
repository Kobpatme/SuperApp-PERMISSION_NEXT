# syntax=docker/dockerfile:1
# Node 22 matches the existing CI/hosting contract; Debian glibc supports the
# locked Argon2id/Sharp/PDF native binaries. TODO(IT): approve/pin image digests.
FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM deps AS builder
ENV NODE_ENV=production
# Public build identity only. No credentials, DB URLs or private build args.
ARG APP_COMMIT_SHA
ARG APP_BRANCH
ARG APP_BUILT_AT
COPY next.config.ts next-env.d.ts tsconfig.json ./
COPY src ./src
COPY public ./public
COPY scripts/write-build-info.mjs ./scripts/write-build-info.mjs
RUN APP_COMMIT_SHA="$APP_COMMIT_SHA" APP_BRANCH="$APP_BRANCH" APP_BUILT_AT="$APP_BUILT_AT" npm run build

FROM base AS tools
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --no-audit --no-fund
COPY scripts/migrate-postgres.mjs scripts/bootstrap-admin.mjs scripts/car-booking-runtime-grants.sql ./scripts/
COPY scripts/deployment ./scripts/deployment
COPY src/lib/database-ssl.mjs ./src/lib/database-ssl.mjs
COPY supabase/migrations ./supabase/migrations
USER node
CMD ["node", "scripts/migrate-postgres.mjs"]

# NAS bridge is kept as a separate internal service; no legacy HTML/Firebase
# assets are copied. IT can mount its private NAS at /data/nas or use an external
# bridge. This target uses only Node built-ins and preserves the bridge code.
FROM base AS nas
ENV NODE_ENV=production DEV_HOST=0.0.0.0 PORT=8766 NAS_BUILDING_ROOT=/data/nas
COPY --chown=node:node mods/permission-next/dev-server.js ./bridge.cjs
RUN mkdir -p /data/nas && chown node:node /data/nas
USER node
EXPOSE 8766
CMD ["node", "bridge.cjs"]

# Opt-in disposable acceptance fixture, never part of the production image.
FROM deps AS verification
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install --with-deps chromium
COPY scripts ./scripts
COPY src/lib/database-ssl.mjs ./src/lib/database-ssl.mjs
COPY supabase/migrations ./supabase/migrations
USER node
CMD ["node", "scripts/deployment/verify-compose.mjs"]

FROM base AS runner
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
RUN mkdir -p /data/guarantees /data/duct-rental /app/.next/cache \
    && chown -R node:node /data /app/.next/cache
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=6s --start-period=45s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health',{signal:AbortSignal.timeout(4000)}).then(async r=>{if(!r.ok||(await r.json()).status!=='ready')process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
