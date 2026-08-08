import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { authApi } from '../../features/auth/api/auth.api';
import { configureTelegramChrome, getTelegramInitData } from '../../shared/lib/telegram';
import { tokenStorage } from '../../shared/lib/token-storage';

export type StartupStatus = 'loading' | 'ready' | 'error';

const INIT_WAIT_MS = 2_500;
/** Жёсткий потолок splash — не крутим экран минутами. */
const HARD_TIMEOUT_MS = 12_000;
const LOGIN_ATTEMPTS = 2;

function readTicketFromUrl(): string {
  try {
    return new URLSearchParams(window.location.search).get('ticket') || '';
  } catch {
    return '';
  }
}

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

/** Логин по initData. Флаг reauth снимается после успешного bootstrap в App. */
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
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
  throw lastError;
}

export async function loginWithTicket(ticket: string): Promise<string> {
  const response = await authApi.loginWithTicket(ticket);
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

      const ticket = readTicketFromUrl();
      const fromEnter =
        typeof window !== 'undefined' &&
        /(?:^|[?&])from=(?:enter|boot)(?:&|$)/.test(window.location.search);
      const runReady = () => {
        if (!cancelled) {
          finish('ready');
        }
      };

      // FAST PATH: enter.html уже положил свежий JWT. Не блокируем splash повторным
      // логином и не дублируем его в фоне — сессия только что выдана сервером.
      if (tokenStorage.get() && (fromEnter || !getTelegramInitData())) {
        runReady();
        return;
      }

      // 1) Свежий initData
      const immediateInit = getTelegramInitData();
      if (immediateInit) {
        try {
          await loginWithTelegramInitData(immediateInit);
          runReady();
          return;
        } catch (error) {
          if (tokenStorage.get()) {
            runReady();
            return;
          }
          if (!ticket) {
            finish('error', extractAuthError(error));
            return;
          }
        }
      }

      // 2) Ticket из enter.html / кнопки бота
      if (ticket) {
        try {
          await loginWithTicket(ticket);
          runReady();
          return;
        } catch (error) {
          if (tokenStorage.get()) {
            runReady();
            return;
          }
          if (immediateInit) {
            finish('error', extractAuthError(error));
            return;
          }
        }
      }

      // 3) Уже есть токен
      if (tokenStorage.get()) {
        runReady();
        return;
      }

      // 4) Подождём initData ещё немного
      const initData = await waitForInitData();
      if (cancelled) {
        return;
      }

      if (initData) {
        try {
          await loginWithTelegramInitData(initData);
          runReady();
          return;
        } catch (error) {
          if (ticket) {
            try {
              await loginWithTicket(ticket);
              runReady();
              return;
            } catch {
              finish('error', extractAuthError(error));
              return;
            }
          }
          finish('error', extractAuthError(error));
          return;
        }
      }

      if (ticket) {
        try {
          await loginWithTicket(ticket);
          runReady();
          return;
        } catch (error) {
          finish('error', extractAuthError(error));
          return;
        }
      }

      finish('error', 'Приложение должно быть открыто через кнопку меню в Telegram-боте');
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
