import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { authApi } from '../../features/auth/api/auth.api';
import { configureTelegramChrome, getTelegramInitData } from '../../shared/lib/telegram';
import { tokenStorage } from '../../shared/lib/token-storage';

export type StartupStatus = 'loading' | 'ready' | 'error';

const INIT_WAIT_MS = 5_000;
const HARD_TIMEOUT_MS = 12_000;

/** Telegram иногда отдаёт initData не в первый тик после открытия WebApp. */
async function waitForInitData(timeoutMs = INIT_WAIT_MS): Promise<string> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const initData = getTelegramInitData();
    if (initData) {
      return initData;
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return getTelegramInitData();
}

function extractAuthError(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (error.code === 'ECONNABORTED') {
      return 'Сервер не отвечает. Проверьте соединение и попробуйте снова.';
    }

    if (!error.response) {
      return 'Нет связи с сервером. Попробуйте открыть приложение ещё раз.';
    }
  }

  return 'Не удалось выполнить авторизацию';
}

export function useStartup(): { status: StartupStatus; errorMessage?: string } {
  const [status, setStatus] = useState<StartupStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    let finished = false;

    const finish = (next: StartupStatus, message?: string) => {
      if (cancelled || finished) {
        return;
      }
      finished = true;
      if (message) {
        setErrorMessage(message);
      }
      setStatus(next);
    };

    // Жёсткий таймаут — экран загрузки не должен висеть вечно (часто у 1 клиента).
    const watchdog = window.setTimeout(() => {
      finish(
        'error',
        'Загрузка занимает слишком много времени. Закройте мини-приложение и откройте снова через кнопку бота.',
      );
    }, HARD_TIMEOUT_MS);

    const start = async (): Promise<void> => {
      try {
        configureTelegramChrome();
      } catch {
        // chrome API не должен ломать вход
      }

      // Всегда пробуем свежий initData — старый JWT у одного пользователя
      // иначе оставляет «вечную» загрузку профиля.
      const initData = await waitForInitData();

      if (cancelled) {
        return;
      }

      if (initData) {
        try {
          const response = await authApi.loginWithTelegram(initData);
          if (cancelled) {
            return;
          }
          tokenStorage.set(response.accessToken);
          finish('ready');
          return;
        } catch (error) {
          if (cancelled) {
            return;
          }
          // Если логин не прошёл, но есть старый токен — попробуем с ним.
          if (!tokenStorage.get()) {
            finish('error', extractAuthError(error));
            return;
          }
        }
      }

      if (tokenStorage.get()) {
        finish('ready');
        return;
      }

      finish(
        'error',
        'Приложение должно быть открыто через кнопку меню в Telegram-боте',
      );
    };

    void start().finally(() => {
      window.clearTimeout(watchdog);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(watchdog);
    };
  }, []);

  return { status, errorMessage };
}
