import {
  claimPendingTelegramUser,
  isPendingTelegramId,
  isRealTelegramId,
  isTelegramUsername,
  normalizeTelegramUsername,
  pendingTelegramIdForUsername,
} from './pending-telegram-user';

describe('pending telegram user', () => {
  it('normalizes @username', () => {
    expect(normalizeTelegramUsername('@PLUSSEVENELEVEN')).toBe('plusseveneleven');
    expect(pendingTelegramIdForUsername('@PLUSSEVENELEVEN')).toBe('tmp:plusseveneleven');
  });

  it('detects placeholder and real ids', () => {
    expect(isPendingTelegramId('tmp:plusseveneleven')).toBe(true);
    expect(isPendingTelegramId('767678037')).toBe(false);
    expect(isRealTelegramId('767678037')).toBe(true);
    expect(isRealTelegramId('tmp:plusseveneleyen')).toBe(false);
  });

  it('accepts public telegram usernames', () => {
    expect(isTelegramUsername('PLUSSEVENELEVEN')).toBe(true);
    expect(isTelegramUsername('ab')).toBe(false);
    expect(isTelegramUsername('игрок')).toBe(false);
  });

  it('claims a pending user when the real telegramId is free', async () => {
    const pending = {
      id: 'u1',
      telegramId: 'tmp:plusseveneleven',
      username: 'PLUSSEVENELEVEN',
      firstName: null,
      lastName: null,
    };
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(pending),
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ ...pending, ...data }),
        ),
      },
    };

    const claimed = await claimPendingTelegramUser(prisma as never, {
      telegramId: '123456789',
      username: 'PLUSSEVENELEVEN',
      firstName: 'Seven',
    });

    expect(claimed?.telegramId).toBe('123456789');
    expect(claimed?.firstName).toBe('Seven');
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('does not steal a telegramId already used by another user', async () => {
    const pending = { id: 'pending', telegramId: 'tmp:foo', username: 'foo' };
    const taken = { id: 'other', telegramId: '123456789', username: 'bar' };
    const prisma = {
      user: {
        findFirst: jest.fn().mockResolvedValue(pending),
        findUnique: jest.fn().mockResolvedValue(taken),
        update: jest.fn(),
      },
    };

    const result = await claimPendingTelegramUser(prisma as never, {
      telegramId: '123456789',
      username: 'foo',
    });

    expect(result).toEqual(taken);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
