import { getXpForPlace } from './xp.constants';
import { DEFAULT_PLACE_RATING } from './xp-defaults.constants';

describe('getXpForPlace', () => {
  it('возвращает очки шкалы рейтинга для мест 1–20', () => {
    expect(getXpForPlace(1)).toBe(3600);
    expect(getXpForPlace(2)).toBe(2900);
    expect(getXpForPlace(10)).toBe(1475);
    expect(getXpForPlace(20)).toBe(300);
  });

  it('согласована с DEFAULT_PLACE_RATING', () => {
    for (let place = 1; place <= 20; place += 1) {
      expect(getXpForPlace(place)).toBe(DEFAULT_PLACE_RATING[place]);
    }
  });

  it('для мест вне таблицы возвращает 0', () => {
    expect(getXpForPlace(21)).toBe(0);
    expect(getXpForPlace(0)).toBe(0);
  });

  it('сумма полной таблицы равна 30 525', () => {
    const total = Object.values(DEFAULT_PLACE_RATING).reduce((sum, value) => sum + value, 0);
    expect(total).toBe(30_525);
  });
});
