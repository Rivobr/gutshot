import { normalizeAdminLogin, normalizeAdminPassword } from './admin-login.util';

describe('normalizeAdminLogin', () => {
  it('maps latin and cyrillic spellings to stored logins', () => {
    expect(normalizeAdminLogin('Sergei')).toBe('Sergei');
    expect(normalizeAdminLogin(' sergey ')).toBe('Sergei');
    expect(normalizeAdminLogin('Сергей')).toBe('Sergei');
    expect(normalizeAdminLogin('тима')).toBe('Tima');
    expect(normalizeAdminLogin('Tima@gutshot.club')).toBe('Tima');
    expect(normalizeAdminLogin('Миша')).toBe('Misha');
  });

  it('keeps unknown latin logins lowercased for case-insensitive lookup', () => {
    expect(normalizeAdminLogin('  Owner  ')).toBe('owner');
  });
});

describe('normalizeAdminPassword', () => {
  it('trims spaces and invisible characters from phone input', () => {
    expect(normalizeAdminPassword('  secret  ')).toBe('secret');
    expect(normalizeAdminPassword('\u00A0secret\u200B')).toBe('secret');
  });
});
