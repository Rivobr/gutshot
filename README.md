# GUTSHOT Poker Club

Коммерческая система для управления офлайн-покерным клубом GUTSHOT (Санкт-Петербург).

Состоит из:

- **Telegram Mini App** — приложение игрока;
- **Backend API** — NestJS-сервер, единственный источник бизнес-логики;
- **Admin Panel** — CRM-панель для сотрудников клуба.

Полная документация находится в [`docs/`](./docs).

---

## Стек технологий

**Backend**: NestJS, Prisma, PostgreSQL, Redis, JWT, Docker.

**Frontend (Mini App / Admin)**: React, TypeScript, Vite, Tailwind CSS, Framer Motion, TanStack Query, React Hook Form, Zod, Axios.

**Архитектура Frontend**: Feature-Sliced Design (FSD).

---

## Структура monorepo

```
apps/
  api/          — Backend (NestJS)
  mini-app/     — Telegram Mini App (React, FSD)
  admin/        — Admin Panel (React, FSD)

packages/
  shared/       — общие утилиты и API-клиент
  types/        — общие TypeScript-типы
  ui/           — общий UI-kit

config/         — общие конфигурации проекта
docker/         — инфраструктурные файлы (nginx, postgres)
docs/           — проектная документация (источник истины)
design/         — экспорт дизайна из Figma
```

---

## Запуск в разработке

Требуется [pnpm](https://pnpm.io) и Node.js ≥ 20.

```bash
pnpm install
cp .env.example .env

pnpm dev:api
pnpm dev:mini-app
pnpm dev:admin
```

## Запуск через Docker

```bash
docker compose up --build
```

---

## Источники истины

При противоречиях между источниками используется следующий приоритет:

1. Документация (`docs/`)
2. Backend API
3. Prisma Schema
4. Figma Design
5. Figma Export Code

---

## Статус разработки

Проект разрабатывается поэтапно согласно [`docs/10-development-roadmap.md`](./docs/10-development-roadmap.md).

Реализованы этапы Stage 1–15 (MVP): monorepo, Backend (Auth, Players, Tournaments, Registrations, QR/Check-In,
Results/XP, Rating, History/Notifications, Admin), Mini App и Admin Panel на React с TanStack Query и Framer Motion,
базовые тесты, продакшн-конфигурация (Nginx, Docker, backup).

Следующие шаги: `pnpm install`, настройка `.env`, `prisma migrate dev`, ручное сквозное тестирование и
пиксель-точная доработка экранов Mini App/Admin по экспорту Figma (`design/figma-export`).
