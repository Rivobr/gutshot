/**
 * Пересчёт XP игроков со старой кривой (481910@100) на новую (250000@100)
 * с сохранением относительного прогресса внутри уровня.
 *
 * Запуск внутри api-контейнера:
 *   node scripts/remap-player-xp-v2.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function buildLegacyThresholds() {
  const rows = [{ level: 1, requiredXp: 0 }];
  let step = 250;
  let cumulative = 0;
  for (let transition = 1; transition < 100; transition += 1) {
    if (transition > 1) {
      const prev = transition - 1;
      if (prev < 10) step += 60;
      else if (prev < 25) step += 80;
      else if (prev < 50) step += 100;
      else if (prev < 75) step += 120;
      else step += 140;
    }
    cumulative += step;
    rows.push({ level: transition + 1, requiredXp: cumulative });
  }
  return rows;
}

function requiredXpForLevel(level) {
  if (level <= 1) return 0;
  if (level >= 100) return 250_000;
  const n = level - 1;
  return Math.round(970 * n + 15.7 * n * n);
}

function levelFromXp(thresholds, xp) {
  let level = 1;
  for (const row of thresholds) {
    if (xp >= row.requiredXp) level = row.level;
    else break;
  }
  return level;
}

function remapXp(oldXp) {
  const legacy = buildLegacyThresholds();
  const level = levelFromXp(legacy, oldXp);
  const cur = legacy.find((row) => row.level === level)?.requiredXp ?? 0;
  const next =
    level >= 100
      ? cur
      : (legacy.find((row) => row.level === level + 1)?.requiredXp ?? cur + 1);
  const progress = next > cur ? Math.min(1, Math.max(0, (oldXp - cur) / (next - cur))) : 0;

  const newCur = requiredXpForLevel(level);
  const newNext = requiredXpForLevel(Math.min(100, level + 1));
  if (level >= 100) return 250_000;
  return Math.round(newCur + progress * (newNext - newCur));
}

async function main() {
  const profiles = await prisma.playerProfile.findMany({
    select: { userId: true, xp: true },
  });

  let changed = 0;
  for (const profile of profiles) {
    const nextXp = remapXp(profile.xp);
    if (nextXp === profile.xp) continue;

    await prisma.$transaction([
      prisma.playerProfile.update({
        where: { userId: profile.userId },
        data: { xp: nextXp },
      }),
      prisma.xPHistory.create({
        data: {
          userId: profile.userId,
          amount: nextXp - profile.xp,
          reason: 'MANUAL',
        },
      }),
      prisma.playerEvent.create({
        data: {
          userId: profile.userId,
          type: 'XP_CHANGE',
          xpAmount: nextXp - profile.xp,
          metadata: { kind: 'progression_v2_remap', from: profile.xp, to: nextXp },
        },
      }),
    ]);
    changed += 1;
  }

  console.log(`Remapped XP for ${changed}/${profiles.length} players`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
