import { getXpForPlace } from './xp.constants';
import {
  DEFAULT_LEVEL_THRESHOLDS,
  DEFAULT_PLACE_RATING,
  MAX_SCORING_PLACE,
  requiredXpForLevel,
} from './xp-defaults.constants';

describe('getXpForPlace', () => {
  it('возвращает XP по новой шкале для мест 1–30', () => {
    expect(getXpForPlace(1)).toBe(3500);
    expect(getXpForPlace(2)).toBe(2800);
    expect(getXpForPlace(3)).toBe(2300);
    expect(getXpForPlace(10)).toBe(1100);
    expect(getXpForPlace(20)).toBe(500);
    expect(getXpForPlace(21)).toBe(400);
    expect(getXpForPlace(25)).toBe(400);
    expect(getXpForPlace(26)).toBe(300);
    expect(getXpForPlace(30)).toBe(300);
  });

  it('согласована с DEFAULT_PLACE_RATING для 1–30', () => {
    for (let place = 1; place <= MAX_SCORING_PLACE; place += 1) {
      expect(getXpForPlace(place)).toBe(DEFAULT_PLACE_RATING[place]);
    }
  });

  it('начисляет XP за места ниже 30 по диапазонам', () => {
    expect(getXpForPlace(31)).toBe(200);
    expect(getXpForPlace(40)).toBe(200);
    expect(getXpForPlace(41)).toBe(150);
    expect(getXpForPlace(50)).toBe(150);
    expect(getXpForPlace(51)).toBe(100);
    expect(getXpForPlace(99)).toBe(100);
    expect(getXpForPlace(0)).toBe(0);
  });

  it('топ-20 строго убывает', () => {
    for (let place = 2; place <= 20; place += 1) {
      expect(DEFAULT_PLACE_RATING[place]).toBeLessThan(DEFAULT_PLACE_RATING[place - 1]);
    }
  });
});

describe('таблица уровней 1–100 (250k)', () => {
  const byLevel = new Map(DEFAULT_LEVEL_THRESHOLDS.map((row) => [row.level, row.requiredXp]));

  it('содержит 100 уровней и стартует с нуля', () => {
    expect(DEFAULT_LEVEL_THRESHOLDS).toHaveLength(100);
    expect(byLevel.get(1)).toBe(0);
    expect(requiredXpForLevel(100)).toBe(250_000);
  });

  it('совпадает с контрольными значениями модели Сергея', () => {
    expect(byLevel.get(2)).toBe(Math.round(970 + 15.7));
    expect(byLevel.get(10)).toBe(Math.round(970 * 9 + 15.7 * 81));
    expect(byLevel.get(20)).toBe(Math.round(970 * 19 + 15.7 * 361));
    expect(byLevel.get(50)).toBe(Math.round(970 * 49 + 15.7 * 2401));
    expect(byLevel.get(75)).toBe(Math.round(970 * 74 + 15.7 * 5476));
    expect(byLevel.get(100)).toBe(250_000);
  });

  it('пороги строго растут', () => {
    for (let level = 2; level <= 100; level += 1) {
      expect(byLevel.get(level)!).toBeGreaterThan(byLevel.get(level - 1)!);
    }
  });
});
