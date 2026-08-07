# Отчёт: бесконечная загрузка бота / Mini App и как закрыть тему навсегда

**Дата:** 2026-08-07  
**Прод:** `app.gutshotapp.ru`, бот `@gutshotpokerbot`, VPS `159.194.208.116` (`/opt/gutshot`)  
**Актуальный фикс на проде:** `cd1b337` (деплой выполнен)

---

## 1. Короткий вывод

Проблема «вечной загрузки» — это **не один баг**, а цепочка хрупких мест на пути:

> Telegram → WebView → `enter.html` → авторизация → SPA (`/`) → тяжёлый `GET /profile` → первый экран

Часть зависаний уже чинили точечно (fullscreen, таймауты, HTTP/2, кэш `/t.html`).  
Чтобы **больше не вспоминать**, нужен не ещё один патч, а **жёсткая архитектура входа + мониторинг + запрет опасных API на boot**.

Сейчас вход «работает чаще», но остаётся риск: тяжёлый профиль на критическом пути, слабая телеметрия, ручной деплой без smoke-теста открытия из Telegram.

---

## 2. Как пользователь открывает приложение

| Точка входа                     | Что открывается                     | Файл / код                                                          |
| ------------------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| `/start` в боте                 | Inline-кнопка WebApp + ticket       | `apps/api/src/modules/telegram/telegram.service.ts` → `sendWelcome` |
| Кнопка меню слева от поля ввода | `enter.html?v=…` (без ticket)       | `telegram-bot.bootstrap.ts` → `setChatMenuButton`                   |
| Старые закладки / кэш           | `/t.html`, `/boot.html`, `/go.html` | `apps/mini-app/public/*`                                            |

Канонический URL:

```text
https://app.gutshotapp.ru/enter.html?v=20260807b[&ticket=…]
```

После логина:

```text
https://app.gutshotapp.ru/?from=enter&t=…&v=20260807b
```

---

## 3. Полная цепочка загрузки (и где «залипает» UI)

```text
1. Telegram открывает WebView → enter.html
   UI: «Входим…» / «Проверяем сессию…» / «Повтор входа…»

2. Auth:
   - initData → POST /api/v1/auth/telegram
   - иначе ticket → POST /api/v1/auth/telegram/ticket
   - иначе токен в localStorage → GET /api/v1/profile
   UI: «Открываем клуб…»  ← ЭКРАН С ВАШИХ СКРИНОВ

3. location.replace → SPA index.html (+ JS ~535 KB)
   UI: логотип / splash

4. React useStartup()
   UI: SplashScreen «Открываем клуб…»

5. ConsentGate → useProfile → GET /api/v1/profile (тяжёлый)
   UI: «Загружаем профиль…»

6. ConsentScreen ИЛИ Home
```

### Как читать симптом по экрану

| Что видит игрок                                   | Где зависло                                                                      |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| Синий/странный placeholder Telegram («SU» и т.п.) | WebView / нативный скелетон, страница ещё не жива или уже зависла                |
| 5 полосок + крутилка + **«Открываем клуб…»**      | `enter.html` после успешного логина, переход в SPA не завершился / WebView завис |
| Логотип PNG + полоска + **«Открываем клуб…»**     | React `useStartup`                                                               |
| **«Загружаем профиль…»**                          | `ConsentGate` / `/profile`                                                       |
| Бот молчит на `/start`                            | Webhook / API / Telegram API (это уже не Mini App)                               |

---

## 4. Корневые причины (по приоритету)

### A. `requestFullscreen()` на старте (главный виновник последних зависаний)

На части Telegram WebView (особенно мобильные) вызов `Telegram.WebApp.requestFullscreen()` **может заморозить JS-поток**.

Симптом: после логина навечно «Открываем клуб…», кнопки «Повторить» нет (таймер сбрасывался в `goApp()`).

**Статус:** убрано с boot-пути (`enter.html`, `boot.html`, `index.html`, `configureTelegramChrome`). На проде проверено: fullscreen больше не вызывается.

### B. Таймаут профиля сбрасывался на каждом retry

`ConsentGate` зависел от `isFetching`. Axios timeout 12с × retry → таймер 12с начинался заново → ощущение бесконечного «Загружаем профиль…».

**Статус:** wall-clock дедлайн 12с, не сбрасывается на retry.

### C. После `goApp()` снимался watchdog

`location.replace` + clearTimeout → если WebView завис на навигации, UI крутился вечно без кнопки.

**Статус:** после `goApp` есть escape hatch 5с → «Повторить».

### D. Синхронная загрузка `telegram-web-app.js` с CDN

На части сетей/VPN скрипт не грузился → чёрный экран / нативный скелетон без React.

**Статус:** CDN только async/fallback; внутри Telegram bridge уже инжектится клиентом.

### E. HTTP/2 + TLS keepalive в iOS Telegram WebView

В nginx явно задокументировано: HTTP/2 давал «zero-hit hangs»; reuse TLS → `bad record mac` → auth умирал после статики.

**Статус:** `app.conf` — HTTP/1.1 only, `keepalive_requests 1`.

### F. Устаревший кэш entry (`/t.html`, старый `?v=`)

Telegram/CDN/WebView кэшируют entry HTML → пользователи открывают мёртвый/старый путь (NotFound / старый JS с fullscreen).

**Статус:** канон `enter.html`, `Cache-Control: no-store`, bump `v=` в меню бота при старте API.

### G. Нет `initData` в WebView

Бывает за прокси/туннелем/битым открытием не из кнопки бота.

**Статус:** ticket JWT (7 дней) в кнопке `/start` как запасной вход.

### H. Тяжёлый `GET /api/v1/profile` на критическом пути входа — **ещё открыто**

`ProfileService.getProfile` на каждый вход считает метрики, достижения, историю мест, QR и т.д.  
ConsentGate **блокирует UI**, пока это не вернётся.

Это главный **оставшийся** источник «долгой/вечной» загрузки после фикса fullscreen.

### I. Reload-loop на 401

Раньше `onUnauthorized` → clear token → reload мог крутиться.

**Статус:** один reload на сессию (`REAUTH_FLAG`), снимается только после успешного профиля.

### J. «Бот сам не отвечает» (отдельный класс)

Если на `/start` тишина — это не splash Mini App, а:

- webhook не установлен / URL localhost
- API упал
- секрет webhook не совпал
- Telegram не достучался до `api.gutshotapp.ru`

API при старте сам ставит webhook + menu button (с ретраями).

---

## 5. Что уже сделано (mitigations)

| Мера                                          | Где                                      |
| --------------------------------------------- | ---------------------------------------- |
| Нет `requestFullscreen` на boot               | mini-app entry + `telegram.ts`           |
| Hard timeout 18с + retry на enter             | `enter.html` / `boot.html`               |
| 5с escape после перехода в SPA                | `goApp()`                                |
| Wall-clock timeout профиля 12с                | `ConsentGate`                            |
| Ticket-auth если нет initData                 | bot + `auth/telegram/ticket`             |
| Same-origin API `/api/v1`                     | nginx `app.conf` + Vite build            |
| HTTP/1.1 + короткий keepalive                 | `docker/nginx/conf.d/app.conf`           |
| `no-store` на entry HTML                      | nginx + mini-app nginx                   |
| Menu button → `enter.html?v=…` при старте API | `telegram-bot.bootstrap.ts`              |
| Деплой фикса на прод                          | `cd1b337`, контейнеры `mini-app` + `api` |

---

## 6. Почему это всё равно может вернуться

1. Кто-то снова добавит `requestFullscreen` «для красоты» на boot.
2. Entry URL в меню бота откатится на `/` или `/t.html` без bump `v=`.
3. Cloudflare/прокси снова включит HTTP/2/HTTP/3 на `app`.
4. `/profile` станет ещё тяжелее → ConsentGate будет упираться в 12с.
5. Деплой без проверки «открылось ли из Telegram» на iOS+Android.
6. Нет алерта: мы узнаём о проблеме только от игроков.

Точечные фиксы **не гарантируют** «никогда не вспоминать». Нужен контур ниже.

---

## 7. План «закрыть тему навсегда»

Цель: любой сбой входа либо **самовосстанавливается за ≤5–10с с кнопкой**, либо **сразу алертит**, и **опасные паттерны нельзя влить в main/prod**.

### 7.1. Архитектура boot (must)

1. **Один канонический entry:** только `enter.html`.  
   `boot.html` / `go.html` / `t.html` — только редирект на enter (или удалить после миграции).
2. **Лёгкий boot API:** `GET /api/v1/me/bootstrap`  
   Поля: `id`, `nickname`, `consentAcceptedAt`, `level` (минимум).  
   ConsentGate ждёт **только** его. Полный `/profile` — после первого экрана (lazy).
3. **Запрет fullscreen на boot** — lint/CI rule:  
   в `public/*.html` и `configureTelegramChrome` запрещён `requestFullscreen`.  
   Fullscreen — только по явному жесту пользователя (если вообще нужен).
4. **Идемпотентный enter:**  
   auth → token → сразу показать shell приложения (скелетон Home), данные догружать.  
   Никогда не держать пользователя на спиннере без deadline + «Повторить» + «Открыть через /start».
5. **Версия entry = build id**  
   Автоматически подставлять `v=<git sha>` в menu button и `/start`, не руками `20260807b`.

### 7.2. Надёжность сети / WebView (must)

1. Оставить HTTP/1.1 + `keepalive_requests 1` на `app.gutshotapp.ru` (не «оптимизировать» обратно без iOS-теста).
2. Не грузить сторонние sync-скрипты до `ready()`.
3. JS-бандл: code-split, чтобы первый paint не зависел от 535 KB целиком (цель <200 KB first load).
4. Service Worker **не** кэшировать `enter.html` / API auth (если появится PWA).

### 7.3. Наблюдаемость (must, иначе снова «узнаем от игроков»)

1. Клиентский boot-telemetry:  
   этапы `enter_start → auth_ok → spa_nav → startup_ready → profile_ok → home`
   - `fail_reason`, `platform`, `tg_version`, `duration_ms` → `POST /api/v1/telemetry/boot` (без PII).
2. Уже есть `/__boot.gif` + `boot_ping.log` — превратить в метрики/алерты.
3. Synthetic check раз в 1–2 мин с VPS:  
   `enter.html` 200 + health + auth endpoint отвечает (не полный Telegram E2E, но ловит «сайт мёртв»).
4. Алерт в Telegram admin-чат:
   - API down
   - webhook pending updates > N
   - boot fail rate > X% за 10 мин
   - menu button URL не содержит `enter.html`

### 7.4. Тесты и «ворота» деплоя (must)

1. Playwright smoke (хотя бы desktop WebView mock):  
   enter → mock auth → home без зависания > 8с.
2. Статический запрет `requestFullscreen` в boot-файлах (CI grep).
3. Deploy checklist (автоматизировать скриптом на VPS):

```bash
git pull && docker compose up -d --build mini-app api
curl -sf https://app.gutshotapp.ru/enter.html | grep -q 'Не вызываем requestFullscreen'
curl -sf https://app.gutshotapp.ru/api/v1/health
# проверить в логах API: menu button → enter.html?v=
```

4. После деплоя — обязательный ручной smoke: iOS + Android, `/start` + menu button (2 минуты).

### 7.5. Продуктовый UX при деградации (should)

1. Любой splash > 5с → текст причины + «Повторить» + «Инструкция: /start».
2. Если initData нет и ticket протух — не крутить, сразу понятная ошибка.
3. Offline/плохой клубный Wi‑Fi: кэшированный last-good shell с пометкой «нет сети» (как идея offline TV).

### 7.6. Операционка бота (should)

1. Healthbot раз в N минут: `getWebhookInfo`, если `url` пустой — переустановить.
2. Не менять `MINI_APP_URL` на admin/localhost (уже есть защита в коде — сохранить).
3. Отдельный runbook: «бот молчит» vs «крутилка в Mini App» (разные плейбуки).

---

## 8. Roadmap внедрения (практично)

| Этап                                                     | Срок       | Результат                                  |
| -------------------------------------------------------- | ---------- | ------------------------------------------ |
| **P0** Уже сделано                                       | —          | Убран fullscreen, watchdog, деплой на прод |
| **P1** `GET /me/bootstrap` + ConsentGate на лёгкий ответ | 0.5–1 день | Вход не зависит от метрик/ачивок           |
| **P1** CI-запрет fullscreen + auto `v=gitsha` в menu     | 0.5 дня    | Регрессии не вливаются молча               |
| **P2** Boot telemetry + алерт в Telegram                 | 1 день     | Узнаём о сбоях раньше игроков              |
| **P2** Playwright smoke в CI + post-deploy script        | 1 день     | Деплой без «авось открылось»               |
| **P3** Урезать first JS bundle / skeleton Home           | 1–2 дня    | Быстрее first paint в слабом WebView       |

После P1+P2 тема «бесконечная загрузка» перестаёт быть сюрпризом: либо быстро открывается, либо есть кнопка/алерт и понятная причина.

---

## 9. Что сделать игроку прямо сейчас (после деплоя `cd1b337`)

1. Полностью закрыть Mini App (крестик).
2. В боте `/start`.
3. Открыть **новой** кнопкой (подтянется `enter.html?v=20260807b`).
4. Если снова крутится >5–10с — должна появиться «Повторить»; пришлите **точный текст** на экране.

---

## 10. Итог одной фразой

**Бесконечная загрузка = хрупкий Telegram WebView + опасные вызовы на boot + тяжёлый профиль + отсутствие телеметрии.**  
Точечные фиксы уже сняли главный freeze; чтобы не вспоминать — нужен лёгкий bootstrap API, запрет опасных boot-API в CI, автоверсия entry и алерты на fail rate входа.
