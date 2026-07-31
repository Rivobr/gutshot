import { Injectable } from '@nestjs/common';
import { AchievementCode } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaTransaction } from '../../common/types/prisma-transaction.type';

/** Достижения, соответствующие редким комбинациям. */
export const ACHIEVEMENT_TITLES: Record<AchievementCode, string> = {
  FOUR_OF_A_KIND: 'Каре',
  STRAIGHT_FLUSH: 'Стрит-флеш',
  ROYAL_FLUSH: 'Роял-флеш',
};

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Выдает достижение, если его еще нет у игрока.
   * Возвращает код только при фактической выдаче — повторная выдача невозможна
   * благодаря уникальному индексу (userId, code).
   */
  async unlock(
    tx: PrismaTransaction,
    userId: string,
    code: AchievementCode,
    tournamentId?: string | null,
  ): Promise<AchievementCode | null> {
    const existing = await tx.achievement.findUnique({
      where: { userId_code: { userId, code } },
    });

    if (existing) {
      return null;
    }

    await tx.achievement.create({
      data: { userId, code, tournamentId: tournamentId ?? null },
    });

    return code;
  }

  async findByUser(userId: string) {
    return this.prisma.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' },
    });
  }
}
