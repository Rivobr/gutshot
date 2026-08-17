import { isRatingExcludedUsername } from './rating-exclusions';

describe('isRatingExcludedUsername', () => {
  it('matches excluded usernames regardless of case and @', () => {
    expect(isRatingExcludedUsername('ingra_admin')).toBe(true);
    expect(isRatingExcludedUsername('@GARGONA52')).toBe(true);
    expect(isRatingExcludedUsername('Ingra_Admin')).toBe(true);
    expect(isRatingExcludedUsername('geosablin')).toBe(true);
    expect(isRatingExcludedUsername('@GeoSablin')).toBe(true);
  });

  it('does not match other players', () => {
    expect(isRatingExcludedUsername('prophet')).toBe(false);
    expect(isRatingExcludedUsername(null)).toBe(false);
    expect(isRatingExcludedUsername('')).toBe(false);
  });
});
