import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { calculateLevelProgress } from '../../common/utils/level.util';

@Injectable()
export class RatingService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverallRating() {
    const profiles = await this.prisma.playerProfile.findMany({
      orderBy: { xp: 'desc' },
      include: { user: true },
    });

    return profiles.map((profile, index) => ({
      rank: index + 1,
      userId: profile.userId,
      firstName: profile.user.firstName,
      lastName: profile.user.lastName,
      photoUrl: profile.user.photoUrl,
      xp: profile.xp,
      level: calculateLevelProgress(profile.xp).level,
    }));
  }

  async getWeeklyRating() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const grouped = await this.prisma.xPHistory.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: weekAgo } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: grouped.map((g) => g.userId) } },
    });

    const userMap = new Map(users.map((user) => [user.id, user]));

    return grouped.map((entry, index) => {
      const user = userMap.get(entry.userId);
      return {
        rank: index + 1,
        userId: entry.userId,
        firstName: user?.firstName,
        lastName: user?.lastName,
        photoUrl: user?.photoUrl,
        weeklyXp: entry._sum.amount ?? 0,
      };
    });
  }
}
