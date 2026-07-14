# GUTSHOT Poker Club
## Backend Architecture

Версия: MVP 1.0

---

# Общая информация

Backend построен на NestJS и является центральной частью системы.

Все бизнес-правила выполняются только на сервере.

Frontend (Mini App) и Admin Panel работают исключительно через REST API.

Архитектура должна быть модульной, легко масштабируемой и соответствовать принципам Clean Architecture и SOLID.

---

# Технологический стек

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- JWT
- Passport
- class-validator
- class-transformer
- Docker

---

# Структура проекта

src/

main.ts

app.module.ts

config/

common/

prisma/

modules/

---

# Config

config/

app.config.ts

database.config.ts

jwt.config.ts

redis.config.ts

telegram.config.ts

environment.ts

---

# Common

Общие компоненты проекта.

common/

constants/

decorators/

dto/

enums/

exceptions/

filters/

guards/

interceptors/

interfaces/

pipes/

types/

utils/

---

# Prisma

prisma/

prisma.module.ts

prisma.service.ts

---

# Modules

Проект разделен по бизнес-доменам.

modules/

auth/

player/

tournament/

admin/

telegram/

---

# Auth

Отвечает за авторизацию.

modules/auth/

auth.module.ts

auth.controller.ts

auth.service.ts

strategies/

guards/

dto/

---

Функции

- Telegram Login
- Admin Login
- JWT
- Guards

---

# Player

Все, что связано с игроком.

modules/player/

profile/

rating/

notification/

---

## Profile

profile.controller.ts

profile.service.ts

---

Отвечает за

- профиль
- XP
- уровень
- историю
- статистику

---

## Rating

rating.controller.ts

rating.service.ts

---

Отвечает за

- общий рейтинг

- недельный рейтинг

---

## Notification

notification.controller.ts

notification.service.ts

---

Отвечает за

- уведомления
- историю Telegram сообщений

---

# Tournament

Все, что связано с турнирами.

modules/tournament/

tournaments/

registrations/

qr/

---

## Tournaments

tournaments.controller.ts

tournaments.service.ts

---

Отвечает за

- список турниров
- карточку турнира

---

## Registrations

registrations.controller.ts

registrations.service.ts

---

Главный модуль проекта.

Отвечает за

- регистрацию
- отмену
- лист ожидания
- Check-In
- завершение турнира

---

## QR

qr.controller.ts

qr.service.ts

---

Отвечает за

- генерацию QR
- обновление QR
- проверку QR

---

# Telegram

modules/telegram/

telegram.module.ts

telegram.service.ts

---

Отвечает за

- отправку сообщений
- шаблоны сообщений
- работу с Bot API

---

# Admin

modules/admin/

auth/

dashboard/

players/

tournaments/

statistics/

---

## Dashboard

Главная страница CRM.

---

## Players

Управление игроками.

---

## Tournaments

Управление турнирами.

---

## Statistics

Статистика клуба.

---

# DTO

Каждый запрос имеет собственный DTO.

DTO располагаются внутри соответствующего модуля.

Пример

modules/player/profile/dto/

get-profile.dto.ts

update-profile.dto.ts

---

# Services

Вся бизнес-логика находится только в сервисах.

Контроллеры не содержат логики.

Контроллер:

- принимает запрос;
- вызывает сервис;
- возвращает ответ.

---

# Controllers

Контроллер отвечает только за HTTP.

Запрещается:

- писать SQL;
- использовать Prisma;
- выполнять вычисления;
- изменять бизнес-логику.

---

# Prisma

Все обращения к базе происходят только через PrismaService.

Использование SQL запрещено.

---

# Transactions

Следующие операции выполняются только внутри транзакции:

- регистрация;
- отмена регистрации;
- Check-In;
- завершение турнира;
- начисление XP.

---

# Guards

Используются:

JwtAuthGuard

AdminAuthGuard

TelegramAuthGuard

RolesGuard

---

# Pipes

Глобально используется

ValidationPipe

---

# Filters

Глобально используется

HttpExceptionFilter

---

# Interceptors

LoggingInterceptor

TransformInterceptor

TimeoutInterceptor

---

# Redis

Используется для

- хранения QR;
- кэширования;
- ограничения запросов;
- временных данных.

---

# Логирование

Логируются:

- ошибки;
- вход администратора;
- создание турниров;
- завершение турниров;
- Check-In.

---

# Безопасность

- JWT авторизация.
- bcrypt для паролей.
- HTTPS.
- Проверка Telegram Init Data.
- QR невозможно подобрать.
- Валидация всех входящих данных.

---

# Naming Convention

Папки

kebab-case

Файлы

kebab-case

Классы

PascalCase

Переменные

camelCase

Константы

UPPER_SNAKE_CASE

---

# Dependency Injection

Каждый сервис внедряется через DI NestJS.

Запрещается создавать экземпляры классов вручную.

---

# Принципы разработки

- Один модуль — одна ответственность.
- Один сервис — одна ответственность.
- Минимальная связанность модулей.
- Максимальная читаемость.
- Backend — единственный источник истины.
- Никакой бизнес-логики во Frontend.
- Все операции проходят через сервисы.
- Все обращения к БД проходят через Prisma.

---

# Архитектурная цель

Backend должен быть готов к дальнейшему развитию без изменения фундаментальной структуры.

Новые функции должны добавляться созданием новых модулей, а не изменением существующей архитектуры.