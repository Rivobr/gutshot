FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS deps
COPY pnpm-workspace.yaml package.json ./
COPY apps/admin/package.json ./apps/admin/package.json
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM base AS build
ARG VITE_ADMIN_API_URL=https://api.ottisk.store/api/v1
ENV VITE_ADMIN_API_URL=$VITE_ADMIN_API_URL
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @gutshot/admin build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
