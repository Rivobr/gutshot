import { getXpForPlace } from './xp.constants';
import {
  DEFAULT_LEVEL_THRESHOLDS,
  DEFAULT_PLACE_RATING,
  MAX_SCORING_PLACE,
} from './xp-defaults.constants';

describe('getXpForPlace', () => {
  it('возвращает XP по шкале ТЗ для мест 1–30', () => {
    expect(getXpForPlace(1)).toBe(5000);
    expect(getXpForPlace(2)).toBe(3800);
    expect(getXpForPlace(10)).toBe(1200);
    expect(getXpForPlace(20)).toBe(500);
    expect(getXpForPlace(30)).toBe(125);
  });

  it('согласована с DEFAULT_PLACE_RATING', () => {
    for (let place = 1; place <= MAX_SCORING_PLACE; place += 1) {
      expect(getXpForPlace(place)).toBe(DEFAULT_PLACE_RATING[place]);
    }
  });

  it('ниже 30 места XP за место не начисляется', () => {
    expect(getXpForPlace(31)).toBe(0);
    expect(getXpForPlace(0)).toBe(0);
  });

  it('шкала строго убывает', () => {
    for (let place = 2; place <= MAX_SCORING_PLACE; place += 1) {
      expect(DEFAULT_PLACE_RATING[place]).toBeLessThan(DEFAULT_PLACE_RATING[place - 1]);
    }
  });
});

describe('таблица уровней 1–100', () => {
  const byLevel = new Map(DEFAULT_LEVEL_THRESHOLDS.map((row) => [row.level, row.requiredXp]));

  it('содержит 100 уровней и стартует с нуля', () => {
    expect(DEFAULT_LEVEL_THRESHOLDS).toHaveLength(100);
    expect(byLevel.get(1)).toBe(0);
  });

  it('совпадает с контрольными значениями ТЗ', () => {
    expect(byLevel.get(10)).toBe(4_410);
    expect(byLevel.get(20)).toBe(15_910);
    expect(byLevel.get(30)).toBe(35_610);
    expect(byLevel.get(40)).toBe(65_010);
    expect(byLevel.get(50)).toBe(104_410);
    expect(byLevel.get(60)).toBe(154_710);
    expect(byLevel.get(70)).toBe(217_010);
    expect(byLevel.get(75)).toBe(252_660);
    expect(byLevel.get(80)).toBe(291_510);
    expect(byLevel.get(90)).toBe(379_710);
    expect(byLevel.get(100)).toBe(481_910);
  });

  it('первый переход стоит 250 XP и пороги строго растут', () => {
    expect(byLevel.get(2)).toBe(250);

    for (let level = 2; level <= 100; level += 1) {
      expect(byLevel.get(level)!).toBeGreaterThan(byLevel.get(level - 1)!);
    }
  });
});
