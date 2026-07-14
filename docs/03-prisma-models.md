# GUTSHOT Poker Club
## Prisma Models Specification

> Версия: MVP 1.0

---

# Общие правила

## ID

Во всех моделях используется

```prisma
id String @id @default(cuid())
```

---

## Даты

Во всех моделях присутствуют поля

```prisma
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

---

# ENUM

## TournamentStatus

- DRAFT
- REGISTRATION_OPEN
- REGISTRATION_CLOSED
- IN_PROGRESS
- FINISHED
- ARCHIVED

---

## RegistrationStatus

- REGISTERED
- CHECKED_IN
- PLAYING
- FINISHED
- CANCELLED
- NO_SHOW
- WAITING

---

## XPReason

- TOURNAMENT_PARTICIPATION
- TOURNAMENT_PLACE
- TOURNAMENT_WIN
- BONUS
- PENALTY
- MANUAL

---

## NotificationType

- REGISTRATION
- REMINDER
- TOURNAMENT_START
- TOURNAMENT_RESULT
- SYSTEM

---

## AdminRole

- OWNER
- ADMIN
- MANAGER

---

# User

Telegram пользователь.

## Fields

- id
- telegramId
- username
- firstName
- lastName
- photoUrl
- isBlocked
- createdAt
- updatedAt

## Constraints

telegramId UNIQUE

## Relations

PlayerProfile (1:1)

Registration (1:N)

TournamentResult (1:N)

XPHistory (1:N)

Notification (1:N)

---

# PlayerProfile

Игровой профиль.

## Fields

- id
- userId
- xp
- createdAt
- updatedAt

## Relations

User (1:1)

---

# Tournament

## Fields

- id
- title
- description
- date
- buyIn
- maxPlayers
- status
- registrationOpen
- registrationClose
- createdAt
- updatedAt

## Relations

Registration (1:N)

TournamentResult (1:N)

---

# Registration

Связующая модель между игроком и турниром.

## Fields

- id
- userId
- tournamentId
- status
- registeredAt
- checkedInAt
- cancelledAt
- createdAt
- updatedAt

## Constraints

(userId, tournamentId) UNIQUE

## Relations

User (N:1)

Tournament (N:1)

QRToken (1:1)

---

# QRToken

## Fields

- id
- registrationId
- token
- expiresAt
- usedAt
- createdAt

## Constraints

token UNIQUE

registrationId UNIQUE

## Relations

Registration (1:1)

---

# TournamentResult

## Fields

- id
- tournamentId
- userId
- place
- xpEarned
- createdAt

## Constraints

(userId, tournamentId) UNIQUE

## Relations

User (N:1)

Tournament (N:1)

XPHistory (1:N)

---

# XPHistory

История начислений XP.

## Fields

- id
- userId
- tournamentResultId
- reason
- amount
- createdAt

## Relations

User (N:1)

TournamentResult (N:1)

---

# Notification

История Telegram уведомлений.

## Fields

- id
- userId
- type
- title
- message
- isRead
- sentAt
- createdAt

## Relations

User (N:1)

---

# AdminUser

Администраторы панели управления.

## Fields

- id
- email
- passwordHash
- name
- role
- lastLogin
- createdAt
- updatedAt

## Constraints

email UNIQUE

---

# Индексы

## User

- telegramId

---

## Tournament

- date
- status

---

## Registration

- tournamentId
- status

---

## TournamentResult

- tournamentId
- place

---

## XPHistory

- userId
- createdAt

---

## QRToken

- token
- expiresAt

---

# ER Relationships

User (1:1) PlayerProfile

User (1:N) Registration

Tournament (1:N) Registration

Registration (1:1) QRToken

User (1:N) TournamentResult

Tournament (1:N) TournamentResult

TournamentResult (1:N) XPHistory

User (1:N) XPHistory

User (1:N) Notification

---

# Принципы

- Вся бизнес-логика находится в Backend.
- XP является единственным источником истины.
- Статистика рассчитывается автоматически.
- Уровень игрока вычисляется по количеству XP.
- Telegram является единственным способом авторизации игроков.
- Администраторы используют отдельную авторизацию по email и паролю.