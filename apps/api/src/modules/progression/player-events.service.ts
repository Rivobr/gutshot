import { Injectable } from '@nestjs/common';
import { Prisma, PlayerEventType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaTransaction } from '../../common/types/prisma-transaction.type';

export interface LogEventInput {
  userId: string;
  type: PlayerEventType;
  tournamentId?: string | null;
  xpAmount?: number;
  metadata?: Prisma.InputJsonValue | null;
  performedById?: string | null;
}

export interface EventsQuery {
  userId?: string;
  tournamentId?: string;
  type?: PlayerEventType;
  take?: number;
  skip?: number;
}

const EVENT_INCLUDE = {
  tournament: { select: { id: true, title: true } },
  performedBy: { select: { id: true, name: true } },
  user: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
} satisfies Prisma.PlayerEventInclude;

/**
 * Единая точка записи истории активности игрока.
 * Все события клуба проходят через этот сервис.
 */
@Injectable()
export class PlayerEventsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Записывает событие внутри переданной транзакции. */
  async log(tx: PrismaTransaction, input: LogEventInput) {
    return tx.playerEvent.create({
      data: {
        userId: input.userId,
        type: input.type,
        tournamentId: input.tournamentId ?? null,
        xpAmount: input.xpAmount ?? 0,
        metadata: input.metadata ?? Prisma.DbNull,
        performedById: input.performedById ?? null,
      },
      include: EVENT_INCLUDE,
    });
  }

  /** Записывает событие вне транзакции. */
  async record(input: LogEventInput) {
    return this.log(this.prisma, input);
  }

  async findMany(query: EventsQuery) {
    return this.prisma.playerEvent.findMany({
      where: {
        userId: query.userId,
        tournamentId: query.tournamentId,
        type: query.type,
      },
      include: EVENT_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: Math.min(query.take ?? 50, 200),
      skip: query.skip ?? 0,
    });
  }

  async countFor(query: EventsQuery): Promise<number> {
    return this.prisma.playerEvent.count({
      where: { userId: query.userId, tournamentId: query.tournamentId, type: query.type },
    });
  }
}
