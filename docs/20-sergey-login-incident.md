# Инцидент: Сергей не заходит (2026-08-07)

## Что было

1. DNS `api`/`app` уже на `159.194.208.116` (серые облака), health OK.
2. У **Сергея Павлова** (`telegramId=454169961`) consent есть, блок нет.
3. Бот на `/start` не отвечал: на VPS `fetch failed` к `api.telegram.org` + старый webhook timeout.
4. SSH-пароль из `SSHPASS` **больше не подходит** — деплой/логи с VPS недоступны.

## Что сделано сразу

- Webhook сброшен и снова выставлен на `https://app.gutshotapp.ru/api/v1/telegram/webhook` (без last_error).
- Обоим Сергеям (`454169961`, `1323453420` / `@ingra_admin`) отправлены сообщения с кнопкой **Открыть клуб** + персональная menu button.
- В Redis (порт 6379 был открыт в интернет) найдены malware-ключи `backup1..4` (cron→`s.na-cs.com`) — **удалены**.
- В репо: bind Redis/Postgres/API на `127.0.0.1`, ретраи `sendMessage`, не светить bot-token в `photoUrl`, cache `v=20260807f` (коммит `b2cc436`).

## Нужно от владельца

1. Сказать Сергею: открыть сообщение бота → **Открыть клуб** (или `/start` → кнопка).
2. **Новый root SSH-пароль** на Beget (старый отвергается) — иначе не задеплоить harden и не проверить cron/malware на хосте.
3. Сменить пароль админки `owner@gutshot.club` (до сих пор seed `ChangeMe123!`).
4. В BotFather: **Revoke** токен бота (токен светился в `photoUrl` вида `api.telegram.org/file/bot…`) и прописать новый в `.env`.
5. Закрыть с хоста публикацию `5432`/`6379`/`3000` наружу (после SSH: `docker compose up -d`).
