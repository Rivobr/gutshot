import { getXpForPlace } from './xp.constants';
import {
  DEFAULT_LEVEL_THRESHOLDS,
  DEFAULT_PLACE_RATING,
  LEVEL_100_XP,
  MAX_SCORING_PLACE,
  requiredXpForLevel,
} from './xp-defaults.constants';

describe('getXpForPlace', () => {
  it('возвращает XP по шкале 600k для мест 1–30', () => {
    expect(getXpForPlace(1)).toBe(2000);
    expect(getXpForPlace(2)).toBe(1600);
    expect(getXpForPlace(3)).toBe(1300);
    expect(getXpForPlace(10)).toBe(650);
    expect(getXpForPlace(20)).toBe(325);
    expect(getXpForPlace(21)).toBe(250);
    expect(getXpForPlace(25)).toBe(250);
    expect(getXpForPlace(26)).toBe(200);
    expect(getXpForPlace(30)).toBe(200);
  });

  it('согласована с DEFAULT_PLACE_RATING для 1–30', () => {
    for (let place = 1; place <= MAX_SCORING_PLACE; place += 1) {
      expect(getXpForPlace(place)).toBe(DEFAULT_PLACE_RATING[place]);
    }
  });

  it('начисляет XP за места ниже 30 по диапазонам', () => {
    expect(getXpForPlace(31)).toBe(125);
    expect(getXpForPlace(40)).toBe(125);
    expect(getXpForPlace(41)).toBe(100);
    expect(getXpForPlace(50)).toBe(100);
    expect(getXpForPlace(51)).toBe(75);
    expect(getXpForPlace(99)).toBe(75);
    expect(getXpForPlace(0)).toBe(0);
  });

  it('топ-20 строго убывает', () => {
    for (let place = 2; place <= 20; place += 1) {
      expect(DEFAULT_PLACE_RATING[place]).toBeLessThan(DEFAULT_PLACE_RATING[place - 1]);
    }
  });
});

describe('таблица уровней 1–100 (600k)', () => {
  const byLevel = new Map(DEFAULT_LEVEL_THRESHOLDS.map((row) => [row.level, row.requiredXp]));

  it('содержит 100 уровней и стартует с нуля', () => {
    expect(DEFAULT_LEVEL_THRESHOLDS).toHaveLength(100);
    expect(byLevel.get(1)).toBe(0);
    expect(requiredXpForLevel(100)).toBe(LEVEL_100_XP);
  });

  it('совпадает с контрольными значениями модели 600k', () => {
    expect(byLevel.get(2)).toBe(Math.round(2328 + 37.68));
    expect(byLevel.get(10)).toBe(Math.round(2328 * 9 + 37.68 * 81));
    expect(byLevel.get(20)).toBe(Math.round(2328 * 19 + 37.68 * 361));
    expect(byLevel.get(50)).toBe(Math.round(2328 * 49 + 37.68 * 2401));
    expect(byLevel.get(75)).toBe(Math.round(2328 * 74 + 37.68 * 5476));
    expect(byLevel.get(100)).toBe(600_000);
  });

  it('пороги строго растут', () => {
    for (let level = 2; level <= 100; level += 1) {
      expect(byLevel.get(level)!).toBeGreaterThan(byLevel.get(level - 1)!);
    }
  });
});
