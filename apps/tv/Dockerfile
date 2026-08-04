FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/tv/package.json ./apps/tv/package.json
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM base AS build
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app
COPY --from=deps /app ./
COPY . .
RUN pnpm --filter @gutshot/tv build

FROM nginx:1.27-alpine AS runtime
COPY apps/tv/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/tv/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
