FROM node:22-alpine AS base
RUN npm install -g pnpm@11.16.0
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
COPY apps/collector/package.json apps/collector/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter @brs/web...
COPY packages ./packages
COPY apps/web ./apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @brs/web build

FROM build AS runner
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "--filter", "@brs/web", "start"]
