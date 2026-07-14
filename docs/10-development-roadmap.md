# GUTSHOT Poker Club
## Development Roadmap

Проект разрабатывается строго поэтапно.

Никогда не писать весь проект сразу.

Каждый этап должен полностью завершаться, тестироваться и только после этого переходить к следующему.

---

# Stage 1

Project Initialization

Создать monorepo.

Структура:

apps/
    api/
    mini-app/
    admin/

packages/
    ui/
    shared/
    types/

Настроить:

NestJS

React

TypeScript

Prisma

Docker

ESLint

Prettier

Husky

---

# Stage 2

Backend foundation

Настроить

JWT

Telegram Auth

Prisma

Redis

Postgres

ConfigModule

Logger

Error Filter

Validation

Swagger

---

# Stage 3

Database

Подключить Prisma.

Создать миграции.

Создать seed.

Заполнить тестовыми данными.

---

# Stage 4

Authentication

Авторизация через Telegram Mini App.

Создание пользователя.

Обновление пользователя.

JWT.

---

# Stage 5

Players

CRUD игроков.

Профиль.

XP.

Уровни.

Статистика.

---

# Stage 6

Tournament

CRUD турниров.

Регистрация.

Отмена регистрации.

Получение списка турниров.

Получение деталей турнира.

---

# Stage 7

QR

Создание QR.

Проверка QR.

Истечение срока.

Сканирование.

Check-in.

---

# Stage 8

Results

Ввод результатов.

Начисление XP.

Пересчет рейтинга.

Обновление статистики.

---

# Stage 9

Rating

Общий рейтинг.

Недельный рейтинг.

ТОП игроков.

---

# Stage 10

History

История турниров.

История XP.

История действий.

---

# Stage 11

Mini App

Подключить экспорт Figma.

Не переписывать дизайн.

Использовать существующие компоненты.

Добавить:

Telegram SDK

API

React Query

Авторизацию

Все реальные данные.

---

# Stage 12

Admin Panel

Dashboard

Players

Tournaments

QR Scanner

Results

Statistics

Settings

---

# Stage 13

Animations

Framer Motion.

Skeleton.

Loading.

Transitions.

Bottom Navigation animation.

Cards animation.

XP animation.

Level animation.

---

# Stage 14

Testing

Backend

Frontend

E2E

---

# Stage 15

Production

Docker

Nginx

SSL

Deploy

Monitoring

Backup

Logging