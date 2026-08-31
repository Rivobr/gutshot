import { clubBlindStructure } from './tournament-clock';

describe('clubBlindStructure after late registration', () => {
  const levels = clubBlindStructure();
  const lateRegBreak = levels.findIndex(
    (row, index) =>
      row.isBreak && row.durationSec === 15 * 60 && levels[index - 1]?.bigBlind === 3000,
  );

  it('keeps the 15-minute late-reg break after 1500/3000', () => {
    expect(lateRegBreak).toBeGreaterThan(0);
  });

  it('climbs blinds by at most ×1.35 until 100k BB', () => {
    const after = levels.slice(lateRegBreak + 1).filter((row) => !row.isBreak);
    for (let i = 1; i < after.length; i += 1) {
      const prev = after[i - 1].bigBlind ?? 0;
      const next = after[i].bigBlind ?? 0;
      if (prev >= 100_000) {
        break;
      }
      expect(next / prev).toBeLessThanOrEqual(1.35);
    }
  });

  it('does not make the post-late-reg clock much longer than before (~134 min)', () => {
    const after = levels.slice(lateRegBreak + 1);
    const minutes = after.reduce((sum, row) => sum + row.durationSec / 60, 0);
    expect(minutes).toBeGreaterThanOrEqual(120);
    expect(minutes).toBeLessThanOrEqual(140);
  });
});
