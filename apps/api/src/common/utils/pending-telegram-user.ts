import type { PrismaClient, User } from '@prisma/client';

export const PENDING_TELEGRAM_PREFIX = 'tmp:';

/** Числовой Telegram user/chat id (не временный tmp: placeholder). */
export function isRealTelegramId(telegramId?: string | null): boolean {
  return Boolean(telegramId && /^-?\d{5,20}$/.test(telegramId));
}

export function isPendingTelegramId(telegramId?: string | null): boolean {
  return Boolean(telegramId && telegramId.startsWith(PENDING_TELEGRAM_PREFIX));
}

/** Публичный @username Telegram: 5–32 символа, латиница/цифры/_. */
export function isTelegramUsername(username: string): boolean {
  return /^[A-Za-z][A-Za-z0-9_]{4,31}$/.test(username);
}

export function pendingTelegramIdForUsername(username: string): string {
  return `${PENDING_TELEGRAM_PREFIX}${normalizeTelegramUsername(username)}`;
}

export function normalizeTelegramUsername(username: string): string {
  return username.trim().replace(/^@+/, '').toLowerCase();
}

type PrismaLike = Pick<PrismaClient, 'user'>;

/**
 * Если админ завёл игрока по @username до /start, привязываем настоящий telegramId.
 */
export async function claimPendingTelegramUser(
  prisma: PrismaLike,
  input: {
    telegramId: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  },
): Promise<User | null> {
  const telegramId = String(input.telegramId);
  if (!isRealTelegramId(telegramId) || !input.username) {
    return null;
  }

  const username = normalizeTelegramUsername(input.username);
  if (!username) {
    return null;
  }

  const pending = await prisma.user.findFirst({
    where: {
      username: { equals: username, mode: 'insensitive' },
      telegramId: { startsWith: PENDING_TELEGRAM_PREFIX },
    },
  });
  if (!pending) {
    return null;
  }

  const taken = await prisma.user.findUnique({ where: { telegramId } });
  if (taken && taken.id !== pending.id) {
    return taken;
  }

  return prisma.user.update({
    where: { id: pending.id },
    data: {
      telegramId,
      username: input.username.trim().replace(/^@+/, '') || pending.username,
      firstName: input.firstName || pending.firstName,
      lastName: input.lastName || pending.lastName,
    },
  });
}
