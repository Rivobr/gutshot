FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat \
  && corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app ./
COPY . .
RUN pnpm --filter @gutshot/api prisma:generate
RUN pnpm --filter @gutshot/api build
RUN cd apps/api && npx tsc prisma/seed.ts --outDir dist/prisma \
  --module commonjs --target ES2021 --moduleResolution node \
  --esModuleInterop --skipLibCheck --noEmitOnError false

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
