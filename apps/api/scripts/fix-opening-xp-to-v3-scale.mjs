/**
 * 1) Пересчитывает XP за места «ОТКРЫТИЕ КЛУБА» на шкалу v3 (600k).
 * 2) Округляет итоговый XP всех профилей до кратного 5.
 *
 * Запуск:
 *   node scripts/fix-opening-xp-to-v3-scale.mjs
 */
import { PrismaClient, XPReason } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const PLACE_XP = {
  1: 2000,
  2: 1600,
  3: 1300,
  4: 1100,
  5: 1000,
  6: 900,
  7: 800,
  8: 750,
  9: 700,
  10: 650,
  11: 600,
  12: 550,
  13: 500,
  14: 475,
  15: 450,
  16: 425,
  17: 400,
  18: 375,
  19: 350,
  20: 325,
  21: 250,
  22: 250,
  23: 250,
  24: 250,
  25: 250,
  26: 200,
  27: 200,
  28: 200,
  29: 200,
  30: 200,
};

function expectedForPlace(place) {
  if (place >= 1 && place <= 30) return PLACE_XP[place];
  if (place >= 31 && place <= 40) return 125;
  if (place >= 41 && place <= 50) return 100;
  if (place >= 51) return 75;
  return 0;
}

function roundTo5(value) {
  return Math.max(0, Math.round(value / 5) * 5);
}

function id(prefix) {
  return `${prefix}_${randomBytes(8).toString('hex')}`;
}

async function main() {
  const opening = await prisma.tournament.findFirst({
    where: { title: { contains: 'ОТКРЫТИЕ', mode: 'insensitive' } },
    orderBy: { date: 'asc' },
  });

  if (!opening) {
    throw new Error('Турнир ОТКРЫТИЕ КЛУБА не найден');
  }

  const results = await prisma.tournamentResult.findMany({
    where: { tournamentId: opening.id },
    include: {
      user: { select: { nickname: true, username: true, firstName: true } },
    },
    orderBy: { place: 'asc' },
  });

  console.log(`Opening tournament: ${opening.title} (${opening.id}), results=${results.length}`);

  let placeFixes = 0;
  for (const result of results) {
    const expected = expectedForPlace(result.place);
    const history = await prisma.xPHistory.findFirst({
      where: {
        tournamentResultId: result.id,
        reason: { in: [XPReason.TOURNAMENT_WIN, XPReason.TOURNAMENT_PLACE] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!history) {
      console.warn(`No XP history for place ${result.place} ${result.user.nickname ?? result.userId}`);
      continue;
    }

    const delta = expected - history.amount;
    if (delta === 0) continue;

    const name = result.user.nickname ?? result.user.username ?? result.userId;
    console.log(
      `place ${result.place} ${name}: ${history.amount} → ${expected} (delta ${delta})`,
    );

    await prisma.$transaction(async (tx) => {
      // Правим саму запись за место — без дополнительного MANUAL, чтобы sum(history)=profile.
      await tx.xPHistory.update({
        where: { id: history.id },
        data: {
          amount: expected,
          reason: result.place === 1 ? XPReason.TOURNAMENT_WIN : XPReason.TOURNAMENT_PLACE,
        },
      });

      const profile = await tx.playerProfile.findUnique({ where: { userId: result.userId } });
      const nextXp = Math.max(0, (profile?.xp ?? 0) + delta);
      await tx.playerProfile.upsert({
        where: { userId: result.userId },
        update: { xp: nextXp },
        create: { id: id('pp'), userId: result.userId, xp: nextXp },
      });
    });

    placeFixes += 1;
  }

  console.log(`Place XP fixes: ${placeFixes}`);

  const profiles = await prisma.playerProfile.findMany({
    include: { user: { select: { nickname: true, username: true } } },
  });

  let rounded = 0;
  for (const profile of profiles) {
    const next = roundTo5(profile.xp);
    if (next === profile.xp) continue;
    const delta = next - profile.xp;
    const name = profile.user.nickname ?? profile.user.username ?? profile.userId;
    console.log(`round ${name}: ${profile.xp} → ${next}`);

    await prisma.$transaction(async (tx) => {
      await tx.playerProfile.update({
        where: { userId: profile.userId },
        data: { xp: next },
      });
      await tx.xPHistory.create({
        data: {
          id: id('xph'),
          userId: profile.userId,
          amount: delta,
          reason: XPReason.MANUAL,
        },
      });
    });
    rounded += 1;
  }

  console.log(`Rounded to ×5: ${rounded}/${profiles.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
