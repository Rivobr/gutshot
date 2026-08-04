interface TelegramSafeArea {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

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
  enableClosingConfirmation?: () => void;
  platform?: string;
  safeAreaInset?: TelegramSafeArea;
  contentSafeAreaInset?: TelegramSafeArea;
  onEvent?: (eventType: string, callback: () => void) => void;
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

const APP_BG = '#090909';
/** Запас под кнопку «Закрыть» / Menu Telegram, когда нет content safe area. */
const TELEGRAM_HEADER_FALLBACK_PX = 52;

export function getTelegramWebApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
}

export function getTelegramInitData(): string {
  return getTelegramWebApp()?.initData ?? '';
}

function applyTopInset(webApp: TelegramWebApp): void {
  const safeTop = webApp.safeAreaInset?.top ?? 0;
  const contentTop = webApp.contentSafeAreaInset?.top ?? 0;
  const telegramChrome = contentTop > 0 ? contentTop : TELEGRAM_HEADER_FALLBACK_PX;
  const pad = Math.max(safeTop + telegramChrome, TELEGRAM_HEADER_FALLBACK_PX);
  document.documentElement.style.setProperty('--app-top-pad', `${pad}px`);
}

const FULLSCREEN_PLATFORMS = ['android', 'android_x', 'ios'];

/**
 * Полноэкранный режим появился в Bot API 8.0 и стабильно работает только
 * на мобильных клиентах: на desktop/web вызов молча ломает верстку шапки.
 */
function requestFullscreenIfSupported(webApp: TelegramWebApp): void {
  if (!webApp.requestFullscreen) return;
  if (webApp.isVersionAtLeast && !webApp.isVersionAtLeast('8.0')) return;
  if (!FULLSCREEN_PLATFORMS.includes(webApp.platform ?? '')) return;
  if (webApp.isFullscreen) return;

  try {
    webApp.requestFullscreen();
  } catch {
    // Клиент может отклонить запрос — остаёмся в expand().
  }
}

/** Тёмная шапка, safe-area и максимум экрана. */
export function configureTelegramChrome(): void {
  const webApp = getTelegramWebApp();
  if (!webApp) {
    document.documentElement.style.setProperty('--app-top-pad', `${TELEGRAM_HEADER_FALLBACK_PX}px`);
    return;
  }

  webApp.ready();
  webApp.expand();
  applyTopInset(webApp);

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

  try {
    webApp.enableClosingConfirmation?.();
  } catch {
    // optional
  }

  requestFullscreenIfSupported(webApp);

  applyTopInset(webApp);
  webApp.onEvent?.('safeAreaChanged', () => applyTopInset(webApp));
  webApp.onEvent?.('contentSafeAreaChanged', () => applyTopInset(webApp));
  webApp.onEvent?.('fullscreenChanged', () => applyTopInset(webApp));
}
