import { createHmac } from 'crypto';
import { verifyTelegramInitData } from './telegram-init-data.util';

function buildInitData(botToken: string, user: Record<string, unknown>): string {
  const params = new URLSearchParams();
  params.set('user', JSON.stringify(user));
  params.set('auth_date', String(Math.floor(Date.now() / 1000)));

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  params.set('hash', hash);

  return params.toString();
}

describe('verifyTelegramInitData', () => {
  const botToken = 'test-bot-token';

  it('успешно проверяет корректную подпись', () => {
    const initData = buildInitData(botToken, { id: 12345, first_name: 'Тест' });
    const result = verifyTelegramInitData(initData, botToken);

    expect(result).not.toBeNull();
    expect(result?.user.id).toBe(12345);
  });

  it('отклоняет данные с неверной подписью', () => {
    const initData = buildInitData(botToken, { id: 1, first_name: 'X' });
    const tampered = initData.replace('X', 'Y');

    expect(verifyTelegramInitData(tampered, botToken)).toBeNull();
  });

  it('отклоняет данные без hash', () => {
    expect(verifyTelegramInitData('user=%7B%7D&auth_date=1', botToken)).toBeNull();
  });
});
