# GUTSHOT Poker Club
## Database Design

Версия: MVP 1.0

---

# Основная идея

База данных строится вокруг сущности Registration.

Каждая Registration описывает полный жизненный цикл участия игрока в турнире.

---

# Основные модели

User

↓

PlayerProfile

↓

Registration

↓

Tournament

↓

QRToken

↓

XPHistory

↓

Notification

↓

AdminUser

---

# ER Diagram

User

│

├──────── PlayerProfile (1:1)

│

├──────── Registration (1:N)

│

├──────── XPHistory (1:N)

│

└──────── Notification (1:N)

Registration

│

├──────── Tournament (N:1)

│

└──────── QRToken (1:1)

---

# User

Хранит Telegram пользователя.

Основные данные:

- Telegram ID
- Username
- Имя
- Фамилия
- Фото

---

# PlayerProfile

Игровые данные игрока.

Содержит:

- XP

Уровень рассчитывается автоматически.

---

# Tournament

Информация о турнире.

Содержит:

- название;
- описание;
- дата;
- стоимость участия;
- максимальное количество игроков;
- статус.

---

# Registration

Главная сущность проекта.

Хранит:

- игрока;
- турнир;
- статус;
- место;
- полученный XP;
- время регистрации;
- время Check-In.

---

# QRToken

Используется только для Check-In.

Каждый QR:

- одноразовый;
- защищенный;
- имеет срок действия.

---

# XPHistory

История начисления XP.

Позволяет восстановить любую операцию начисления.

---

# Notification

История Telegram сообщений.

Позволяет отслеживать отправленные уведомления.

---

# AdminUser

Администраторы CRM.

Не связаны с Telegram.

Используют отдельную авторизацию.

---

# Связи

User

1 → 1

PlayerProfile

---

User

1 → N

Registration

---

Tournament

1 → N

Registration

---

Registration

1 → 1

QRToken

---

Registration

1 → N

XPHistory

---

User

1 → N

Notification

---

# Жизненный цикл Registration

REGISTERED

↓

CHECKED_IN

↓

PLAYING

↓

FINISHED

или

REGISTERED

↓

CANCELLED

или

WAITING

↓

REGISTERED

---

# Принципы проектирования

- Минимум дублирования данных.
- Максимум вычисляемых значений.
- XP является единственным источником истины.
- Registration — центральная сущность системы.
- Все связи реализуются через Prisma Relations.
- Используются UUID/CUID идентификаторы.
- Все даты хранятся в UTC.
- Все статусы реализуются через ENUM.

---

# Индексация

User

- telegramId

Tournament

- date
- status

Registration

- userId
- tournamentId
- status

QRToken

- token
- expiresAt

XPHistory

- userId
- createdAt

Notification

- userId
- sentAt

AdminUser

- email

---

# Основная цель

База данных должна быть простой, масштабируемой и полностью поддерживать бизнес-логику проекта без дублирования информации.