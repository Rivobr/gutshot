/**
 * Прогоняет sync достижений для всех игроков с профилем.
 * Запуск: node scripts/resync-achievements.mjs
 */
import { PrismaClient, PlayerEventType, XPReason } from '@prisma/client';
import {
  ACHIEVEMENTS_CATALOG,
  isAchievementUnlocked,
} from '../dist/src/common/constants/achievements-catalog.js';

const prisma = new PrismaClient();

const FINAL_TABLE_PLACE = 9;
const TOP10_PLACE = 10;
const ACTIVE_WEEK_MIN_TOURNAMENTS = 3;

function isoWeekKey(date) {
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayNumber = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNumber + 3);
  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function levelFromXp(thresholds, xp) {
  let level = 1;
  for (const row of thresholds) {
    if (xp >= row.requiredXp) level = row.level;
    else break;
  }
  return level;
}

async function collectMetrics(userId, thresholds) {
  const [profile, results, eventCounts, ratingRewards] = await Promise.all([
    prisma.playerProfile.findUnique({ where: { userId } }),
    prisma.tournamentResult.findMany({
      where: { userId },
      select: {
        place: true,
        tournamentId: true,
        tournament: { select: { date: true } },
      },
      orderBy: { tournament: { date: 'asc' } },
    }),
    prisma.playerEvent.groupBy({
      by: ['type'],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.ratingReward.findMany({
      where: { userId },
      select: { periodType: true, place: true },
    }),
  ]);

  const eventCount = (type) =>
    eventCounts.find((row) => row.type === type)?._count._all ?? 0;

  const wins = results.filter((row) => row.place === 1).length;
  const finalTables = results.filter((row) => row.place <= FINAL_TABLE_PLACE).length;
  const tournamentsPlayed = results.length;

  const weekBuckets = new Map();
  for (const row of results) {
    const key = isoWeekKey(row.tournament.date);
    weekBuckets.set(key, (weekBuckets.get(key) ?? 0) + 1);
  }
  const activeWeeks = Array.from(weekBuckets.values()).filter(
    (count) => count >= ACTIVE_WEEK_MIN_TOURNAMENTS,
  ).length;

  let backToBackWins = 0;
  let winRun = 0;
  let finalTableStreak = 0;
  let finalTableRun = 0;
  let top10Streak = 0;
  let top10Run = 0;

  for (const row of results) {
    if (row.place === 1) {
      winRun += 1;
      backToBackWins = Math.max(backToBackWins, winRun);
    } else {
      winRun = 0;
    }
    if (row.place <= FINAL_TABLE_PLACE) {
      finalTableRun += 1;
      finalTableStreak = Math.max(finalTableStreak, finalTableRun);
    } else {
      finalTableRun = 0;
    }
    if (row.place <= TOP10_PLACE) {
      top10Run += 1;
      top10Streak = Math.max(top10Streak, top10Run);
    } else {
      top10Run = 0;
    }
  }

  const wonTournamentIds = results.filter((r) => r.place === 1).map((r) => r.tournamentId);
  const winNoReentry =
    wonTournamentIds.length === 0
      ? 0
      : await prisma.registration.count({
          where: { userId, tournamentId: { in: wonTournamentIds }, reEntries: 0 },
        });

  const weeklyRewards = ratingRewards.filter((row) => row.periodType === 'WEEKLY');
  const monthlyRewards = ratingRewards.filter((row) => row.periodType === 'MONTHLY');

  return {
    wins,
    finalTables,
    tournamentsPlayed,
    activeWeeks,
    weeklyTop3: weeklyRewards.filter((row) => row.place <= 3).length,
    weeklyWins: weeklyRewards.filter((row) => row.place === 1).length,
    monthlyEntries: monthlyRewards.length,
    monthlyPrizes: monthlyRewards.filter((row) => row.place <= 3).length,
    monthlyWins: monthlyRewards.filter((row) => row.place === 1).length,
    fourOfAKind: eventCount(PlayerEventType.FOUR_OF_A_KIND),
    straightFlush: eventCount(PlayerEventType.STRAIGHT_FLUSH),
    royalFlush: eventCount(PlayerEventType.ROYAL_FLUSH),
    knockouts: profile?.bounties ?? 0,
    level: levelFromXp(thresholds, profile?.xp ?? 0),
    winNoReentry,
    backToBackWins,
    finalTableStreak,
    top10Streak,
    shortStackWins: eventCount(PlayerEventType.SHORT_STACK_WIN),
    tutorialCompleted: eventCount(PlayerEventType.TUTORIAL_COMPLETED),
    friendsReferred: eventCount(PlayerEventType.FRIEND_REFERRED),
  };
}

async function main() {
  const thresholds = await prisma.levelThreshold.findMany({ orderBy: { level: 'asc' } });
  const users = await prisma.playerProfile.findMany({ select: { userId: true } });

  const granted = [];
  for (const { userId } of users) {
    const metrics = await collectMetrics(userId, thresholds);
    const already = await prisma.playerAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const unlocked = new Set(already.map((r) => r.achievementId));

    // Don't re-grant legend if manually tested with 0 XP - skip if already have it
    const pending = ACHIEVEMENTS_CATALOG.filter(
      (def) => !unlocked.has(def.id) && isAchievementUnlocked(def, metrics),
    );

    for (const def of pending) {
      await prisma.$transaction(async (tx) => {
        await tx.playerAchievement.create({
          data: { userId, achievementId: def.id, xpAwarded: def.xp },
        });
        if (def.xp > 0) {
          await tx.playerProfile.update({
            where: { userId },
            data: { xp: { increment: def.xp } },
          });
          await tx.xPHistory.create({
            data: { userId, amount: def.xp, reason: XPReason.ACHIEVEMENT },
          });
          await tx.playerEvent.create({
            data: {
              userId,
              type: PlayerEventType.ACHIEVEMENT_UNLOCKED,
              xpAmount: def.xp,
              metadata: { achievementId: def.id, title: def.title },
            },
          });
        }
      });
      granted.push({ userId, id: def.id, xp: def.xp });
    }
  }

  const byId = {};
  for (const g of granted) {
    byId[g.id] = (byId[g.id] ?? 0) + 1;
  }
  console.log(
    JSON.stringify(
      {
        players: users.length,
        grants: granted.length,
        byAchievement: byId,
        sample: granted.slice(0, 30),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
