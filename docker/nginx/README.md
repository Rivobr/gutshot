# Nginx — конфигурация продакшена

Три конфигурации reverse-proxy для поддоменов проекта (`docs/01-project-architecture.md`):

- `api.conf` → `api.gutshotclub.ru` → контейнер `api:3000`
- `app.conf` → `app.gutshotclub.ru` → контейнер `mini-app:80`
- `admin.conf` → `admin.gutshotclub.ru` → контейнер `admin:80`

## SSL (Let's Encrypt)

Для продакшена рекомендуется использовать `certbot` с автоматическим обновлением сертификатов:

```bash
docker run -it --rm \
  -v ./docker/nginx/certs:/etc/letsencrypt \
  -v ./docker/nginx/www:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d api.gutshotclub.ru -d app.gutshotclub.ru -d admin.gutshotclub.ru
```

После получения сертификатов добавьте в каждый конфиг блок `listen 443 ssl;` с путями к сертификатам
и редирект с 80 на 443.

## Мониторинг и логирование

- Логи Nginx: `/var/log/nginx/access.log`, `/var/log/nginx/error.log`
- Логи Backend: стандартный вывод контейнера `api` (собирается Docker/systemd journal)
- Рекомендуется подключить внешний мониторинг (Prometheus + Grafana или Uptime Kuma) для `/health`

## Backup

См. `docker/postgres/backup.sh` — ежедневный дамп базы данных PostgreSQL.
