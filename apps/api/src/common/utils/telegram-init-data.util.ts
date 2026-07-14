import { createHash, createHmac } from 'crypto';

export interface TelegramInitDataUser {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
}

export interface ParsedTelegramInitData {
  user: TelegramInitDataUser;
  authDate: number;
}

/**
 * Проверяет подпись Telegram WebApp initData согласно
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string,
): ParsedTelegramInitData | null {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');

  if (!hash) {
    return null;
  }

  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (computedHash !== hash) {
    return null;
  }

  const userRaw = params.get('user');
  const authDate = params.get('auth_date');

  if (!userRaw || !authDate) {
    return null;
  }

  try {
    const user = JSON.parse(userRaw) as TelegramInitDataUser;
    return { user, authDate: parseInt(authDate, 10) };
  } catch {
    return null;
  }
}

export function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
