import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  NotificationType,
  PlayerEventType,
  Prisma,
  RegistrationStatus,
  TournamentStatus,
  XPReason,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { TelegramService } from '../../telegram/telegram.service';
import { NotificationsService } from '../../telegram/notifications.service';
import { getXpForPlace } from '../../../common/constants/xp.constants';
import { xpSettingKeyForPlace } from '../../../common/constants/xp-defaults.constants';
import { XpService } from '../../progression/xp.service';
import { XpSettingsService } from '../../progression/xp-settings.service';
import { LevelsService } from '../../progression/levels.service';
import { AchievementEngineService } from '../../progression/achievement-engine.service';
import { PlayerEventsService } from '../../progression/player-events.service';
import { UsersService } from '../../users/users.service';
import { isTelegramUsername } from '../../../common/utils/pending-telegram-user';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto, UpdateTournamentLiveDto } from './dto/update-tournament.dto';
import { TournamentResultEntryDto } from './dto/finish-tournament.dto';
import { ClockActionDto, UpdateBlindStructureDto } from './dto/blind-structure.dto';
import { serializeClock, serializeTournament } from '../../tournaments/tournament.serializer';
import { resolveBlindStructureTemplate } from '../../tournaments/tournament-clock';
import {
  SCHEDULE_TEMPLATE_BUY_IN,
  SCHEDULE_TEMPLATE_MAX_PLAYERS,
  planScheduleTemplateWeek,
  resolveScheduleTemplateWeekStart,
  type ScheduleTemplatePlanDto,
  type ScheduleTemplateSlotDto,
} from './schedule-template';

/** Статусы регистраций, которые учитываются в итоговых местах турнира. */
const RESULT_ELIGIBLE_STATUSES: RegistrationStatus[] = [
  RegistrationStatus.REGISTERED,
  RegistrationStatus.CHECKED_IN,
  RegistrationStatus.PLAYING,
  RegistrationStatus.FINISHED,
];

/** Статусы турнира, в которые админ может вручную добавить игрока. */
const ADMIN_ADD_ALLOWED_STATUSES: TournamentStatus[] = [
  TournamentStatus.DRAFT,
  TournamentStatus.REGISTRATION_OPEN,
  TournamentStatus.REGISTRATION_CLOSED,
  TournamentStatus.IN_PROGRESS,
];

@Injectable()
export class AdminTournamentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
    private readonly notificationsService: NotificationsService,
    private readonly xpService: XpService,
    private readonly xpSettingsService: XpSettingsService,
    private readonly levelsService: LevelsService,
    private readonly achievementEngine: AchievementEngineService,
    private readonly usersService: UsersService,
    private readonly playerEventsService: PlayerEventsService,
  ) {}

  async findAll() {
    const rows = await this.prisma.tournament.findMany({
      orderBy: { date: 'desc' },
      include: { blindLevels: true, _count: { select: { registrations: true } } },
    });
    return rows.map(serializeTournament);
  }

  async previewScheduleTemplate() {
    return this.resolveScheduleTemplatePlan();
  }

  /**
   * Ставит шаблонное расписание клуба (ср 19:00 / пт 19:00 / сб 18:00)
   * на ближайшую неделю, где этих турниров ещё нет.
   */
  async applyScheduleTemplate() {
    const plan = await this.resolveScheduleTemplatePlan();
    const toCreate = plan.slots.filter((slot) => !slot.exists);
    if (toCreate.length === 0) {
      throw new BadRequestException('Шаблон на ближайшие недели уже стоит');
    }

    const created: { id: string; title: string; date: string }[] = [];
    for (const slot of toCreate) {
      const tournament = await this.prisma.tournament.create({
        data: {
          title: slot.title,
          description: slot.description,
          date: new Date(slot.date),
          buyIn: SCHEDULE_TEMPLATE_BUY_IN,
          maxPlayers: SCHEDULE_TEMPLATE_MAX_PLAYERS,
          status: TournamentStatus.REGISTRATION_OPEN,
        },
      });
      await this.applyDefaultStructure(tournament.id, 'club');
      created.push({
        id: tournament.id,
        title: tournament.title,
        date: tournament.date.toISOString(),
      });
    }

    return {
      ...plan,
      created,
    };
  }

  private async resolveScheduleTemplatePlan(): Promise<ScheduleTemplatePlanDto> {
    let weekStart = resolveScheduleTemplateWeekStart();

    for (let week = 0; week < 8; week += 1) {
      const planned = planScheduleTemplateWeek(weekStart);
      const slots: ScheduleTemplateSlotDto[] = [];

      for (const slot of planned) {
        const existing = await this.findScheduleTemplateCollision(slot.date);
        slots.push({
          weekday: slot.weekday,
          title: slot.title,
          description: slot.description,
          date: slot.date.toISOString(),
          exists: Boolean(existing),
          existingId: existing?.id ?? null,
        });
      }

      if (slots.some((slot) => !slot.exists)) {
        return {
          weekStart: weekStart.toISOString(),
          slots,
        };
      }

      weekStart = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    throw new BadRequestException('Шаблон уже стоит на ближайшие 8 недель');
  }

  private async findScheduleTemplateCollision(date: Date) {
    const windowMs = 30 * 60 * 1000;
    return this.prisma.tournament.findFirst({
      where: {
        date: {
          gte: new Date(date.getTime() - windowMs),
          lte: new Date(date.getTime() + windowMs),
        },
        status: { not: TournamentStatus.ARCHIVED },
      },
      select: { id: true },
    });
  }

  async findById(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: { blindLevels: true, _count: { select: { registrations: true } } },
    });

    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }

    return serializeTournament(tournament);
  }

  /** Структура блайндов и состояние часов для панели управления. */
  async getClock(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: { blindLevels: true },
    });

    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }

    const levels = [...tournament.blindLevels].sort((a, b) => a.idx - b.idx);

    return {
      clock: serializeClock(tournament, levels),
      levels: levels.map((level) => ({
        idx: level.idx,
        isBreak: level.isBreak,
        smallBlind: level.smallBlind,
        bigBlind: level.bigBlind,
        ante: level.ante,
        durationSec: level.durationSec,
      })),
    };
  }

  /** Перезаписывает структуру уровней целиком (задаётся один раз до турнира). */
  async updateBlindStructure(id: string, dto: UpdateBlindStructureDto) {
    await this.findById(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.blindLevel.deleteMany({ where: { tournamentId: id } });
      await tx.blindLevel.createMany({
        data: dto.levels.map((level, idx) => ({
          tournamentId: id,
          idx,
          isBreak: Boolean(level.isBreak),
          smallBlind: level.isBreak ? null : (level.smallBlind ?? null),
          bigBlind: level.isBreak ? null : (level.bigBlind ?? null),
          ante: level.isBreak ? null : (level.ante ?? null),
          durationSec: level.durationSec,
        })),
      });
    });

    return this.getClock(id);
  }

  /** Заполняет структуру именованным шаблоном (`classic20` | `club`). */
  async applyDefaultStructure(id: string, template: string = 'classic20') {
    await this.findById(id);
    const levels = resolveBlindStructureTemplate(template);

    await this.prisma.$transaction(async (tx) => {
      await tx.blindLevel.deleteMany({ where: { tournamentId: id } });
      await tx.blindLevel.createMany({
        data: levels.map((level) => ({ ...level, tournamentId: id })),
      });
    });

    return this.getClock(id);
  }

  /** Запуск часов: дальше уровни и перерывы переключаются сами. */
  async startClock(id: string, dto: ClockActionDto = {}) {
    const { levels } = await this.getClock(id);

    if (levels.length === 0) {
      throw new BadRequestException('Сначала задайте структуру блайндов');
    }

    await this.prisma.tournament.update({
      where: { id },
      data: {
        clockStatus: 'RUNNING',
        clockStartedAt: new Date(),
        clockLevelIdx: dto.levelIdx ?? 0,
        clockPausedAt: null,
        liveIsRunning: true,
        livePlayersIn: dto.playersIn ?? undefined,
        liveUpdatedAt: new Date(),
      },
    });

    return this.getClock(id);
  }

  async pauseClock(id: string) {
    const { clock } = await this.getClock(id);

    if (clock.status !== 'RUNNING') {
      throw new BadRequestException('Часы не запущены');
    }

    await this.prisma.tournament.update({
      where: { id },
      // Фиксируем уровень и остаток, чтобы после снятия паузы продолжить с него.
      data: {
        clockStatus: 'PAUSED',
        clockPausedAt: new Date(),
        clockLevelIdx: clock.current?.idx ?? 0,
        clockStartedAt: clock.levelEndsAt
          ? new Date(
              new Date(clock.levelEndsAt).getTime() - (clock.current?.durationSec ?? 0) * 1000,
            )
          : undefined,
        liveUpdatedAt: new Date(),
      },
    });

    return this.getClock(id);
  }

  async resumeClock(id: string) {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: { blindLevels: true },
    });

    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }

    if (tournament.clockStatus !== 'PAUSED' || !tournament.clockPausedAt) {
      throw new BadRequestException('Часы не на паузе');
    }

    // Сдвигаем старт уровня на длину простоя — остаток времени сохраняется.
    const pausedMs = Date.now() - tournament.clockPausedAt.getTime();

    await this.prisma.tournament.update({
      where: { id },
      data: {
        clockStatus: 'RUNNING',
        clockPausedAt: null,
        clockStartedAt: tournament.clockStartedAt
          ? new Date(tournament.clockStartedAt.getTime() + pausedMs)
          : new Date(),
        liveIsRunning: true,
        liveUpdatedAt: new Date(),
      },
    });

    return this.getClock(id);
  }

  /** Перейти на уровень вручную (пропустить или вернуться). */
  async setClockLevel(id: string, levelIdx: number) {
    const { levels } = await this.getClock(id);

    if (levelIdx < 0 || levelIdx >= levels.length) {
      throw new BadRequestException('Уровень вне структуры');
    }

    await this.prisma.tournament.update({
      where: { id },
      data: {
        clockLevelIdx: levelIdx,
        clockStartedAt: new Date(),
        clockPausedAt: null,
        clockStatus: 'RUNNING',
        liveIsRunning: true,
        liveUpdatedAt: new Date(),
      },
    });

    return this.getClock(id);
  }

  async stopClock(id: string) {
    await this.findById(id);

    await this.prisma.tournament.update({
      where: { id },
      data: {
        clockStatus: 'IDLE',
        clockStartedAt: null,
        clockPausedAt: null,
        clockLevelIdx: 0,
        liveIsRunning: false,
        liveUpdatedAt: new Date(),
      },
    });

    return this.getClock(id);
  }

  async create(dto: CreateTournamentDto) {
    const created = await this.prisma.tournament.create({
      data: {
        title: dto.title,
        description: dto.description,
        date: new Date(dto.date),
        buyIn: dto.buyIn,
        maxPlayers: dto.maxPlayers,
        imageUrl: dto.imageUrl || undefined,
        registrationOpen: dto.registrationOpen ? new Date(dto.registrationOpen) : undefined,
        registrationClose: dto.registrationClose ? new Date(dto.registrationClose) : undefined,
      },
      include: { blindLevels: true, _count: { select: { registrations: true } } },
    });
    return serializeTournament(created);
  }

  async update(id: string, dto: UpdateTournamentDto) {
    await this.findById(id);
    const updated = await this.prisma.tournament.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        buyIn: dto.buyIn,
        maxPlayers: dto.maxPlayers,
        imageUrl: dto.imageUrl === '' ? null : dto.imageUrl,
        date: dto.date ? new Date(dto.date) : undefined,
        registrationOpen: dto.registrationOpen ? new Date(dto.registrationOpen) : undefined,
        registrationClose: dto.registrationClose ? new Date(dto.registrationClose) : undefined,
      },
      include: { blindLevels: true, _count: { select: { registrations: true } } },
    });
    return serializeTournament(updated);
  }

  async updateLive(id: string, dto: UpdateTournamentLiveDto) {
    await this.findById(id);
    const updated = await this.prisma.tournament.update({
      where: { id },
      data: {
        liveIsRunning: dto.isRunning ?? undefined,
        liveLevel: dto.level ?? undefined,
        liveSmallBlind: dto.smallBlind ?? undefined,
        liveBigBlind: dto.bigBlind ?? undefined,
        liveAnte: dto.ante ?? undefined,
        liveNextBreakInSec: dto.nextBreakInSec ?? undefined,
        livePlayersIn: dto.playersIn ?? undefined,
        liveUpdatedAt: new Date(),
      },
      include: { blindLevels: true, _count: { select: { registrations: true } } },
    });
    return serializeTournament(updated);
  }

  /**
   * Удаляет турнир вместе с регистрациями и результатами.
   * История игроков (PlayerEvent / XPHistory) сохраняется — связь с турниром обнуляется.
   */
  async remove(id: string): Promise<void> {
    await this.findById(id);

    await this.prisma.$transaction(async (tx) => {
      const registrations = await tx.registration.findMany({
        where: { tournamentId: id },
        select: { id: true },
      });
      const registrationIds = registrations.map((item) => item.id);

      if (registrationIds.length > 0) {
        await tx.qRToken.deleteMany({ where: { registrationId: { in: registrationIds } } });
      }

      const results = await tx.tournamentResult.findMany({
        where: { tournamentId: id },
        select: { id: true },
      });
      const resultIds = results.map((item) => item.id);

      if (resultIds.length > 0) {
        await tx.xPHistory.updateMany({
          where: { tournamentResultId: { in: resultIds } },
          data: { tournamentResultId: null },
        });
      }

      await tx.tournamentResult.deleteMany({ where: { tournamentId: id } });
      await tx.registration.deleteMany({ where: { tournamentId: id } });
      await tx.playerEvent.updateMany({
        where: { tournamentId: id },
        data: { tournamentId: null },
      });
      await tx.tournament.delete({ where: { id } });
    });
  }

  async archive(id: string) {
    const tournament = await this.findById(id);

    if (tournament.status === TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Сначала завершите турнир, затем архивируйте');
    }

    return this.prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.ARCHIVED },
    });
  }

  async openRegistration(id: string) {
    await this.findById(id);
    return this.prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.REGISTRATION_OPEN },
    });
  }

  async closeRegistration(id: string) {
    await this.findById(id);
    return this.prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.REGISTRATION_CLOSED },
    });
  }

  async start(id: string) {
    const tournament = await this.findById(id);

    if (tournament.status === TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Турнир уже начат');
    }

    const levels = await this.prisma.blindLevel.count({ where: { tournamentId: id } });

    return this.prisma.$transaction(async (tx) => {
      await tx.registration.updateMany({
        where: { tournamentId: id, status: RegistrationStatus.CHECKED_IN },
        data: { status: RegistrationStatus.PLAYING },
      });

      return tx.tournament.update({
        where: { id },
        data: {
          status: TournamentStatus.IN_PROGRESS,
          // Есть структура — часы стартуют вместе с турниром, админу ничего не нажимать.
          ...(levels > 0
            ? {
                clockStatus: 'RUNNING' as const,
                clockStartedAt: new Date(),
                clockLevelIdx: 0,
                clockPausedAt: null,
                liveIsRunning: true,
                liveUpdatedAt: new Date(),
              }
            : {}),
        },
      });
    });
  }

  /**
   * Админ добавляет игрока в турнир по Telegram ID / @username / никнейму.
   * Числовой ID — find-or-create; username/ник — поиск среди игроков клуба
   * (+ resolve @username через Bot API, если человек писал боту).
   */
  async addPlayerByQuery(tournamentId: string, rawQuery: string) {
    const query = String(rawQuery ?? '').trim();
    if (!query) {
      throw new BadRequestException('Укажите Telegram ID, @username или никнейм');
    }

    const tournament = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }

    if (!ADMIN_ADD_ALLOWED_STATUSES.includes(tournament.status)) {
      throw new BadRequestException('В этот турнир нельзя добавить игрока');
    }

    const user = await this.resolvePlayerForAdminAdd(query);
    if (user.isBlocked) {
      throw new BadRequestException('Игрок заблокирован');
    }

    const existing = await this.prisma.registration.findUnique({
      where: { userId_tournamentId: { userId: user.id, tournamentId } },
    });

    if (existing && existing.status !== RegistrationStatus.CANCELLED) {
      throw new ConflictException('Игрок уже зарегистрирован на этот турнир');
    }

    const activeCount = await this.prisma.registration.count({
      where: {
        tournamentId,
        status: { in: [RegistrationStatus.REGISTERED, RegistrationStatus.CHECKED_IN] },
      },
    });

    const hasFreeSlot = activeCount < tournament.maxPlayers;
    const status = hasFreeSlot ? RegistrationStatus.REGISTERED : RegistrationStatus.WAITING;

    await this.prisma.registration.upsert({
      where: { userId_tournamentId: { userId: user.id, tournamentId } },
      update: { status, cancelledAt: null, registeredAt: new Date() },
      create: { userId: user.id, tournamentId, status },
    });

    await this.playerEventsService.record({
      userId: user.id,
      type: PlayerEventType.TOURNAMENT_REGISTRATION,
      tournamentId,
      metadata: {
        status,
        title: tournament.title,
        source: 'admin',
        query,
      },
    });

    if (status === RegistrationStatus.REGISTERED) {
      await this.notificationsService.notify({
        userId: user.id,
        telegramId: user.telegramId,
        type: NotificationType.REGISTRATION,
        title: 'Регистрация подтверждена',
        message: this.telegramService.templates.registrationSuccess(tournament.title),
      });
    } else {
      await this.notificationsService.notify({
        userId: user.id,
        telegramId: user.telegramId,
        type: NotificationType.REGISTRATION,
        title: 'Лист ожидания',
        message: `⏳ Свободных мест нет. Вы поставлены в лист ожидания турнира «${tournament.title}».`,
      });
    }

    return this.getRegistrations(tournamentId);
  }

  /** @deprecated используйте addPlayerByQuery */
  async addPlayerByTelegramId(tournamentId: string, telegramId: string) {
    return this.addPlayerByQuery(tournamentId, telegramId);
  }

  private async resolvePlayerForAdminAdd(query: string) {
    const normalized = query.trim();

    if (/^\d{5,20}$/.test(normalized)) {
      return this.usersService.findOrCreateByTelegramId(normalized);
    }

    const username = normalized.replace(/^@+/, '').trim();
    if (!username) {
      throw new BadRequestException('Укажите Telegram ID, @username или никнейм');
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

    // Bot API умеет getChat(@username), если пользователь доступен боту.
    // Если ещё не жал /start — заводим временного игрока, telegramId подтянется позже.
    if (isTelegramUsername(username)) {
      return this.usersService.findOrCreateByUsername(username);
    }

    throw new NotFoundException(
      'Игрок не найден. Укажите числовой Telegram ID, @username или точный никнейм из клуба',
    );
  }

  /** Список зарегистрированных игроков с уровнем, XP и статусом явки. */
  async getRegistrations(tournamentId: string) {
    await this.findById(tournamentId);

    const [registrations, thresholds] = await Promise.all([
      this.prisma.registration.findMany({
        where: { tournamentId },
        include: { user: { include: { playerProfile: true } } },
        orderBy: [{ place: { sort: 'asc', nulls: 'last' } }, { registeredAt: 'asc' }],
      }),
      this.levelsService.getThresholds(),
    ]);

    return registrations.map((registration) => {
      const xp = registration.user.playerProfile?.xp ?? 0;

      return {
        id: registration.id,
        status: registration.status,
        registeredAt: registration.registeredAt,
        arrivedAt: registration.arrivedAt,
        attendanceXpGiven: registration.attendanceXpGiven,
        eliminatedAt: registration.eliminatedAt,
        place: registration.place,
        reEntries: registration.reEntries,
        bounties: registration.bounties,
        user: {
          id: registration.user.id,
          telegramId: registration.user.telegramId,
          username: registration.user.username,
          firstName: registration.user.firstName,
          lastName: registration.user.lastName,
          nickname: registration.user.nickname,
          photoUrl: registration.user.photoUrl,
          qrCode: registration.user.qrCode,
          xp,
          level: this.levelsService.computeProgress(thresholds, xp).level,
        },
      };
    });
  }

  /**
   * Проставить или сбросить место игрока во время турнира.
   * XP не начисляется — только при finish.
   */
  async setPlace(tournamentId: string, registrationId: string, place: number | null) {
    const tournament = await this.findById(tournamentId);

    if (
      tournament.status !== TournamentStatus.IN_PROGRESS &&
      tournament.status !== TournamentStatus.REGISTRATION_CLOSED
    ) {
      throw new BadRequestException('Места можно менять только в активном турнире');
    }

    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration || registration.tournamentId !== tournamentId) {
      throw new NotFoundException('Регистрация не найдена в этом турнире');
    }

    if (!RESULT_ELIGIBLE_STATUSES.includes(registration.status)) {
      throw new BadRequestException('Этому игроку нельзя назначить место');
    }

    if (place !== null) {
      const conflict = await this.prisma.registration.findFirst({
        where: {
          tournamentId,
          place,
          id: { not: registrationId },
        },
      });

      if (conflict) {
        throw new BadRequestException(`Место ${place} уже занято другим игроком`);
      }
    }

    await this.prisma.registration.update({
      where: { id: registrationId },
      data: {
        place,
        eliminatedAt: place === null ? null : (registration.eliminatedAt ?? new Date()),
      },
    });

    return this.getRegistrations(tournamentId);
  }

  /**
   * Игрок выбыл: автоматически ставит следующее свободное место с конца
   * (первый вылет при 30 игроках → 30 место).
   */
  async eliminate(tournamentId: string, registrationId: string) {
    const tournament = await this.findById(tournamentId);

    if (tournament.status !== TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Отметить выбытие можно только во время турнира');
    }

    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration || registration.tournamentId !== tournamentId) {
      throw new NotFoundException('Регистрация не найдена в этом турнире');
    }

    if (!RESULT_ELIGIBLE_STATUSES.includes(registration.status)) {
      throw new BadRequestException('Этому игроку нельзя назначить место');
    }

    if (registration.place != null) {
      return this.getRegistrations(tournamentId);
    }

    const place = await this.computeNextEliminationPlace(tournamentId, registrationId);

    await this.prisma.registration.update({
      where: { id: registrationId },
      data: {
        place,
        eliminatedAt: new Date(),
      },
    });

    return this.getRegistrations(tournamentId);
  }

  /**
   * Следующее место при выбытии: свободное место с конца поля.
   * Если часть мест уже занята вручную / после ре-энтри — пропускаем конфликты
   * (11 игроков, заняты 7–10 → следующий вылет получит 11, затем 6…).
   */
  async computeNextEliminationPlace(
    tournamentId: string,
    registrationId: string,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<number> {
    const registrations = await client.registration.findMany({
      where: {
        tournamentId,
        status: { in: RESULT_ELIGIBLE_STATUSES },
      },
      select: { id: true, place: true, arrivedAt: true, status: true },
    });

    const fieldPlayers = registrations.filter(
      (row) =>
        row.id === registrationId ||
        row.place != null ||
        row.arrivedAt != null ||
        row.status === RegistrationStatus.PLAYING ||
        row.status === RegistrationStatus.FINISHED,
    );

    const stillInCount = fieldPlayers.filter((row) => row.place == null).length;

    if (stillInCount < 1) {
      throw new BadRequestException('Некого отмечать выбывшим');
    }

    const takenPlaces = new Set(
      fieldPlayers
        .filter((row) => row.place != null && row.id !== registrationId)
        .map((row) => row.place as number),
    );

    let place = Math.max(fieldPlayers.length, stillInCount, ...takenPlaces, 0);
    while (place >= 1 && takenPlaces.has(place)) {
      place -= 1;
    }

    if (place < 1) {
      throw new BadRequestException(
        'Нет свободного места. Проставьте места вручную или сбросьте конфликт.',
      );
    }

    return place;
  }

  /** Применить авто-место внутри чужой транзакции (сканер ELIMINATED). */
  async applyEliminationPlaceInTx(
    tx: Prisma.TransactionClient,
    registrationId: string,
  ): Promise<number | null> {
    const registration = await tx.registration.findUnique({ where: { id: registrationId } });

    if (!registration) {
      return null;
    }

    if (registration.place != null) {
      await tx.registration.update({
        where: { id: registrationId },
        data: { eliminatedAt: registration.eliminatedAt ?? new Date() },
      });
      return registration.place;
    }

    const place = await this.computeNextEliminationPlace(
      registration.tournamentId,
      registrationId,
      tx,
    );

    await tx.registration.update({
      where: { id: registrationId },
      data: { place, eliminatedAt: new Date() },
    });

    return place;
  }

  async finish(id: string, results: TournamentResultEntryDto[], adminId: string) {
    const tournament = await this.findById(id);

    if (tournament.status !== TournamentStatus.IN_PROGRESS) {
      throw new BadRequestException('Турнир не находится в процессе игры');
    }

    if (results.length === 0) {
      throw new BadRequestException('Укажите места игроков');
    }

    const places = results.map((item) => item.place);
    if (new Set(places).size !== places.length) {
      throw new BadRequestException('Места игроков должны быть уникальными');
    }

    if (places.some((place) => !Number.isInteger(place) || place < 1)) {
      throw new BadRequestException('Место должно быть целым числом от 1');
    }

    const xpSettings = await this.xpSettingsService.getAll();

    const finishedPlayers = await this.prisma.$transaction(async (tx) => {
      const processed: {
        userId: string;
        telegramId: string;
        title: string;
        place: number;
        xp: number;
        newLevel: number;
      }[] = [];

      for (const entry of results) {
        const registration = await tx.registration.findUnique({
          where: { id: entry.registrationId },
          include: { user: true },
        });

        if (!registration || registration.tournamentId !== id) {
          throw new BadRequestException(
            `Регистрация ${entry.registrationId} не найдена в этом турнире`,
          );
        }

        // Места 1–30 берутся из настраиваемой таблицы XP.
        // Ниже 30 места XP за место не начисляется, но турнир идёт в зачёт достижений.
        const settingKey = xpSettingKeyForPlace(entry.place);
        const xpEarned = settingKey ? xpSettings[settingKey] : getXpForPlace(entry.place);

        const result = await tx.tournamentResult.upsert({
          where: { userId_tournamentId: { userId: registration.userId, tournamentId: id } },
          update: { place: entry.place, xpEarned },
          create: {
            userId: registration.userId,
            tournamentId: id,
            place: entry.place,
            xpEarned,
          },
        });

        await tx.registration.update({
          where: { id: registration.id },
          data: {
            status: RegistrationStatus.FINISHED,
            place: entry.place,
            eliminatedAt: registration.eliminatedAt ?? new Date(),
          },
        });

        const award = await this.xpService.award(tx, {
          userId: registration.userId,
          amount: xpEarned,
          reason: entry.place === 1 ? XPReason.TOURNAMENT_WIN : XPReason.TOURNAMENT_PLACE,
          eventType: PlayerEventType.TOURNAMENT_RESULT,
          tournamentId: id,
          tournamentResultId: result.id,
          performedById: adminId,
          metadata: { place: entry.place, title: tournament.title },
        });

        processed.push({
          userId: registration.userId,
          telegramId: registration.user.telegramId,
          title: tournament.title,
          place: entry.place,
          xp: xpEarned,
          newLevel: award.level,
        });
      }

      await tx.tournament.update({ where: { id }, data: { status: TournamentStatus.FINISHED } });

      return processed;
    });

    for (const player of finishedPlayers) {
      await this.notificationsService.notify({
        userId: player.userId,
        telegramId: player.telegramId,
        type: NotificationType.TOURNAMENT_RESULT,
        title: 'Результаты турнира',
        message: this.telegramService.templates.tournamentFinished(
          player.title,
          player.place,
          player.xp,
        ),
      });

      // Победы, финальные столы, сыгранные турниры, серии — считаются после результата.
      const unlocked = await this.achievementEngine.syncForUser(player.userId, {
        tournamentId: id,
        performedById: adminId,
      });

      for (const achievement of unlocked) {
        await this.notificationsService.notify({
          userId: player.userId,
          telegramId: player.telegramId,
          type: NotificationType.SYSTEM,
          title: 'Новое достижение',
          message: `🏅 ${achievement.title}\n+${achievement.xp} XP`,
        });
      }
    }

    return this.findById(id);
  }
}
