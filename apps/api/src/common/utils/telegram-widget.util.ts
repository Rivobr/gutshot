import { createHash, createHmac, timingSafeEqual } from 'crypto';

export interface TelegramWidgetUser {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  authDate?: number;
}

type WidgetFields = Record<string, string>;

/**
 * Проверка подписи Telegram Login Widget («Продолжить с Telegram» на сайте).
 * Алгоритм Bot API: secret = SHA256(bot_token), hash = HMAC_SHA256(secret, data_check_string),
 * где data_check_string — отсортированные пары key=value через \n, кроме самого hash.
 */
export function verifyTelegramWidgetCallback(
  fields: WidgetFields,
  botToken: string,
  maxAgeSeconds = 86400,
): TelegramWidgetUser | null {
  const receivedHash = fields.hash;
  if (!receivedHash) {
    return null;
  }

  const dataCheckString = Object.keys(fields)
    .filter((key) => key !== 'hash')
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('\n');

  const secretKey = createHash('sha256').update(botToken).digest();
  const computed = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const a = Buffer.from(computed, 'hex');
  const b = Buffer.from(receivedHash, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }

  const authDate = Number(fields.auth_date ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSeconds) {
    return null;
  }

  if (!fields.id) {
    return null;
  }

  return {
    id: fields.id,
    firstName: fields.first_name,
    lastName: fields.last_name,
    username: fields.username,
    photoUrl: fields.photo_url,
    authDate,
  };
}
