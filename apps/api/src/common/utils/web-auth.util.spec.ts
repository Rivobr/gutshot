import { createHash, createHmac } from 'crypto';
import { normalizeRussianPhone } from './phone.util';
import { verifyTelegramWidgetCallback } from './telegram-widget.util';

const BOT_TOKEN = '123456:TEST-TOKEN';

function signedFields(fields: Record<string, string>): Record<string, string> {
  const dataCheckString = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${fields[key]}`)
    .join('\n');
  const secret = createHash('sha256').update(BOT_TOKEN).digest();
  const hash = createHmac('sha256', secret).update(dataCheckString).digest('hex');
  return { ...fields, hash };
}

describe('normalizeRussianPhone', () => {
  it('приводит +7 формат', () => {
    expect(normalizeRussianPhone('+7 999 009-11-99')).toBe('+79990091199');
  });

  it('приводит 8-ку', () => {
    expect(normalizeRussianPhone('89990091199')).toBe('+79990091199');
  });

  it('склеивает 10 цифр', () => {
    expect(normalizeRussianPhone('999 009 11 99')).toBe('+79990091199');
  });

  it('отвергает мусор', () => {
    expect(normalizeRussianPhone('123')).toBeNull();
    expect(normalizeRussianPhone('')).toBeNull();
  });
});

describe('verifyTelegramWidgetCallback', () => {
  const base = {
    id: '777000',
    first_name: 'Mila',
    username: 'mila_ace',
    auth_date: String(Math.floor(Date.now() / 1000)),
  };

  it('принимает корректную подпись', () => {
    const user = verifyTelegramWidgetCallback(signedFields(base), BOT_TOKEN);
    expect(user).not.toBeNull();
    expect(user?.id).toBe('777000');
    expect(user?.username).toBe('mila_ace');
  });

  it('отвергает подделанный hash', () => {
    const fields = signedFields(base);
    const user = verifyTelegramWidgetCallback({ ...fields, hash: '0'.repeat(64) }, BOT_TOKEN);
    expect(user).toBeNull();
  });

  it('отвергает устаревший auth_date', () => {
    const stale = { ...base, auth_date: String(Math.floor(Date.now() / 1000) - 172800) };
    expect(verifyTelegramWidgetCallback(signedFields(stale), BOT_TOKEN)).toBeNull();
  });

  it('отвергает отсутствие id', () => {
    const withoutId = {
      first_name: base.first_name,
      username: base.username,
      auth_date: base.auth_date,
    };
    expect(verifyTelegramWidgetCallback(signedFields(withoutId), BOT_TOKEN)).toBeNull();
  });
});
