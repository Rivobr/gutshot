export const XP_REWARDS = {
  PARTICIPATION: 100,
  PLACE_1: 350,
  PLACE_2: 250,
  PLACE_3: 180,
  PLACE_4_TO_8: 130,
  OTHER: 100,
} as const;

export function getXpForPlace(place: number): number {
  if (place === 1) return XP_REWARDS.PLACE_1;
  if (place === 2) return XP_REWARDS.PLACE_2;
  if (place === 3) return XP_REWARDS.PLACE_3;
  if (place >= 4 && place <= 8) return XP_REWARDS.PLACE_4_TO_8;
  return XP_REWARDS.OTHER;
}
