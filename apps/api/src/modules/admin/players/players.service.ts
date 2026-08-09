import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LevelsService } from '../../progression/levels.service';
import { PlayerEventsService } from '../../progression/player-events.service';
import { TelegramService } from '../../telegram/telegram.service';
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
    private readonly telegramService: TelegramService,
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
   * Создаёт игрока по Telegram ID / @username (или возвращает существующего).
   * Числовой ID — find-or-create; @username — поиск в клубе + resolve через Bot API.
   * QR/XP выдаются как при первом входе через бота; профиль догрузится из Bot API.
   */
  async createByQuery(rawQuery: string, isVerified = false) {
    const query = String(rawQuery ?? '').trim();
    if (!query) {
      throw new BadRequestException('Укажите Telegram ID или @username');
    }

    const user = await this.resolvePlayerForCreate(query);
    if (isVerified && !user.isVerified) {
      await this.setVerified(user.id, true);
    }

    return this.findListItemById(user.id);
  }

  /** @deprecated используйте createByQuery */
  async createByTelegramId(telegramId: string, isVerified = false) {
    return this.createByQuery(telegramId, isVerified);
  }

  private async resolvePlayerForCreate(query: string) {
    const normalized = query.trim();

    if (/^\d{5,20}$/.test(normalized)) {
      return this.usersService.findOrCreateByTelegramId(normalized);
    }

    const username = normalized.replace(/^@+/, '').trim();
    if (!username || !/^[A-Za-z0-9_]{3,64}$/.test(username)) {
      throw new BadRequestException('Укажите числовой Telegram ID (5–20 цифр) или @username');
    }

    const byUsername = await this.prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
    });
    if (byUsername) {
      return byUsername;
    }

    const byNickname = await this.prisma.user.findMany({
      where: { nickname: { equals: username, mode: 'insensitive' } },
      take: 5,
    });
    if (byNickname.length === 1) {
      return byNickname[0];
    }
    if (byNickname.length > 1) {
      throw new ConflictException(
        'Найдено несколько игроков с таким никнеймом. Укажите числовой Telegram ID или @username',
      );
    }

    // Bot API: getChat(@username), если пользователь доступен боту.
    const chat = await this.telegramService.getChatProfile(
      username.startsWith('@') ? username : `@${username}`,
    );
    if (chat?.telegramId && /^\d{5,20}$/.test(chat.telegramId)) {
      return this.usersService.findOrCreateByTelegramId(chat.telegramId);
    }

    throw new NotFoundException(
      'Игрок не найден. Укажите числовой Telegram ID или @username (человек должен был писать боту)',
    );
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
