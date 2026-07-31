import { customAlphabet } from 'nanoid';

const PLAYER_QR_PREFIX = 'GS';

const generateSuffix = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 16);

/**
 * Постоянный персональный код игрока. Генерируется один раз при создании
 * пользователя и никогда не пересоздается: изменение никнейма, аватара
 * или любых данных профиля на него не влияет.
 */
export function generatePlayerQrCode(): string {
  return `${PLAYER_QR_PREFIX}-${generateSuffix()}`;
}

/**
 * Приводит отсканированное значение к каноничному виду.
 * Допускает как сам код, так и устаревший формат `gutshot:player:<id>`.
 */
export function normalizePlayerQrCode(raw: string): string {
  return raw.trim().replace(/^gutshot:player:/i, '').toUpperCase();
}
