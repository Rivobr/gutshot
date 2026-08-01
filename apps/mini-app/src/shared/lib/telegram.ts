interface TelegramWebApp {
  initData: string;
  version?: string;
  ready: () => void;
  expand: () => void;
  colorScheme: 'light' | 'dark';
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  isFullscreen?: boolean;
  isVersionAtLeast?: (version: string) => boolean;
  disableVerticalSwipes?: () => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

const APP_BG = '#090909';

export function getTelegramWebApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
}

export function getTelegramInitData(): string {
  return getTelegramWebApp()?.initData ?? '';
}

/** Тёмная шапка и максимум экрана — убирает «белую полосу» Telegram. */
export function configureTelegramChrome(): void {
  const webApp = getTelegramWebApp();
  if (!webApp) {
    return;
  }

  webApp.ready();
  webApp.expand();

  try {
    webApp.setHeaderColor?.(APP_BG);
    webApp.setBackgroundColor?.(APP_BG);
    webApp.setBottomBarColor?.(APP_BG);
  } catch {
    // Старые клиенты могут не принимать произвольный hex.
  }

  try {
    webApp.disableVerticalSwipes?.();
  } catch {
    // optional
  }

  const canFullscreen =
    typeof webApp.requestFullscreen === 'function' &&
    (webApp.isVersionAtLeast?.('8.0') ?? true);

  if (canFullscreen && !webApp.isFullscreen) {
    try {
      webApp.requestFullscreen();
    } catch {
      // Пользователь/клиент может отклонить fullscreen — остаётся тёмная шапка.
    }
  }
}
