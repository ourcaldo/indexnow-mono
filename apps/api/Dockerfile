# ==============================================================================
# Base stage — install dependencies
# ==============================================================================
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
WORKDIR /app

# ==============================================================================
# Dependencies stage — install & prune
# ==============================================================================
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared/package.json     packages/shared/package.json
COPY packages/database/package.json   packages/database/package.json
COPY packages/auth/package.json       packages/auth/package.json
COPY packages/mail/package.json       packages/mail/package.json
COPY packages/services/package.json   packages/services/package.json
COPY packages/ui/package.json         packages/ui/package.json
COPY apps/api/package.json            apps/api/package.json
RUN pnpm install --frozen-lockfile

# ==============================================================================
# Builder stage — build packages then app
# ==============================================================================
FROM base AS builder
COPY --from=deps /app/node_modules          ./node_modules
COPY --from=deps /app/packages/shared/node_modules     packages/shared/node_modules
COPY --from=deps /app/packages/database/node_modules   packages/database/node_modules
COPY --from=deps /app/packages/auth/node_modules       packages/auth/node_modules
COPY --from=deps /app/packages/mail/node_modules       packages/mail/node_modules
COPY --from=deps /app/packages/services/node_modules   packages/services/node_modules
COPY --from=deps /app/packages/ui/node_modules         packages/ui/node_modules
COPY --from=deps /app/apps/api/node_modules            apps/api/node_modules

COPY packages/   packages/
COPY apps/api/    apps/api/
COPY turbo.json   turbo.json
COPY tsconfig.json tsconfig.json
COPY package.json  package.json
COPY pnpm-workspace.yaml pnpm-workspace.yaml
COPY pnpm-lock.yaml pnpm-lock.yaml

# Build packages first, then the API app
RUN pnpm turbo build --filter=api...

# ==============================================================================
# Runner stage — production image
# ==============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=5000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/api/.next/standalone ./
COPY --from=builder /app/apps/api/.next/static     ./apps/api/.next/static
COPY --from=builder /app/apps/api/public            ./apps/api/public

USER nextjs

EXPOSE 5000

CMD ["node", "apps/api/server.js"]
