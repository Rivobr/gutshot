import { Injectable } from '@nestjs/common';
import { PlayerEventType, Prisma, XPReason } from '@prisma/client';
import { PrismaTransaction } from '../../common/types/prisma-transaction.type';
import { LevelsService } from './levels.service';
import { PlayerEventsService } from './player-events.service';

export interface AwardXpInput {
  userId: string;
  amount: number;
  reason: XPReason;
  eventType: PlayerEventType;
  tournamentId?: string | null;
  tournamentResultId?: string | null;
  performedById?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  /** false — записать историю (рейтинг), не менять XP профиля. */
  applyToProfile?: boolean;
}

export interface AwardXpResult {
  xpAwarded: number;
  totalXp: number;
  previousLevel: number;
  level: number;
  levelUp: boolean;
  eventId: string;
}

/**
 * Начисление опыта. Обновляет профиль, пишет XPHistory, событие истории
 * и отдельное событие повышения уровня. Всегда выполняется внутри транзакции,
 * переданной вызывающим кодом.
 */
@Injectable()
export class XpService {
  constructor(
    private readonly levelsService: LevelsService,
    private readonly playerEventsService: PlayerEventsService,
  ) {}

  async award(tx: PrismaTransaction, input: AwardXpInput): Promise<AwardXpResult> {
    const thresholds = await this.levelsService.getThresholds();

    const profile = await tx.playerProfile.upsert({
      where: { userId: input.userId },
      update: {},
      create: { userId: input.userId, xp: 0 },
    });

    const previousXp = profile.xp;
    const applyToProfile = input.applyToProfile !== false;
    const totalXp = applyToProfile ? Math.max(previousXp + input.amount, 0) : previousXp;

    if (input.amount !== 0) {
      if (applyToProfile) {
        await tx.playerProfile.update({
          where: { userId: input.userId },
          data: { xp: totalXp },
        });
      }

      await tx.xPHistory.create({
        data: {
          userId: input.userId,
          tournamentResultId: input.tournamentResultId ?? null,
          reason: input.reason,
          amount: input.amount,
        },
      });
    }

    const previousLevel = this.levelsService.computeProgress(thresholds, previousXp).level;
    const level = this.levelsService.computeProgress(thresholds, totalXp).level;
    const levelUp = level > previousLevel;

    const event = await this.playerEventsService.log(tx, {
      userId: input.userId,
      type: input.eventType,
      tournamentId: input.tournamentId,
      xpAmount: input.amount,
      performedById: input.performedById,
      metadata: input.metadata,
    });

    if (levelUp) {
      await this.playerEventsService.log(tx, {
        userId: input.userId,
        type: PlayerEventType.LEVEL_UP,
        tournamentId: input.tournamentId,
        xpAmount: 0,
        performedById: input.performedById,
        metadata: { from: previousLevel, to: level, totalXp },
      });
    }

    return {
      xpAwarded: input.amount,
      totalXp,
      previousLevel,
      level,
      levelUp,
      eventId: event.id,
    };
  }
}
