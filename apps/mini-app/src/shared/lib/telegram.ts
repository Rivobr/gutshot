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
/**
 * Запас под кнопку «X Закрыть» Telegram.
 * На iPhone с чёлкой safe-area ~47–59px + сама кнопка ~44px.
 */
const CLOSE_BUTTON_RESERVE_PX = 52;
const TOP_PAD_MIN_PX = 96;

export function getTelegramWebApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
}

export function getTelegramInitData(): string {
  return getTelegramWebApp()?.initData ?? '';
}

function applyTopInset(webApp: TelegramWebApp): void {
  const safeTop = webApp.safeAreaInset?.top ?? 0;
  const contentTop = webApp.contentSafeAreaInset?.top ?? 0;

  // contentSafeAreaInset.top в fullscreen уже включает зону под «Закрыть».
  // Берём максимум из доступных метрик + жёсткий минимум.
  const fromContent = contentTop > 0 ? contentTop + 8 : 0;
  const fromSafe = safeTop + CLOSE_BUTTON_RESERVE_PX;
  const pad = Math.max(fromContent, fromSafe, TOP_PAD_MIN_PX);

  document.documentElement.style.setProperty('--app-top-pad', `${pad}px`);
}

/** Тёмная шапка, safe-area и expand. Fullscreen на boot НЕ вызываем:
 * на части Android Telegram WebView requestFullscreen() вешает страницу
 * (бесконечный splash / frozen UI). Expand достаточно для Mini App.
 */
export function configureTelegramChrome(): void {
  const webApp = getTelegramWebApp();
  if (!webApp) {
    document.documentElement.style.setProperty('--app-top-pad', `${TOP_PAD_MIN_PX}px`);
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

  // enableClosingConfirmation намеренно НЕ вызываем на boot —
  // на части iOS клиентов даёт лишние диалоги/задержки при входе.

  window.setTimeout(() => applyTopInset(webApp), 120);
  window.setTimeout(() => applyTopInset(webApp), 600);

  applyTopInset(webApp);
  webApp.onEvent?.('safeAreaChanged', () => applyTopInset(webApp));
  webApp.onEvent?.('contentSafeAreaChanged', () => applyTopInset(webApp));
  webApp.onEvent?.('fullscreenChanged', () => applyTopInset(webApp));
}
