# GUTSHOT Poker Club
## First Development Task

Перед началом работы внимательно изучи ВСЕ документы в папке docs/.

Обязательно изучи:

01-project-architecture.md

02-database-design.md

03-prisma-models.md

04-user-flows.md

05-business-rules.md

06-api-design.md

07-backend-architecture.md

08-frontend-architecture.md

09-admin-panel-architecture.md

10-development-roadmap.md

11-folder-structure.md

12-cursor-master-prompt.md

После этого проанализируй экспорт Figma.

Путь:

design/figma-export/

Используй существующие React-компоненты и стили из экспорта. Не переписывай интерфейс с нуля.

Если компонент уже существует, адаптируй его под архитектуру проекта.

---

## Первый этап разработки

Создай структуру monorepo.

Не пиши бизнес-логику.

Не создавай API.

Не создавай страницы.

Только структура.

---

Необходимо создать:

apps/

api/

mini-app/

admin/

packages/

shared/

types/

ui/

config/

docker/

---

Настрой:

NestJS

React

TypeScript

Prisma

Docker

ESLint

Prettier

EditorConfig

Husky

lint-staged

GitIgnore

ENV

---

Backend

Создай модульную архитектуру.

Создай модули:

Auth

Users

Tournaments

Registrations

Rating

QR

History

Admin

Common

Config

Database

---

Frontend Mini App

Создай Feature-Sliced структуру.

app/

pages/

widgets/

features/

entities/

shared/

---

Admin

Создай такую же структуру.

---

Создай:

docker-compose.yml

Dockerfile для api

Dockerfile для mini-app

Dockerfile для admin

.env.example

README.md

---

После завершения выведи полный отчет:

Что было создано.

Какие файлы добавлены.

Какие зависимости установлены.

Что осталось сделать.

Не переходи к следующему этапу самостоятельно.