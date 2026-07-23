# The Collector runs TypeScript directly through tsx — there is no build step.
FROM node:22-alpine

RUN npm install -g pnpm@11.16.0
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
COPY apps/collector/package.json apps/collector/
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile --filter @brs/collector... --filter @brs/db...

COPY packages ./packages
COPY apps/collector ./apps/collector

CMD ["pnpm", "--filter", "@brs/collector", "start"]
