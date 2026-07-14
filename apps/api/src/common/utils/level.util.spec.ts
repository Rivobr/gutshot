import { calculateLevel, calculateLevelProgress, xpForLevel } from './level.util';

describe('level.util', () => {
  it('возвращает уровень 1 для нулевого и отрицательного XP', () => {
    expect(calculateLevel(0)).toBe(1);
    expect(calculateLevel(-100)).toBe(1);
  });

  it('увеличивает уровень с ростом XP', () => {
    const levelLow = calculateLevel(50);
    const levelHigh = calculateLevel(5000);
    expect(levelHigh).toBeGreaterThan(levelLow);
  });

  it('xpForLevel(1) равен 0', () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it('calculateLevelProgress возвращает прогресс в диапазоне [0, 1)', () => {
    const { progress } = calculateLevelProgress(150);
    expect(progress).toBeGreaterThanOrEqual(0);
    expect(progress).toBeLessThan(1);
  });
});
