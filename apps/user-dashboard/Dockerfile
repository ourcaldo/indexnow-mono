# ==============================================================================
# Base stage — install dependencies
# ==============================================================================
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# ==============================================================================
# Dependencies stage — install & prune
# ==============================================================================
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/shared/package.json     packages/shared/package.json
COPY packages/database/package.json   packages/database/package.json
COPY packages/auth/package.json       packages/auth/package.json
COPY packages/ui/package.json         packages/ui/package.json
COPY apps/user-dashboard/package.json apps/user-dashboard/package.json
RUN pnpm install --frozen-lockfile

# ==============================================================================
# Builder stage — build packages then app
# ==============================================================================
FROM base AS builder
COPY --from=deps /app/node_modules          ./node_modules
COPY --from=deps /app/packages/shared/node_modules     packages/shared/node_modules
COPY --from=deps /app/packages/database/node_modules   packages/database/node_modules
COPY --from=deps /app/packages/auth/node_modules       packages/auth/node_modules
COPY --from=deps /app/packages/ui/node_modules         packages/ui/node_modules
COPY --from=deps /app/apps/user-dashboard/node_modules  apps/user-dashboard/node_modules

COPY packages/          packages/
COPY apps/user-dashboard/ apps/user-dashboard/
COPY turbo.json          turbo.json
COPY tsconfig.json       tsconfig.json
COPY package.json        package.json
COPY pnpm-workspace.yaml pnpm-workspace.yaml
COPY pnpm-lock.yaml      pnpm-lock.yaml

RUN pnpm turbo build --filter=user-dashboard...

# ==============================================================================
# Runner stage — production image
# ==============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/user-dashboard/.next/standalone ./
COPY --from=builder /app/apps/user-dashboard/.next/static     ./apps/user-dashboard/.next/static
COPY --from=builder /app/apps/user-dashboard/public            ./apps/user-dashboard/public

USER nextjs

EXPOSE 3000

CMD ["node", "apps/user-dashboard/server.js"]
