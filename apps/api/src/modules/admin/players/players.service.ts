import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LevelsService } from '../../progression/levels.service';
import { PlayerEventsService } from '../../progression/player-events.service';
import { UsersService } from '../../users/users.service';

/** Прячет URL вида api.telegram.org/file/bot<TOKEN>/… из ответов админки. */
function safePhotoUrl(photoUrl: string | null | undefined): string | null {
  if (!photoUrl) return null;
  if (/api\.telegram\.org\/file\/bot/i.test(photoUrl)) return null;
  return photoUrl;
}

@Injectable()
export class AdminPlayersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly levelsService: LevelsService,
    private readonly playerEventsService: PlayerEventsService,
    private readonly usersService: UsersService,
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
      photoUrl: safePhotoUrl(user.photoUrl),
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

  /**
   * Создаёт игрока по Telegram ID (или возвращает существующего).
   * QR/XP выдаются как при первом входе через бота; профиль догрузится из Bot API.
   */
  async createByTelegramId(telegramId: string, isVerified = false) {
    const id = String(telegramId).trim();
    if (!/^\d{5,20}$/.test(id)) {
      throw new BadRequestException('Telegram ID должен быть числом (5–20 цифр)');
    }

    const user = await this.usersService.findOrCreateByTelegramId(id);
    if (isVerified && !user.isVerified) {
      await this.setVerified(user.id, true);
    }

    return this.findListItemById(user.id);
  }

  private async findListItemById(id: string) {
    const [user, thresholds] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id },
        include: {
          playerProfile: true,
          _count: {
            select: {
              registrations: { where: { status: 'FINISHED' } },
              tournamentResults: { where: { place: 1 } },
            },
          },
        },
      }),
      this.levelsService.getThresholds(),
    ]);

    if (!user) {
      throw new NotFoundException('Игрок не найден');
    }

    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.nickname,
      photoUrl: safePhotoUrl(user.photoUrl),
      isBlocked: user.isBlocked,
      isVerified: user.isVerified,
      qrCode: user.qrCode,
      consentAcceptedAt: user.consentAcceptedAt,
      xp: user.playerProfile?.xp ?? 0,
      level: this.levelsService.computeProgress(thresholds, user.playerProfile?.xp ?? 0).level,
      visits: user._count.registrations,
      wins: user._count.tournamentResults,
      createdAt: user.createdAt,
    };
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
