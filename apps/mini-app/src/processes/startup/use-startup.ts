import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { authApi } from '../../features/auth/api/auth.api';
import { configureTelegramChrome, getTelegramInitData } from '../../shared/lib/telegram';
import { tokenStorage } from '../../shared/lib/token-storage';

export type StartupStatus = 'loading' | 'ready' | 'error';

const INIT_WAIT_MS = 4_000;
/** Must exceed worst-case login retries (attempts × axios timeout). */
const HARD_TIMEOUT_MS = 90_000;
const LOGIN_ATTEMPTS = 4;

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

function isRetryableNetworkError(error: unknown): boolean {
  if (!isAxiosError(error)) {
    return false;
  }
  return !error.response || error.code === 'ECONNABORTED';
}

/** Логин по initData. Флаг reauth снимается только после успешного /profile. */
export async function loginWithTelegramInitData(initData: string): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= LOGIN_ATTEMPTS; attempt += 1) {
    try {
      const response = await authApi.loginWithTelegram(initData);
      tokenStorage.set(response.accessToken);
      return response.accessToken;
    } catch (error) {
      lastError = error;
      if (!isRetryableNetworkError(error) || attempt === LOGIN_ATTEMPTS) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
  throw lastError;
}

export function useStartup(): { status: StartupStatus; errorMessage?: string } {
  const [status, setStatus] = useState<StartupStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    let finished = false;
    let loginInFlight = false;

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
      // Не рвём UI, пока ещё идут попытки логина — иначе гонка с axios retry.
      if (loginInFlight) {
        return;
      }
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

      const runLogin = async (initData: string): Promise<void> => {
        loginInFlight = true;
        try {
          await loginWithTelegramInitData(initData);
          if (!cancelled) {
            finish('ready');
          }
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
        } finally {
          loginInFlight = false;
        }
      };

      const immediateInit = getTelegramInitData();
      if (immediateInit) {
        await runLogin(immediateInit);
        return;
      }

      if (tokenStorage.get()) {
        finish('ready');
        void (async () => {
          try {
            const initData = await waitForInitData(2_000);
            if (initData) {
              loginInFlight = true;
              try {
                await loginWithTelegramInitData(initData);
              } finally {
                loginInFlight = false;
              }
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
        await runLogin(initData);
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
