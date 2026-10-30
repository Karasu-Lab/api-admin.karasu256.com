FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
RUN apk add --no-cache git && corepack enable && corepack prepare pnpm@11.12.0 --activate

FROM base AS pruner
WORKDIR /app
RUN pnpm add -g turbo@latest
COPY . .
RUN turbo prune api.admin.karasu256.com --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
RUN pnpm --filter api.admin.karasu256.com run build

FROM base AS prod-installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile --prod
COPY --from=pruner /app/out/full/ .

FROM node:22-alpine AS runner

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=prod-installer --chown=nestjs:nodejs /app ./
COPY --from=builder --chown=nestjs:nodejs /app/apps/api.admin.karasu256.com/dist ./apps/api.admin.karasu256.com/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api.admin.karasu256.com/configs ./apps/api.admin.karasu256.com/configs

WORKDIR /app/apps/api.admin.karasu256.com
USER nestjs
EXPOSE 3006
ENV NODE_ENV=production
CMD ["node", "dist/main"]
