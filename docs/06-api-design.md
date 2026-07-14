# GUTSHOT Poker Club
## REST API Design

Версия: MVP 1.0

---

# Общие правила

## Base URL

/api/v1

---

## Формат обмена

JSON

---

## Авторизация

Игроки — JWT через Telegram.

Администраторы — JWT после входа по email и паролю.

JWT передается в заголовке:

Authorization: Bearer <token>

---

## Формат успешного ответа

```json
{
  "success": true,
  "data": {}
}
```

---

## Формат ошибки

```json
{
  "success": false,
  "message": "Описание ошибки"
}
```

---

# AUTH

## Авторизация через Telegram

POST /auth/telegram

Описание

Авторизация игрока через Telegram Mini App.

Body

```json
{
  "initData": "..."
}
```

Ответ

```json
{
  "accessToken": "...",
  "user": {}
}
```

---

## Вход администратора

POST /auth/admin/login

Body

```json
{
  "email": "admin@gutshot.club",
  "password": "********"
}
```

---

## Выход

POST /auth/logout

---

# PROFILE

## Получить профиль

GET /profile

Возвращает

- профиль
- XP
- уровень
- статистику

---

## История XP

GET /profile/history

---

## История турниров

GET /profile/tournaments

---

# TOURNAMENTS

## Получить список турниров

GET /tournaments

Query параметры

status

date

---

## Получить турнир

GET /tournaments/:id

---

## Ближайший турнир

GET /tournaments/nearest

---

# REGISTRATIONS

## Зарегистрироваться

POST /registrations

Body

```json
{
  "tournamentId": "..."
}
```

---

## Отменить регистрацию

DELETE /registrations/:id

---

## Активная регистрация

GET /registrations/current

---

## Получить QR

GET /registrations/current/qr

---

# RATINGS

## Общий рейтинг

GET /ratings

---

## Недельный рейтинг

GET /ratings/weekly

---

# NOTIFICATIONS

## Получить уведомления

GET /notifications

---

## Прочитать уведомление

PATCH /notifications/:id/read

---

# ADMIN AUTH

## Авторизация

POST /admin/auth/login

---

# ADMIN DASHBOARD

## Dashboard

GET /admin/dashboard

Возвращает

- игроков
- активные турниры
- регистрации
- статистику

---

# ADMIN TOURNAMENTS

## Получить список

GET /admin/tournaments

---

## Получить турнир

GET /admin/tournaments/:id

---

## Создать турнир

POST /admin/tournaments

---

## Обновить турнир

PATCH /admin/tournaments/:id

---

## Удалить турнир

DELETE /admin/tournaments/:id

---

## Открыть регистрацию

POST /admin/tournaments/:id/open

---

## Закрыть регистрацию

POST /admin/tournaments/:id/close

---

## Начать турнир

POST /admin/tournaments/:id/start

---

## Завершить турнир

POST /admin/tournaments/:id/finish

Body

```json
[
  {
    "registrationId": "...",
    "place": 1
  }
]
```

---

## Получить регистрации

GET /admin/tournaments/:id/registrations

---

# ADMIN PLAYERS

## Все игроки

GET /admin/players

---

## Игрок

GET /admin/players/:id

---

## Заблокировать

PATCH /admin/players/:id/block

---

## Разблокировать

PATCH /admin/players/:id/unblock

---

# ADMIN CHECK-IN

## Проверить QR

POST /admin/check-in

Body

```json
{
  "token": "..."
}
```

---

# ADMIN STATISTICS

GET /admin/statistics

---

# HTTP STATUS

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

500 Internal Server Error

---

# Валидация

Все входящие данные проходят ValidationPipe.

Все DTO валидируются через class-validator.

---

# Авторизация

Игрок имеет доступ только к своим данным.

Администратор имеет доступ согласно своей роли.

---

# Архитектура модулей

Backend разделен на независимые модули.

auth

profile

tournaments

registrations

ratings

notifications

admin

---

# Принципы API

- Один модуль — одна ответственность.
- Backend содержит всю бизнес-логику.
- Frontend никогда не выполняет вычисления.
- Все ответы имеют единый формат.
- Все ошибки имеют единый формат.
- Все изменения проходят через сервисы NestJS.
- Доступ к данным осуществляется только через Prisma ORM.
- API обратно совместимо в рамках версии v1.