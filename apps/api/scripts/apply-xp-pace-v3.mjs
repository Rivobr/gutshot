/**
 * Миграция экономики XP → модель 600k@100 (активный игрок не достигает L100 за год).
 *
 * 1) Перезаписывает XpSetting дефолтами v3
 * 2) Перезаписывает LevelThreshold кривой 600k
 * 3) Пересчитывает PlayerProfile.xp с кривой 250k → 600k с сохранением уровня
 *
 * Запуск внутри api-контейнера:
 *   node scripts/apply-xp-pace-v3.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_PLACE_RATING = {
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

const DEFAULT_XP_SETTINGS = {
  ATTENDANCE: 100,
  ELIMINATION: 50,
  RE_ENTRY: 0,
  BOUNTY: 50,
  FOUR_OF_A_KIND: 100,
  STRAIGHT_FLUSH: 200,
  ROYAL_FLUSH: 500,
  TOURNAMENT_WIN: DEFAULT_PLACE_RATING[1],
  PLACE_2: DEFAULT_PLACE_RATING[2],
  PLACE_3: DEFAULT_PLACE_RATING[3],
  PLACE_4: DEFAULT_PLACE_RATING[4],
  PLACE_5: DEFAULT_PLACE_RATING[5],
  PLACE_6: DEFAULT_PLACE_RATING[6],
  PLACE_7: DEFAULT_PLACE_RATING[7],
  PLACE_8: DEFAULT_PLACE_RATING[8],
  PLACE_9: DEFAULT_PLACE_RATING[9],
  PLACE_10: DEFAULT_PLACE_RATING[10],
  PLACE_11: DEFAULT_PLACE_RATING[11],
  PLACE_12: DEFAULT_PLACE_RATING[12],
  PLACE_13: DEFAULT_PLACE_RATING[13],
  PLACE_14: DEFAULT_PLACE_RATING[14],
  PLACE_15: DEFAULT_PLACE_RATING[15],
  PLACE_16: DEFAULT_PLACE_RATING[16],
  PLACE_17: DEFAULT_PLACE_RATING[17],
  PLACE_18: DEFAULT_PLACE_RATING[18],
  PLACE_19: DEFAULT_PLACE_RATING[19],
  PLACE_20: DEFAULT_PLACE_RATING[20],
  PLACE_21: DEFAULT_PLACE_RATING[21],
  PLACE_22: DEFAULT_PLACE_RATING[22],
  PLACE_23: DEFAULT_PLACE_RATING[23],
  PLACE_24: DEFAULT_PLACE_RATING[24],
  PLACE_25: DEFAULT_PLACE_RATING[25],
  PLACE_26: DEFAULT_PLACE_RATING[26],
  PLACE_27: DEFAULT_PLACE_RATING[27],
  PLACE_28: DEFAULT_PLACE_RATING[28],
  PLACE_29: DEFAULT_PLACE_RATING[29],
  PLACE_30: DEFAULT_PLACE_RATING[30],
  PLACE_31_40: 125,
  PLACE_41_50: 100,
  PLACE_51_PLUS: 75,
  WEEKLY_TOP_1: 2000,
  WEEKLY_TOP_2: 1250,
  WEEKLY_TOP_3: 800,
  MONTHLY_TOP_1: 5000,
  MONTHLY_TOP_2: 3000,
  MONTHLY_TOP_3: 2000,
};

function requiredXpV2(level) {
  if (level <= 1) return 0;
  if (level >= 100) return 250_000;
  const n = level - 1;
  return Math.round(970 * n + 15.7 * n * n);
}

function requiredXpV3(level) {
  if (level <= 1) return 0;
  if (level >= 100) return 600_000;
  const n = level - 1;
  return Math.round(2328 * n + 37.68 * n * n);
}

function levelFromXp(requiredFn, xp) {
  let level = 1;
  for (let candidate = 1; candidate <= 100; candidate += 1) {
    if (xp >= requiredFn(candidate)) level = candidate;
    else break;
  }
  return level;
}

/** Сохраняет уровень и прогресс внутри уровня при переходе 250k → 600k. */
function remapXp(oldXp) {
  const level = levelFromXp(requiredXpV2, oldXp);
  const cur = requiredXpV2(level);
  const next = level >= 100 ? cur : requiredXpV2(level + 1);
  const progress = next > cur ? Math.min(1, Math.max(0, (oldXp - cur) / (next - cur))) : 0;

  const newCur = requiredXpV3(level);
  const newNext = requiredXpV3(Math.min(100, level + 1));
  if (level >= 100) return 600_000;
  return Math.round(newCur + progress * (newNext - newCur));
}

async function main() {
  console.log('Applying XP pace v3 (600k@100)...');

  for (const [key, value] of Object.entries(DEFAULT_XP_SETTINGS)) {
    await prisma.xpSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log(`XpSetting upserted: ${Object.keys(DEFAULT_XP_SETTINGS).length}`);

  for (let level = 1; level <= 100; level += 1) {
    const requiredXp = requiredXpV3(level);
    await prisma.levelThreshold.upsert({
      where: { level },
      update: { requiredXp },
      create: { level, requiredXp },
    });
  }
  console.log('LevelThreshold upserted: 100');

  const profiles = await prisma.playerProfile.findMany({
    select: { userId: true, xp: true },
  });

  let changed = 0;
  for (const profile of profiles) {
    const nextXp = remapXp(profile.xp);
    if (nextXp === profile.xp) continue;

    const delta = nextXp - profile.xp;
    await prisma.$transaction([
      prisma.playerProfile.update({
        where: { userId: profile.userId },
        data: { xp: nextXp },
      }),
      prisma.xPHistory.create({
        data: {
          userId: profile.userId,
          amount: delta,
          reason: 'MANUAL',
        },
      }),
      prisma.playerEvent.create({
        data: {
          userId: profile.userId,
          type: 'XP_CHANGE',
          xpAmount: delta,
          metadata: { kind: 'progression_v3_remap', from: profile.xp, to: nextXp },
        },
      }),
    ]);
    changed += 1;
  }

  console.log(`Player XP remapped: ${changed}/${profiles.length}`);
  console.log('Done.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
