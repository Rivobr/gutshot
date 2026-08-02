import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { authApi } from '../../features/auth/api/auth.api';
import { configureTelegramChrome, getTelegramInitData } from '../../shared/lib/telegram';
import { tokenStorage } from '../../shared/lib/token-storage';

export type StartupStatus = 'loading' | 'ready' | 'error';

const INIT_WAIT_MS = 2_500;
const HARD_TIMEOUT_MS = 7_000;

/** Telegram иногда отдаёт initData не в первый тик после открытия WebApp. */
export async function waitForInitData(timeoutMs = INIT_WAIT_MS): Promise<string> {
  const startedAt = Date.now();
  let initData = getTelegramInitData();
  if (initData) {
    return initData;
  }

  while (Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 40));
    initData = getTelegramInitData();
    if (initData) {
      return initData;
    }
  }

  return getTelegramInitData();
}

function extractAuthError(error: unknown): string {
  if (isAxiosError(error)) {
    const payload = error.response?.data as { message?: string | string[] } | undefined;
    const message = payload?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
    if (Array.isArray(message) && message[0]) {
      return String(message[0]);
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

/** Логин по initData. Флаг reauth снимается только после успешного /profile. */
export async function loginWithTelegramInitData(initData: string): Promise<string> {
  const response = await authApi.loginWithTelegram(initData);
  tokenStorage.set(response.accessToken);
  return response.accessToken;
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

    const watchdog = window.setTimeout(() => {
      if (tokenStorage.get()) {
        finish('ready');
        return;
      }
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

      // Всегда предпочитаем свежий initData.
      const immediateInit = getTelegramInitData();
      if (immediateInit) {
        try {
          await loginWithTelegramInitData(immediateInit);
          if (!cancelled) {
            finish('ready');
          }
          return;
        } catch (error) {
          if (tokenStorage.get()) {
            if (!cancelled) {
              finish('ready');
            }
            return;
          }
          if (!cancelled) {
            finish('error', extractAuthError(error));
          }
          return;
        }
      }

      if (tokenStorage.get()) {
        finish('ready');
        void (async () => {
          try {
            const initData = await waitForInitData(2_000);
            if (initData) {
              await loginWithTelegramInitData(initData);
            }
          } catch {
            // оставляем текущий токен
          }
        })();
        return;
      }

      const initData = await waitForInitData();
      if (cancelled) {
        return;
      }

      if (initData) {
        try {
          await loginWithTelegramInitData(initData);
          if (!cancelled) {
            finish('ready');
          }
          return;
        } catch (error) {
          if (!cancelled) {
            finish('error', extractAuthError(error));
          }
          return;
        }
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
