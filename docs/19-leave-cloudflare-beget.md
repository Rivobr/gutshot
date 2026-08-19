# Убрать Cloudflare → Beget (DNS / CDN)

**Зачем:** сейчас `app` / `api` / `admin` идут через Cloudflare (`server: cloudflare`, HTTP/2).  
У Telegram Mini App это часто даёт «вечную загрузку» на iPhone.  
Сервер уже на Beget: `159.194.208.116`. SSL уже есть на nginx (Let's Encrypt).

**Цель:** домен смотрит **напрямую на VPS Beget**, без оранжевого облака Cloudflare.

---

## Сейчас (факт)

| Хост                  | Куда смотрит              | Прокси         |
| --------------------- | ------------------------- | -------------- |
| NS домена             | `*.ns.cloudflare.com`     | Cloudflare     |
| `app.gutshotapp.ru`   | IP Cloudflare             | да (оранжевое) |
| `api.gutshotapp.ru`   | IP Cloudflare             | да             |
| `admin.gutshotapp.ru` | IP Cloudflare             | да             |
| `tv.gutshotapp.ru`    | `159.194.208.116`         | уже напрямую   |
| VPS                   | `159.194.208.116` (Beget) | —              |

---

## Вариант 1 — быстро (5 минут): выключить Cloudflare-прокси

Не меняя NS, сразу убрать прокси:

1. Зайти в [Cloudflare](https://dash.cloudflare.com) → домен `gutshotapp.ru` → **DNS**.
2. Для записей `app`, `api`, `admin` (и `@` / `www` если есть):
   - **A** → `159.194.208.116`
   - облако сделать **серым** (DNS only), не оранжевым.
3. Подождать 1–5 минут.
4. Проверка с телефона / Mac:

```bash
dig +short app.gutshotapp.ru
# должно быть: 159.194.208.116

curl -sI https://app.gutshotapp.ru | grep -i server
# должно быть: nginx (НЕ cloudflare)

curl -sI https://api.gutshotapp.ru/api/v1/health
```

5. В боте: закрыть Mini App → `/start` → открыть новой кнопкой.

Этого обычно достаточно, чтобы убрать зависания WebView.

---

## Вариант 2 — правильно: перенести DNS на Beget

### Шаг A. DNS в панели Beget

1. Зайти в панель Beget → **Домены** → `gutshotapp.ru`  
   (если домена нет в Beget — добавить / привязать).
2. Открыть **DNS / Управление зоной**.
3. Создать/проверить записи:

| Тип | Имя     | Значение          | TTL |
| --- | ------- | ----------------- | --- |
| A   | `@`     | `159.194.208.116` | 300 |
| A   | `www`   | `159.194.208.116` | 300 |
| A   | `app`   | `159.194.208.116` | 300 |
| A   | `api`   | `159.194.208.116` | 300 |
| A   | `admin` | `159.194.208.116` | 300 |
| A   | `tv`    | `159.194.208.116` | 300 |

(TV-приложение онлайн уже выключено — запись `tv` можно не создавать.)

### Шаг B. Сменить NS у регистратора

Где куплен домен (Beget / REG.RU / другой):

1. Вместо Cloudflare NS указать **NS Beget** (из панели Beget, обычно вида):
   - `ns1.beget.com`
   - `ns2.beget.com`
   - (иногда ещё `ns1.beget.pro` / `ns2.beget.pro` — взять **точные** из панели)
2. Сохранить. Распространение: от 15 минут до 24 часов (часто быстрее).

Проверка:

```bash
dig +short NS gutshotapp.ru
# должны стать ns*.beget.*

dig +short app.gutshotapp.ru
# 159.194.208.116
```

### Шаг C. SSL на сервере (уже есть — проверить)

На VPS сертификат Let's Encrypt уже обслуживает `app` / `api` / `admin`.  
После смены DNS проверить:

```bash
curl -sI https://app.gutshotapp.ru | head -5
curl -s https://api.gutshotapp.ru/api/v1/health
```

Если SSL ругается — на сервере обновить сертификат:

```bash
cd /opt/gutshot
docker run --rm \
  -v /opt/gutshot/docker/nginx/certs:/etc/letsencrypt \
  -v /opt/gutshot/docker/nginx/www:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  --cert-name api.gutshotapp.ru \
  -d api.gutshotapp.ru \
  -d app.gutshotapp.ru \
  -d admin.gutshotapp.ru \
  --expand --non-interactive --agree-tos \
  -m ВАШ@EMAIL.ru
docker exec gutshot-nginx nginx -s reload
```

### Шаг D. Cloudflare можно выключить

После того как NS уже Beget и всё открывается:

1. Cloudflare → домен → **Overview** → **Remove site** (или оставить, но не использовать).
2. Tunnel / Zero Trust для этих хостов — отключить, если был.

---

## Про Beget CDN

**Важно:** для Mini App и API **CDN кэшировать нельзя** (динамический вход, JWT, webhook).

| Сервис                                      | CDN Beget                                              |
| ------------------------------------------- | ------------------------------------------------------ |
| `app.gutshotapp.ru` (Mini App)              | **не кэшировать** / не подключать CDN, только прямой A |
| `api.gutshotapp.ru` (API + webhook)         | **никогда не кэшировать**                              |
| `admin.gutshotapp.ru`                       | не нужно                                               |
| Статика (если будет отдельный сайт-визитка) | можно CDN                                              |

Для бота достаточно: **DNS Beget + прямой A на VPS + Let's Encrypt**.  
Отдельный «Beget CDN» для Telegram Mini App обычно **не нужен** и может снова сломать вход.

Если в панели Beget включают CDN на поддомен — для `app` и `api` оставить режим **без кэша / origin only**.

---

## Checklist после переключения

- [ ] `dig app.gutshotapp.ru` → `159.194.208.116`
- [ ] `curl -I https://app.gutshotapp.ru` → `server: nginx`, **не** `cloudflare`
- [ ] `curl https://api.gutshotapp.ru/api/v1/health` → `ok`
- [ ] BotFather → Mini App URL всё ещё `https://app.gutshotapp.ru`
- [ ] В боте `/start` → приложение открывается на iPhone и Android
- [ ] Админка `https://admin.gutshotapp.ru` открывается

---

## Что сказать игрокам после смены

1. Полностью закрыть Mini App.
2. `/start` в боте.
3. Открыть **новой** кнопкой (не из старого сообщения).

---

## Коротко

1. **Сейчас** — в Cloudflare серые облака на `app`/`api`/`admin` → `159.194.208.116`.
2. **Потом** — NS на Beget, те же A-записи.
3. **CDN Beget** для app/api **не включать**.
4. SSL оставить на сервере (Let's Encrypt).
