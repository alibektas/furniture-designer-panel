# furniture-designer-panel (admin SvelteKit app) for ECS Fargate.
#
# IMPORTANT: build context is the MONOREPO ROOT, not this directory, because:
#   - svelte.config.js declares the `$fd` alias → ../furniture-designer/src/lib
#   - drizzle.config.ts loads the shared ../.env at the repo root
# Build from root:  docker build -f furniture-designer-panel/Dockerfile .
#
# The same image doubles as the DB-migration runner: it carries drizzle-kit and
# the panel's drizzle/ migration files, so the one-off ECS migration task runs
# `bunx drizzle-kit migrate` against RDS. The panel owns the schema/migrations
# for the whole stack (the designer app only reads those tables).
#
# Multi-stage: bun builds, node:22 runs (adapter-node; @types/node = ^24, no
# pinned engine — Node 22 LTS chosen to match the designer image).

# ---- build stage -----------------------------------------------------------
FROM oven/bun:1 AS build
WORKDIR /app

# The sibling app's source must be present for the `$fd` alias to resolve.
# Copy it first (changes rarely) then the panel itself.
COPY furniture-designer/src ./furniture-designer/src

WORKDIR /app/furniture-designer-panel
COPY furniture-designer-panel/package.json furniture-designer-panel/bun.lock ./
RUN bun install --frozen-lockfile

COPY furniture-designer-panel/ ./
# src/lib/server/db/index.ts throws if DATABASE_URL is unset at *module load*,
# which SvelteKit triggers during the build. The value is never used at build
# time — `$env/dynamic/private` re-reads the real env at runtime — so a
# throwaway placeholder just satisfies the presence check. Same for the
# better-auth secret, which auth.ts validates at load.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    BETTER_AUTH_SECRET="build-time-placeholder" \
    bun run build

# ---- runtime stage ---------------------------------------------------------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Bun runs the migration command (`bun run db:migrate` → drizzle-kit migrate).
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

# Full node_modules from the build stage — it includes drizzle-kit (a
# devDependency) so the migration task can run drizzle-kit without a network
# fetch. adapter-node bundles what the web server needs into build/, so the web
# service doesn't depend on these at request time; carrying them is the simple,
# reliable way to keep the migration tooling on hand.
COPY --from=build /app/furniture-designer-panel/build ./build
COPY --from=build /app/furniture-designer-panel/node_modules ./node_modules
COPY --from=build /app/furniture-designer-panel/package.json ./package.json

# Migration assets (used only by the migration task, harmless for the web app):
# drizzle config, the generated SQL migrations, and the schema they reference.
COPY --from=build /app/furniture-designer-panel/drizzle.config.ts ./drizzle.config.ts
COPY --from=build /app/furniture-designer-panel/drizzle ./drizzle
COPY --from=build /app/furniture-designer-panel/src/lib/server/db ./src/lib/server/db

RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

EXPOSE 3000

CMD ["node", "build"]
