import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AchievementCode,
  NotificationType,
  PlayerEventType,
  RegistrationStatus,
  XPReason,
  XpSettingKey,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { normalizePlayerQrCode } from '../../../common/utils/player-qr.util';
import { AttendanceService } from '../attendance/attendance.service';
import { AdminTournamentsService } from '../tournaments/admin-tournaments.service';
import { LevelsService } from '../../progression/levels.service';
import { XpService } from '../../progression/xp.service';
import { XpSettingsService } from '../../progression/xp-settings.service';
import { AchievementsService, ACHIEVEMENT_TITLES } from '../../progression/achievements.service';
import { AchievementEngineService } from '../../progression/achievement-engine.service';
import { PlayerEventsService } from '../../progression/player-events.service';
import { NotificationsService } from '../../telegram/notifications.service';
import { ScannerEvent, ReEntryKind, RE_ENTRY_KIND_PARAMS } from './dto/scanner.dto';

interface EventConfig {
  xpKey: XpSettingKey;
  xpReason: XPReason;
  eventType: PlayerEventType;
  achievement?: AchievementCode;
  /** Событие имеет смысл только в контексте турнира. */
  requiresRegistration: boolean;
  /** Событие само по себе не даёт XP — награда идёт от достижения. */
  noXp?: boolean;
  label: string;
}

const EVENT_CONFIG: Record<ScannerEvent, EventConfig> = {
  [ScannerEvent.ARRIVED]: {
    xpKey: XpSettingKey.ATTENDANCE,
    xpReason: XPReason.ATTENDANCE,
    eventType: PlayerEventType.ARRIVED,
    requiresRegistration: true,
    label: 'Явка на турнир',
  },
  [ScannerEvent.ELIMINATED]: {
    xpKey: XpSettingKey.ELIMINATION,
    xpReason: XPReason.ELIMINATION,
    eventType: PlayerEventType.ELIMINATED,
    requiresRegistration: true,
    label: 'Вылет из турнира',
  },
  [ScannerEvent.RE_ENTRY]: {
    xpKey: XpSettingKey.RE_ENTRY,
    xpReason: XPReason.RE_ENTRY,
    eventType: PlayerEventType.RE_ENTRY,
    requiresRegistration: true,
    label: 'Ре-энтри',
  },
  // Аддон: выручка фиксируется в аналитике, XP не даёт и вылет не сбрасывает.
  [ScannerEvent.ADDON]: {
    xpKey: XpSettingKey.RE_ENTRY,
    xpReason: XPReason.ACHIEVEMENT,
    eventType: PlayerEventType.RE_ENTRY,
    requiresRegistration: true,
    noXp: true,
    label: 'Аддон',
  },
  [ScannerEvent.BOUNTY]: {
    xpKey: XpSettingKey.BOUNTY,
    xpReason: XPReason.BOUNTY,
    eventType: PlayerEventType.BOUNTY,
    requiresRegistration: true,
    label: 'Баунти',
  },
  [ScannerEvent.FOUR_OF_A_KIND]: {
    xpKey: XpSettingKey.FOUR_OF_A_KIND,
    xpReason: XPReason.ACHIEVEMENT,
    eventType: PlayerEventType.FOUR_OF_A_KIND,
    achievement: AchievementCode.FOUR_OF_A_KIND,
    requiresRegistration: false,
    label: 'Каре',
  },
  [ScannerEvent.STRAIGHT_FLUSH]: {
    xpKey: XpSettingKey.STRAIGHT_FLUSH,
    xpReason: XPReason.ACHIEVEMENT,
    eventType: PlayerEventType.STRAIGHT_FLUSH,
    achievement: AchievementCode.STRAIGHT_FLUSH,
    requiresRegistration: false,
    label: 'Стрит-флеш',
  },
  [ScannerEvent.ROYAL_FLUSH]: {
    xpKey: XpSettingKey.ROYAL_FLUSH,
    xpReason: XPReason.ACHIEVEMENT,
    eventType: PlayerEventType.ROYAL_FLUSH,
    achievement: AchievementCode.ROYAL_FLUSH,
    requiresRegistration: false,
    label: 'Роял-флеш',
  },
  // Особые достижения из ТЗ. Собственного XP у события нет —
  // награду выдаёт каталог достижений при первом выполнении.
  [ScannerEvent.TUTORIAL_COMPLETED]: {
    xpKey: XpSettingKey.RE_ENTRY,
    xpReason: XPReason.ACHIEVEMENT,
    eventType: PlayerEventType.TUTORIAL_COMPLETED,
    requiresRegistration: false,
    noXp: true,
    label: 'Прошёл обучение',
  },
  [ScannerEvent.FRIEND_REFERRED]: {
    xpKey: XpSettingKey.RE_ENTRY,
    xpReason: XPReason.ACHIEVEMENT,
    eventType: PlayerEventType.FRIEND_REFERRED,
    requiresRegistration: false,
    noXp: true,
    label: 'Привёл друга',
  },
  [ScannerEvent.SHORT_STACK_WIN]: {
    xpKey: XpSettingKey.RE_ENTRY,
    xpReason: XPReason.ACHIEVEMENT,
    eventType: PlayerEventType.SHORT_STACK_WIN,
    requiresRegistration: false,
    noXp: true,
    label: 'Победа со стека менее 10 BB',
  },
};

/** Статусы регистрации, при которых игрок считается активным участником. */
const ACTIVE_REGISTRATION_STATUSES: RegistrationStatus[] = [
  RegistrationStatus.REGISTERED,
  RegistrationStatus.CHECKED_IN,
  RegistrationStatus.PLAYING,
];

@Injectable()
export class ScannerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xpSettingsService: XpSettingsService,
    private readonly levelsService: LevelsService,
    private readonly xpService: XpService,
    private readonly achievementsService: AchievementsService,
    private readonly achievementEngine: AchievementEngineService,
    private readonly playerEventsService: PlayerEventsService,
    private readonly attendanceService: AttendanceService,
    private readonly notificationsService: NotificationsService,
    private readonly adminTournamentsService: AdminTournamentsService,
  ) {}

  /** Карточка игрока по отсканированному постоянному QR-коду. */
  async findPlayer(rawQrCode: string) {
    const qrCode = normalizePlayerQrCode(rawQrCode);

    const user = await this.prisma.user.findUnique({
      where: { qrCode },
      include: {
        playerProfile: true,
        achievements: { orderBy: { unlockedAt: 'desc' } },
      },
    });

    if (!user) {
      throw new NotFoundException('Игрок с таким QR-кодом не найден');
    }

    const xp = user.playerProfile?.xp ?? 0;
    const progress = await this.levelsService.getProgress(xp);

    const registration = await this.prisma.registration.findFirst({
      where: { userId: user.id, status: { in: ACTIVE_REGISTRATION_STATUSES } },
      include: { tournament: { select: { id: true, title: true } } },
      orderBy: { registeredAt: 'desc' },
    });

    const recentEvents = await this.playerEventsService.findMany({ userId: user.id, take: 10 });

    return {
      userId: user.id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      nickname: user.nickname,
      photoUrl: user.photoUrl,
      isBlocked: user.isBlocked,
      qrCode: user.qrCode,
      xp,
      ...progress,
      achievements: user.achievements,
      registration: registration
        ? {
            id: registration.id,
            tournamentId: registration.tournamentId,
            tournamentTitle: registration.tournament.title,
            status: registration.status,
            registeredAt: registration.registeredAt,
            arrivedAt: registration.arrivedAt,
            attendanceXpGiven: registration.attendanceXpGiven,
            reEntries: registration.reEntries,
            bounties: registration.bounties,
          }
        : null,
      recentEvents,
    };
  }

  /**
   * Применяет событие к игроку: обновляет счетчики, начисляет XP,
   * выдает достижение и пишет запись в историю. Все шаги — в одной транзакции.
   */
  async applyEvent(
    rawQrCode: string,
    event: ScannerEvent,
    adminId: string,
    tournamentId?: string,
    reEntryKind?: ReEntryKind,
  ) {
    const qrCode = normalizePlayerQrCode(rawQrCode);
    const config = EVENT_CONFIG[event];

    const user = await this.prisma.user.findUnique({
      where: { qrCode },
      include: { playerProfile: true },
    });

    if (!user) {
      throw new NotFoundException('Игрок с таким QR-кодом не найден');
    }

    if (user.isBlocked) {
      throw new BadRequestException('Игрок заблокирован');
    }

    const registration = await this.resolveRegistration(user.id, tournamentId, config);
    const xpValue = config.noXp ? 0 : await this.xpSettingsService.getValue(config.xpKey);

    const result = await this.prisma.$transaction(async (tx) => {
      let xpAmount = xpValue;

      if (event === ScannerEvent.ARRIVED) {
        xpAmount = await this.attendanceService.applyArrival(tx, registration!);
      } else if (event === ScannerEvent.ELIMINATED) {
        await this.adminTournamentsService.applyEliminationPlaceInTx(tx, registration!.id);
      } else if (event === ScannerEvent.RE_ENTRY) {
        const kind =
          reEntryKind && reEntryKind !== ReEntryKind.ADDON_1000
            ? reEntryKind
            : ReEntryKind.RE_ENTRY_1000;
        const params = RE_ENTRY_KIND_PARAMS[kind];
        await tx.registration.update({
          where: { id: registration!.id },
          data: { reEntries: { increment: 1 }, eliminatedAt: null, place: null },
        });
        await tx.playerProfile.upsert({
          where: { userId: user.id },
          update: { reEntries: { increment: 1 } },
          create: { userId: user.id, xp: 0, reEntries: 1 },
        });
        await tx.reEntryLog.create({
          data: {
            tournamentId: registration!.tournamentId,
            registrationId: registration!.id,
            userId: user.id,
            playerName: [user.lastName, user.firstName].filter(Boolean).join(' ') || user.nickname,
            kind,
            amount: params.amount,
            chips: params.chips,
            createdById: adminId,
          },
        });
      } else if (event === ScannerEvent.ADDON) {
        const params = RE_ENTRY_KIND_PARAMS[ReEntryKind.ADDON_1000];
        await tx.reEntryLog.create({
          data: {
            tournamentId: registration!.tournamentId,
            registrationId: registration!.id,
            userId: user.id,
            playerName: [user.lastName, user.firstName].filter(Boolean).join(' ') || user.nickname,
            kind: ReEntryKind.ADDON_1000,
            amount: params.amount,
            chips: params.chips,
            createdById: adminId,
          },
        });
      } else if (event === ScannerEvent.BOUNTY) {
        await tx.registration.update({
          where: { id: registration!.id },
          data: { bounties: { increment: 1 } },
        });
        await tx.playerProfile.upsert({
          where: { userId: user.id },
          update: { bounties: { increment: 1 } },
          create: { userId: user.id, xp: 0, bounties: 1 },
        });
      }

      let achievementUnlocked: AchievementCode | null = null;

      if (config.achievement) {
        achievementUnlocked = await this.achievementsService.unlock(
          tx,
          user.id,
          config.achievement,
          registration?.tournamentId ?? tournamentId ?? null,
        );

        if (achievementUnlocked) {
          await this.playerEventsService.log(tx, {
            userId: user.id,
            type: PlayerEventType.ACHIEVEMENT_UNLOCKED,
            tournamentId: registration?.tournamentId ?? tournamentId ?? null,
            performedById: adminId,
            metadata: { code: achievementUnlocked, title: ACHIEVEMENT_TITLES[achievementUnlocked] },
          });
        }
      }

      const award = await this.xpService.award(tx, {
        userId: user.id,
        amount: xpAmount,
        reason: config.xpReason,
        eventType: config.eventType,
        tournamentId: registration?.tournamentId ?? tournamentId ?? null,
        performedById: adminId,
        metadata: { label: config.label, achievementUnlocked: achievementUnlocked ?? false },
        applyToProfile: event !== ScannerEvent.BOUNTY,
      });

      return { award, achievementUnlocked };
    });

    // Каре/стрит/роял/баунти/явка меняют метрики — пересчитываем каталог достижений.
    const unlockedAchievements = await this.achievementEngine.syncForUser(user.id, {
      tournamentId: registration?.tournamentId ?? tournamentId ?? null,
      performedById: adminId,
    });

    await this.notifyPlayer(
      user,
      config.label,
      result.award.xpAwarded,
      result.award.levelUp,
      result.award.level,
      event === ScannerEvent.BOUNTY ? 'очков рейтинга' : 'XP',
    );

    for (const achievement of unlockedAchievements) {
      await this.notificationsService.notify({
        userId: user.id,
        telegramId: user.telegramId,
        type: NotificationType.SYSTEM,
        title: 'Новое достижение',
        message: `🏅 ${achievement.title}\n+${achievement.xp} XP`,
      });
    }

    return {
      xpAwarded: result.award.xpAwarded,
      totalXp: result.award.totalXp,
      level: result.award.level,
      levelUp: result.award.levelUp,
      achievementUnlocked: result.achievementUnlocked,
      unlockedAchievements,
      eventId: result.award.eventId,
    };
  }

  private async resolveRegistration(
    userId: string,
    tournamentId: string | undefined,
    config: EventConfig,
  ) {
    const registration = await this.prisma.registration.findFirst({
      where: {
        userId,
        status: { in: ACTIVE_REGISTRATION_STATUSES },
        ...(tournamentId ? { tournamentId } : {}),
      },
      orderBy: { registeredAt: 'desc' },
    });

    if (!registration && config.requiresRegistration) {
      throw new BadRequestException('У игрока нет активной регистрации на турнир');
    }

    return registration;
  }

  private async notifyPlayer(
    user: { id: string; telegramId: string },
    label: string,
    xpAwarded: number,
    levelUp: boolean,
    level: number,
    unit = 'XP',
  ): Promise<void> {
    const xpPart = xpAwarded > 0 ? ` (+${xpAwarded} ${unit})` : '';
    const levelPart = levelUp ? `\n🎉 Новый уровень: ${level}` : '';

    await this.notificationsService.notify({
      userId: user.id,
      telegramId: user.telegramId,
      type: NotificationType.SYSTEM,
      title: label,
      message: `${label}${xpPart}${levelPart}`,
    });
  }
}
