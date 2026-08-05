# Xiaomi TV — отчёт об ошибках и план на завтра

Дата инцидента: **2026-08-05**  
Устройство: **Xiaomi MiTV-MZTU1**, браузер **YaBrowser Lite TV**  
Сеть: Wi‑Fi клуба (клиент `176.59.5.110` / МТС)

---

## 1. Что сломалось (симптомы)

| Симптом                                                       | Что видели                                    |
| ------------------------------------------------------------- | --------------------------------------------- |
| `ERR_CONNECTION_TIMED_OUT` на `http://159.194.208.116/`       | ТВ не достучался до IP VPS Beget              |
| `ERR_CONNECTION_CLOSED` / таймаут на доменах через Cloudflare | Нестабильный путь ТВ → Cloudflare             |
| Чёрный экран / «GUTSHOT — табло» без контента                 | HTML открылся, React/JS не выполнился         |
| «Загрузка табло…» бесконечно                                  | JS-бандл скачался или нет, API не вызывался   |
| trycloudflare «нихуя»                                         | HTML 200, **`board.js` даже не запрашивался** |

В логах nginx при успешных заходах ТВ был User-Agent:

`MiTV-MZTU1 … YaBrowser/25.10.1.638 (lite) TV`

---

## 2. Корневые причины (не один баг)

### A. Сеть клуба не ходит на IP Beget

- VPS: `159.194.208.116` (Beget, РФ)
- С сервера и извне сайт живой
- С Xiaomi на клубном Wi‑Fi: **timeout до IP**
- Значит: режет провайдер/роутер/маршрут, а не Docker/nginx
- Поэтому **серое облако (DNS only)** для `tv`/`admin` с ТВ **не работает** без VPN

### B. Cloudflare с ТВ нестабилен

- Оранжевое облако иногда пускало (логи 20:14–20:18), потом снова timeout
- Сейчас у `tv` есть **AAAA (IPv6)** через Cloudflare — на ТВ это частая причина `CONNECTION_TIMED_OUT`
- HTTP/3 (`alt-svc: h3`) на Xiaomi тоже вреден

### C. YaBrowser Lite на Xiaomi почти без JS

- ТВ скачивал HTML
- **Не запрашивал / не выполнял** `board.js` / React-бандл
- Вывод: для зала нужно **server-rendered HTML без JavaScript**

### D. Временные trycloudflare-ссылки

- Живут, пока крутится процесс `cloudflared tunnel --url …`
- После ребута/убийства процесса ссылка дохнет (сейчас quick-tunnel **не запущен**)

---

## 3. Что уже починено в коде/проде

1. **Табло без JS**: `GET /api/v1/public/tournaments/board.html`  
   HTML + `meta refresh` каждые 5 сек (блайнды/таймеры с сервера).
2. **TV nginx** (`:8082` и `/` на `tv.*`) отдаёт это HTML как главную страницу.
3. **Admin** умеет same-origin API (`/api/v1`) — логин не обязан ходить на `api.*` напрямую.
4. HTTP для `tv`/`admin` на origin **без редиректа на HTTPS** (для кривого TLS на ТВ).

Проверка с сервера сейчас: `http://tv.gutshotapp.ru/` → HTML с «Малый/Большой».

---

## 4. Решения на завтра (выбери одно основное)

### Решение 1 — Рекомендуемое (быстро, 10 минут)

Цель: стабильный `http://tv.gutshotapp.ru` на Xiaomi.

1. Cloudflare → **DNS** → `tv` = **оранжевое** облако (Proxied), A → `159.194.208.116`
2. Cloudflare → **Network**:
   - **IPv6 Compatibility = Off** (критично — убрать AAAA у `tv`)
   - **HTTP/3 (QUIC) = Off**
3. Cloudflare → **SSL/TLS** = **Full** (не Flexible, если origin слушает 443; для HTTP-only к origin можно Flexible)
4. Cloudflare → Caching → **Purge Everything**
5. На ТВ открыть **только**:
   ```text
   http://tv.gutshotapp.ru/
   ```
   (именно `http`, не `https`, не IP)
6. Добавить в закладки YaBrowser / на главный экран

Админка на ТВ **не нужна** — только табло. CRM открываете с телефона/ноута.

---

### Решение 2 — Надёжнее навсегда: Named Cloudflare Tunnel для TV

Уже есть `cloudflared` на VPS (`/etc/cloudflared/token`).

1. Cloudflare Zero Trust → Networks → Tunnels → ваш туннель
2. Public Hostname:
   - `tv.gutshotapp.ru` → `http://localhost:8082`
3. DNS для `tv` пусть ведёт в Tunnel (Cloudflare сам проставит)
4. На ТВ: `http://tv.gutshotapp.ru/`

Плюс: трафик VPS → Cloudflare **исходящий**, клубскому Wi‑Fi не нужно достучаться до Beget IP.

---

### Решение 3 — Локальный «ящик» в зале (самый железный)

Мини-ПК / Raspberry Pi / старый ноут в клубе:

1. В той же Wi‑Fi, что ТВ
2. Открывает табло локально: `http://192.168.x.x/` (статика/прокси)
3. API тянет через Cloudflare (`https://api.gutshotapp.ru` или same-origin через свой nginx)
4. ТВ открывает **локальный IP** — без Beget и без капризов CF с телевизора

Подходит, если провайдер клуба продолжит резать и CF, и Beget.

---

### Решение 4 — Запасной план вечера (если 1–2 не взлетели)

1. Раздать интернет с телефона (hotspot) на ТВ **или** VPN на ТВ
2. Открыть `http://tv.gutshotapp.ru/`
3. Либо кастинг/скрин с телефона/ноута, где сайт открывается

Не как основной режим, только «чтобы вечер не встал».

---

## 5. Чеклист «пришёл → открыл за 5 минут»

### До прихода в клуб (с ноута / телефона)

- [ ] `tv` в Cloudflare: **оранжевый**
- [ ] Network: **IPv6 Off**, **HTTP/3 Off**
- [ ] `dig tv.gutshotapp.ru A` → адреса Cloudflare (`104.*` / `172.67.*`), не обязательно Beget
- [ ] `dig tv.gutshotapp.ru AAAA` → **пусто** (после выключения IPv6)
- [ ] С телефона без VPN: `http://tv.gutshotapp.ru/` показывает блайнды (не белый timeout)
- [ ] Контейнеры на VPS: `docker ps` → `gutshot-tv`, `gutshot-api`, `gutshot-nginx` Up

### В зале у ТВ

- [ ] Wi‑Fi тот же, что у рабочего телефона
- [ ] Браузер: новая вкладка  
      `http://tv.gutshotapp.ru/`
- [ ] Видны **GUTSHOT + название турнира + большие блайнды**
- [ ] Подождать 5–10 сек — цифры таймера должны обновляться (meta refresh)
- [ ] В закладки ТВ

### Если снова timeout

1. С телефона в той же Wi‑Fi открыть `http://tv.gutshotapp.ru/`
   - если на телефоне тоже timeout → сеть/CF, не ТВ
   - если на телефоне ок, на ТВ нет → браузер ТВ/кэш: закрыть приложение браузера полностью, открыть снова
2. Временно hotspot с телефона на ТВ
3. Решение 2 (Tunnel) или 3 (локальный ящик)

### Admin CRM

- [ ] `http://admin.gutshotapp.ru` (оранжевый DNS) или с телефона/ноута `https://admin.gutshotapp.ru`
- [ ] `tvadmin` / `tvadmin`
- [ ] Ссылка «Открыть TV» должна вести на `http://tv.gutshotapp.ru/?tournament=…`

---

## 6. Чего НЕ делать

- Не открывать на ТВ `http://159.194.208.116/…` — до Beget IP клубный Wi‑Fi не ходит
- Не оставлять `tv` серым облаком «для скорости» — с этой сети серое = timeout
- Не рассчитывать на React/SPA на Xiaomi YaBrowser Lite
- Не использовать одноразовые `*.trycloudflare.com` как постоянный адрес зала

---

## 7. Технические якоря

| Что            | Значение                                         |
| -------------- | ------------------------------------------------ |
| VPS            | `159.194.208.116`                                |
| TV контейнер   | `gutshot-tv` → host `:8082`                      |
| HTML board API | `/api/v1/public/tournaments/board.html`          |
| Admin          | `:8081`, логин `tvadmin` / `tvadmin`             |
| Ветка          | `cursor/club-content-prod`                       |
| Код HTML board | `apps/api/src/modules/tournaments/board-html.ts` |
| TV nginx       | `apps/tv/nginx.conf`                             |

---

## 8. Рекомендация «что сделать завтра утром»

1. **Сначала Решение 1** (IPv6 Off + HTTP/3 Off + оранжевый `tv` + `http://tv.gutshotapp.ru/`).
2. Если за 15 минут снова timeout с клубного Wi‑Fi — **Решение 2 (Tunnel)**.
3. Если клубный провайдер совсем плохой — заказать/принести мини-ПК (**Решение 3**) как постоянный экран зала.
