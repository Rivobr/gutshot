FROM nginx:1.27-alpine AS runtime
# Статика без React/Vite — Xiaomi YaBrowser Lite не выполняет ES modules / тяжёлый бандл.
COPY apps/tv/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/tv/static /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
