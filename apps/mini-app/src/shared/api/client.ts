import { createApiClient } from '@gutshot/shared';
import { env } from '../config/env';
import { tokenStorage } from '../lib/token-storage';

const REAUTH_FLAG = 'gutshot_reauth_once';

export const apiClient = createApiClient({
  baseURL: env.apiUrl,
  getToken: () => tokenStorage.get(),
  onUnauthorized: () => {
    const hadToken = Boolean(tokenStorage.get());
    tokenStorage.clear();

    if (!hadToken) {
      return;
    }

    // Один reload за сессию. Флаг НЕ снимаем при логине — только после
    // успешной загрузки профиля, иначе login→401→reload крутится вечно.
    try {
      if (sessionStorage.getItem(REAUTH_FLAG)) {
        return;
      }
      sessionStorage.setItem(REAUTH_FLAG, '1');
    } catch {
      // ignore
    }

    window.location.reload();
  },
});

export function clearReauthFlag(): void {
  try {
    sessionStorage.removeItem(REAUTH_FLAG);
  } catch {
    // ignore
  }
}
