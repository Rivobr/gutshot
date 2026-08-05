# План: подключить поддомен Mini App к Telegram

Цель: Telegram Bot / Mini App стабильно открывают приложение по HTTPS на вашем поддомене.

Сейчас в проде используются:

| Поддомен              | Назначение        | Статус       |
| --------------------- | ----------------- | ------------ |
| `app.gutshotapp.ru`   | Telegram Mini App | ✅           |
| `api.gutshotapp.ru`   | Backend + webhook | ✅           |
| `admin.gutshotapp.ru` | Админ-панель      | ✅           |
| `tv.gutshotapp.ru`    | TV-табло турнира  | ⏳ DNS + SSL |

TV-приложение уже собрано (`apps/tv`), крутится в Docker на порту `8082`, nginx-конфиг `docker/nginx/conf.d/tv.conf` готов. Ссылка из админки: **Турнир → Открыть TV-табло**.

---

## 1. DNS

В панели домена (Cloudflare для `gutshotapp.ru`):

1. Создайте **A**-записи:
   - `app` → `159.194.208.116`
   - `api` → `159.194.208.116`
   - `admin` → `159.194.208.116`
   - `tv` → `159.194.208.116`
2. Для **TV** и **admin** удобнее режим **DNS only** (серое облако) — как сейчас у `admin`, трафик идёт напрямую на VPS.
3. Дождитесь распространения DNS (`dig tv.gutshotapp.ru`).

Если идёте через **Cloudflare Tunnel** — в Zero Trust → Networks → Tunnels добавьте Public Hostnames на те же имена и на локальные порты (`8080` mini-app, `3000` api, `8081` admin, `8082` tv).

---

## 2. SSL (обязательно HTTPS)

Telegram Mini App и webhook принимают **только https**. TV-табло тоже лучше открывать по https (браузер на телевизоре / Chromecast).

Вариант A — Let's Encrypt на сервере (расширить текущий сертификат, добавив `tv`):

```bash
docker run --rm \
  -v /opt/gutshot/docker/nginx/certs:/etc/letsencrypt \
  -v /opt/gutshot/docker/nginx/www:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  --cert-name api.gutshotapp.ru \
  -d api.gutshotapp.ru \
  -d app.gutshotapp.ru \
  -d admin.gutshotapp.ru \
  -d tv.gutshotapp.ru \
  --expand --non-interactive --agree-tos \
  -m YOUR_EMAIL@example.com
docker exec gutshot-nginx nginx -s reload
```

Вариант B — сертификат Cloudflare (Full / Full Strict), если `tv` за оранжевым облаком.

Проверка:

```bash
curl -I https://app.gutshotapp.ru
curl -I https://api.gutshotapp.ru/api/v1/health
curl -I https://tv.gutshotapp.ru
```

Ожидаем `200` / `301→200`, без ошибок сертификата.

---

## 3. Env на сервере (`.env`)

```env
NODE_ENV=production
API_URL=https://api.gutshotapp.ru
MINI_APP_URL=https://app.gutshotapp.ru
TELEGRAM_BOT_TOKEN=...          # от @BotFather
TELEGRAM_BOT_USERNAME=...
TELEGRAM_WEBHOOK_SECRET=...     # длинная случайная строка
# опционально явно:
# TELEGRAM_WEBHOOK_URL=https://api.gutshotapp.ru/api/v1/telegram/webhook

VITE_API_URL=https://api.gutshotapp.ru/api/v1
VITE_ADMIN_API_URL=https://api.gutshotapp.ru/api/v1
```

Важно:

- `MINI_APP_URL` = **mini-app**, не admin.
- `API_URL` должен быть `https://...`, иначе webhook на `/start` не встанет.

---

## 4. Nginx / Docker

1. Конфиги: `docker/nginx/conf.d/{app,api,admin}.conf`
2. Поднять стек:

```bash
docker compose up -d --build
```

3. Убедиться, что `app` проксирует в `gutshot-mini-app`, а не в admin (`X-Gutshot-App: mini-app`).

---

## 5. Привязка в BotFather

1. Откройте [@BotFather](https://t.me/BotFather) → ваш бот.
2. `/setdomain` → `app.gutshotapp.ru`
3. `/setmenubutton` (или дождитесь авто-установки API при старте):
   - URL: `https://app.gutshotapp.ru/enter.html`
   - Текст: `Открыть`
4. Web App URL в описании бота — тот же домен.

API при старте сам вызывает:

- `setWebhook` → `https://api.gutshotapp.ru/api/v1/telegram/webhook`
- `setChatMenuButton` → `https://app.gutshotapp.ru/enter.html`

Проверка webhook:

```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

Должны видеть ваш `api.../telegram/webhook` без `last_error_message`.

---

## 6. Чеклист «открылось из Telegram»

1. Написать боту `/start` — пришло приветствие + кнопка меню.
2. Нажать меню «Открыть» — грузится клуб, **не** «Страница не найдена», **не** админка.
3. Авторизация проходит (профиль / согласие).
4. На iPhone и Android отдельно проверить.
5. Если Telegram кэширует старый `/t.html` — entry `enter.html` + `t.html` редиректят на `/`.

---

## 7. Если поддомен другой (например `app.gutshotclub.ru`)

1. DNS + SSL на новый хост.
2. Обновить nginx `server_name`.
3. Обновить `.env` (`MINI_APP_URL`, `API_URL`, Vite URL).
4. В BotFather `/setdomain` на новый домен.
5. Пересобрать и перезапустить `api` + `mini-app` + `nginx`.

---

## Частые ошибки

| Симптом                     | Причина                                  | Что сделать                                            |
| --------------------------- | ---------------------------------------- | ------------------------------------------------------ |
| «Страница не найдена»       | Меню открывает `/t.html` как SPA-маршрут | Entry `enter.html`, редирект `t.html` → `/`            |
| Вечная загрузка             | `app` смотрит на admin                   | Проверить nginx proxy на `gutshot-mini-app`            |
| `/start` молчит             | webhook не https / неверный URL          | `API_URL=https://api...`, смотреть логи API            |
| SSL / bad record mac на iOS | битый TLS / HTTP/2                       | Cloudflare Tunnel или HTTP/1.1 + правильный сертификат |
| 401 / нет initData          | открыли не из бота                       | Открывать только кнопкой меню бота                     |
