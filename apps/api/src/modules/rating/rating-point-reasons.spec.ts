import { XPReason } from '@prisma/client';
import { RATING_POINT_REASONS } from './rating.service';

describe('RATING_POINT_REASONS', () => {
  it('считает баунти очками недельного рейтинга, не только места', () => {
    expect(RATING_POINT_REASONS).toEqual([
      XPReason.TOURNAMENT_WIN,
      XPReason.TOURNAMENT_PLACE,
      XPReason.BOUNTY,
    ]);
  });
});
