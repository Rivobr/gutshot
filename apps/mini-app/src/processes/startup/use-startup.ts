import { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { authApi } from '../../features/auth/api/auth.api';
import { getTelegramInitData, getTelegramWebApp } from '../../shared/lib/telegram';
import { tokenStorage } from '../../shared/lib/token-storage';

export type StartupStatus = 'loading' | 'ready' | 'error';

/** Telegram иногда отдаёт initData не в первый тик после открытия WebApp. */
async function waitForInitData(timeoutMs = 4000): Promise<string> {
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

    const start = async (): Promise<void> => {
      const webApp = getTelegramWebApp();
      webApp?.ready();
      webApp?.expand();

      const existingToken = tokenStorage.get();
      if (existingToken) {
        if (!cancelled) {
          setStatus('ready');
        }
        return;
      }

      const initData = await waitForInitData();

      if (cancelled) {
        return;
      }

      if (!initData) {
        setErrorMessage('Приложение должно быть открыто через кнопку в Telegram-боте');
        setStatus('error');
        return;
      }

      try {
        const response = await authApi.loginWithTelegram(initData);
        if (cancelled) {
          return;
        }

        tokenStorage.set(response.accessToken);
        setStatus('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }

        setErrorMessage(extractAuthError(error));
        setStatus('error');
      }
    };

    void start();

    return () => {
      cancelled = true;
    };
  }, []);

  return { status, errorMessage };
}
