FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.19.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN pnpm build

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable \
  && corepack prepare pnpm@11.19.0 --activate \
  && addgroup -S workforce \
  && adduser -S workforce -G workforce

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile \
  && pnpm store prune

COPY --from=build --chown=workforce:workforce /app/dist ./dist
COPY --chown=workforce:workforce db ./db

USER workforce
CMD ["node", "dist/cli.js"]
