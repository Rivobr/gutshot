# GUTSHOT Poker Club
## Frontend Architecture (Feature-Sliced Design)

Версия: MVP 1.0

---

# Общая информация

Frontend представляет собой Telegram Mini App.

Приложение построено на React с использованием архитектуры Feature-Sliced Design (FSD).

Frontend отвечает только за отображение данных и взаимодействие с пользователем.

Вся бизнес-логика находится на Backend.

---

# Технологии

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- TanStack Query
- Axios
- React Hook Form
- Zod
- Telegram WebApp SDK

---

# Архитектура проекта

src/

app/

shared/

entities/

features/

widgets/

pages/

processes/

---

# App

Точка входа приложения.

app/

providers/

router/

styles/

App.tsx

main.tsx

---

# Shared

Общие ресурсы приложения.

shared/

api/

assets/

config/

constants/

hooks/

lib/

types/

ui/

utils/

---

# Shared/UI

Переиспользуемые компоненты.

Button

Card

Avatar

Badge

Chip

BottomNavigation

Header

Modal

Loader

Skeleton

ProgressBar

QRCode

Toast

EmptyState

Dialog

Input

---

# Entities

Бизнес-сущности.

entities/

player/

tournament/

registration/

notification/

---

Каждая сущность содержит

model/

api/

ui/

types/

---

Пример

entities/player/

api/

model/

ui/

types/

---

# Features

Функциональные возможности.

features/

auth/

register/

cancel-registration/

check-in/

level-up/

view-profile/

view-rating/

notifications/

---

Каждая Feature содержит

api/

model/

ui/

hooks/

---

# Widgets

Крупные UI-блоки.

widgets/

Header/

BottomNavigation/

TournamentList/

TournamentCard/

ProfileCard/

RatingTable/

UpcomingTournament/

XPCard/

ProfileStats/

HistoryList/

QRCard/

---

# Pages

Каждая страница состоит из Widgets.

pages/

Home/

Tournament/

MyTournament/

Rating/

Profile/

NotFound/

---

# Processes

Глобальные процессы приложения.

processes/

startup/

authentication/

---

Startup отвечает за:

- запуск приложения;
- авторизацию;
- загрузку профиля;
- получение первоначальных данных.

---

# Router

Маршруты

/

Главная

/tournaments/:id

Турнир

/my-tournament

Мой турнир

/rating

Рейтинг

/profile

Профиль

---

# Layout

Главный Layout

Header

↓

Контент

↓

Bottom Navigation

Нижняя навигация всегда закреплена.

Она никогда не скрывается.

---

# Нижняя навигация

🏠 Главная

🏆 Турниры

🎫 Мой турнир

📈 Рейтинг

👤 Профиль

---

# API

Все запросы проходят через shared/api.

Используется Axios.

TanStack Query отвечает за кеширование.

---

# Авторизация

Telegram

↓

Получение InitData

↓

Backend

↓

JWT

↓

Загрузка профиля

↓

Главная страница

---

# Главная

Содержит

Приветствие

↓

Ближайший турнир

↓

Все турниры

↓

Информацию клуба

---

# Турнир

Карточка турнира

Описание

Дата

Стоимость

Количество игроков

Кнопка регистрации

---

# Мой турнир

Если регистрация существует

↓

QR

↓

Таймер

↓

Статус

↓

Информация

Если регистрации нет

↓

Красивый Empty State

---

# Профиль

Аватар

Имя

Уровень

XP

Прогресс

Статистика

История XP

История турниров

---

# Рейтинг

Общий рейтинг

↓

Недельный рейтинг

↓

Позиция игрока

---

# Анимации

Framer Motion используется для

- переходов между страницами;
- появления карточек;
- появления модальных окон;
- изменения XP;
- повышения уровня;
- открытия QR;
- появления списков;
- нажатий кнопок.

---

# Состояния

Каждая страница имеет

Loading

Success

Error

Empty

---

# Ошибки

Все ошибки отображаются через Toast.

Ошибки API отображаются пользователю понятным текстом.

---

# Empty States

Нет турниров.

Нет регистрации.

Нет истории.

Нет уведомлений.

Нет соединения.

---

# Производительность

Lazy Loading страниц.

Code Splitting.

Кэширование запросов.

Оптимизированные изображения.

Минимальное количество повторных рендеров.

---

# Архитектурные принципы

- Feature-Sliced Design.
- Максимально переиспользуемые компоненты.
- Минимум дублирования кода.
- Вся бизнес-логика на Backend.
- Один компонент — одна ответственность.
- Один Widget — одна задача.
- Все API-запросы централизованы.
- Каждый Feature независим.

---

# Цель

Создать современный Telegram Mini App уровня коммерческого продукта с чистой архитектурой, высокой производительностью и возможностью дальнейшего масштабирования без изменения структуры проекта.