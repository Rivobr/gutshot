import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LevelsService } from '../../progression/levels.service';
import { PlayerEventsService } from '../../progression/player-events.service';

@Injectable()
export class AdminPlayersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly levelsService: LevelsService,
    private readonly playerEventsService: PlayerEventsService,
  ) {}

  async findAll() {
    const [users, thresholds] = await Promise.all([
      this.prisma.user.findMany({
        include: {
          playerProfile: true,
          _count: {
            select: {
              registrations: { where: { status: 'FINISHED' } },
              tournamentResults: { where: { place: 1 } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.levelsService.getThresholds(),
    ]);

    return users.map((user) => ({
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.nickname,
      photoUrl: user.photoUrl,
      isBlocked: user.isBlocked,
      isVerified: user.isVerified,
      qrCode: user.qrCode,
      consentAcceptedAt: user.consentAcceptedAt,
      xp: user.playerProfile?.xp ?? 0,
      level: this.levelsService.computeProgress(thresholds, user.playerProfile?.xp ?? 0).level,
      visits: user._count.registrations,
      wins: user._count.tournamentResults,
      createdAt: user.createdAt,
    }));
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        playerProfile: true,
        registrations: { include: { tournament: true }, orderBy: { createdAt: 'desc' } },
        xpHistory: { orderBy: { createdAt: 'desc' } },
        achievements: { orderBy: { unlockedAt: 'desc' } },
        notifications: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!user) {
      throw new NotFoundException('Игрок не найден');
    }

    const progress = await this.levelsService.getProgress(user.playerProfile?.xp ?? 0);
    const events = await this.playerEventsService.findMany({ userId: id, take: 100 });

    return { ...user, ...progress, events };
  }

  async block(id: string) {
    await this.findById(id);
    return this.prisma.user.update({ where: { id }, data: { isBlocked: true } });
  }

  async unblock(id: string) {
    await this.findById(id);
    return this.prisma.user.update({ where: { id }, data: { isBlocked: false } });
  }

  async setVerified(id: string, isVerified: boolean) {
    await this.findById(id);
    return this.prisma.user.update({ where: { id }, data: { isVerified } });
  }

  /**
   * Сбрасывает принятие соглашений — при следующем открытии Mini App
   * игрок снова увидит приветственный экран.
   */
  async resetConsent(id: string) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: { consentAcceptedAt: null },
    });
  }
}
