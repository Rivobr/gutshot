import { getXpForPlace, XP_REWARDS } from './xp.constants';

describe('xp.constants', () => {
  it('начисляет корректный XP за призовые места', () => {
    expect(getXpForPlace(1)).toBe(XP_REWARDS.PLACE_1);
    expect(getXpForPlace(2)).toBe(XP_REWARDS.PLACE_2);
    expect(getXpForPlace(3)).toBe(XP_REWARDS.PLACE_3);
  });

  it('начисляет XP за места с 4 по 8', () => {
    expect(getXpForPlace(4)).toBe(XP_REWARDS.PLACE_4_TO_8);
    expect(getXpForPlace(8)).toBe(XP_REWARDS.PLACE_4_TO_8);
  });

  it('начисляет базовый XP за остальные места', () => {
    expect(getXpForPlace(9)).toBe(XP_REWARDS.OTHER);
    expect(getXpForPlace(24)).toBe(XP_REWARDS.OTHER);
  });
});
