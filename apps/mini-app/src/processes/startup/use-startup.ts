import { useEffect, useState } from 'react';
import { authApi } from '../../features/auth/api/auth.api';
import { getTelegramInitData, getTelegramWebApp } from '../../shared/lib/telegram';
import { tokenStorage } from '../../shared/lib/token-storage';

export type StartupStatus = 'loading' | 'ready' | 'error';

export function useStartup(): { status: StartupStatus; errorMessage?: string } {
  const [status, setStatus] = useState<StartupStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    const webApp = getTelegramWebApp();
    webApp?.ready();
    webApp?.expand();

    const existingToken = tokenStorage.get();
    if (existingToken) {
      setStatus('ready');
      return;
    }

    const initData = getTelegramInitData();

    if (!initData) {
      setErrorMessage('Приложение должно быть открыто через Telegram');
      setStatus('error');
      return;
    }

    authApi
      .loginWithTelegram(initData)
      .then((response) => {
        tokenStorage.set(response.accessToken);
        setStatus('ready');
      })
      .catch(() => {
        setErrorMessage('Не удалось выполнить авторизацию');
        setStatus('error');
      });
  }, []);

  return { status, errorMessage };
}
