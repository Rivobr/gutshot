FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/mini-app/package.json ./apps/mini-app/package.json
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM base AS build
ARG VITE_API_URL=https://api.gutshotapp.ru/api/v1
ENV VITE_API_URL=$VITE_API_URL
WORKDIR /app
COPY --from=deps /app ./
COPY . .
RUN pnpm --filter @gutshot/mini-app build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/apps/mini-app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
