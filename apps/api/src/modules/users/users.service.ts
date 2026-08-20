import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramInitDataUser } from '../../common/utils/telegram-init-data.util';
import { generatePlayerQrCode } from '../../common/utils/player-qr.util';
import { isRatingExcludedUsername } from '../../common/constants/rating-exclusions';
import {
  claimPendingTelegramUser,
  isRealTelegramId,
  isTelegramUsername,
  normalizeTelegramUsername,
  pendingTelegramIdForUsername,
} from '../../common/utils/pending-telegram-user';
import { TelegramService } from '../telegram/telegram.service';

function defaultNickname(telegramUser: TelegramInitDataUser): string | null {
  const fromName = [telegramUser.first_name, telegramUser.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (fromName) {
    return fromName.slice(0, 32);
  }
  if (telegramUser.username?.trim()) {
    return telegramUser.username.trim().slice(0, 32);
  }
  return null;
}

function normalizeNickname(nickname: string): string {
  return nickname.trim().replace(/\s+/g, ' ');
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  async findByTelegramId(telegramId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { telegramId: String(telegramId) } });
  }

  /**
   * Создаёт игрока только по telegramId (кнопка бота / ticket без initData).
   * Профиль (имя, username, фото) допишется при следующем входе через initData.
   */
  async findOrCreateByTelegramId(telegramId: string): Promise<User> {
    const id = String(telegramId);
    const existing = await this.findByTelegramId(id);
    if (existing) {
      // Догружаем профиль, если неполный (тикет/админ-создание без initData).
      if (!existing.username || !existing.firstName || !existing.photoUrl) {
        void this.refreshTelegramProfileInBackground(existing.id, id);
        void this.refreshPhotoInBackground(existing.id, id);
      }
      return existing.qrCode ? existing : this.ensureQrCode(existing.id);
    }

    if (isRealTelegramId(id)) {
      const claimed = await this.claimPendingFromTelegramProfile(id);
      if (claimed) {
        return claimed.qrCode ? claimed : this.ensureQrCode(claimed.id);
      }
    }

    const nickname = await this.allocateUniqueNickname(`player_${id.slice(-6)}`);
    const created = await this.prisma.user.create({
      data: {
        telegramId: id,
        nickname,
        qrCode: generatePlayerQrCode(),
        playerProfile: { create: { xp: 0 } },
      },
    });

    void this.refreshTelegramProfileInBackground(created.id, id);
    void this.refreshPhotoInBackground(created.id, id);
    return created;
  }

  /**
   * Игрок только по @username: сначала Bot API, иначе временный tmp: id.
   * Когда человек нажмёт /start или откроет Mini App — telegramId подменится на настоящий.
   */
  async findOrCreateByUsername(rawUsername: string): Promise<User> {
    const displayUsername = rawUsername.trim().replace(/^@+/, '');
    const username = normalizeTelegramUsername(displayUsername);
    if (!isTelegramUsername(displayUsername) && !isTelegramUsername(username)) {
      throw new BadRequestException('Укажите корректный Telegram @username');
    }

    const existing = await this.prisma.user.findFirst({
      where: { username: { equals: username, mode: 'insensitive' } },
    });
    if (existing) {
      return existing.qrCode ? existing : this.ensureQrCode(existing.id);
    }

    const chat = await this.telegramService.getChatProfile(`@${username}`);
    if (chat?.telegramId && isRealTelegramId(chat.telegramId)) {
      return this.findOrCreateByTelegramId(chat.telegramId);
    }

    const pendingId = pendingTelegramIdForUsername(username);
    const alreadyPending = await this.findByTelegramId(pendingId);
    if (alreadyPending) {
      return alreadyPending.qrCode ? alreadyPending : this.ensureQrCode(alreadyPending.id);
    }

    const nickname = await this.allocateUniqueNickname(displayUsername);
    const created = await this.prisma.user.create({
      data: {
        telegramId: pendingId,
        username: displayUsername,
        nickname,
        qrCode: generatePlayerQrCode(),
        playerProfile: { create: { xp: 0 } },
      },
    });

    this.logger.log(
      `Временный игрок @${displayUsername} (${pendingId}) — синхронизируется при /start`,
    );
    return created;
  }

  /**
   * Привязывает tmp:-игрока к настоящему telegramId (webhook /start, Mini App, ticket).
   */
  async claimPendingFromTelegram(input: {
    telegramId: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  }): Promise<User | null> {
    const claimed = await claimPendingTelegramUser(this.prisma, input);
    if (!claimed || claimed.telegramId !== String(input.telegramId)) {
      return claimed;
    }

    this.logger.log(
      `Синхронизирован временный игрок @${input.username ?? claimed.username} → ${input.telegramId}`,
    );
    return claimed;
  }

  private async claimPendingFromTelegramProfile(telegramId: string): Promise<User | null> {
    const profile = await this.telegramService.getChatProfile(telegramId);
    if (!profile?.username) {
      return null;
    }

    const claimed = await this.claimPendingFromTelegram({
      telegramId,
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
    });
    if (!claimed) {
      return null;
    }

    if (!claimed.username || !claimed.firstName || !claimed.photoUrl) {
      void this.refreshTelegramProfileInBackground(claimed.id, telegramId);
      void this.refreshPhotoInBackground(claimed.id, telegramId);
    }
    return claimed;
  }

  /**
   * Догружает имя/username через Bot API для входов без initData.
   * Без этого игрок висит в админке пустым (только `player_XXXXXX`).
   */
  private async refreshTelegramProfileInBackground(
    userId: string,
    telegramId: string,
  ): Promise<void> {
    if (!isRealTelegramId(telegramId)) {
      return;
    }
    try {
      const profile = await this.telegramService.getChatProfile(telegramId);
      if (!profile || (!profile.username && !profile.firstName)) {
        return;
      }

      const current = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!current) {
        return;
      }

      const looksAutoNickname = !current.nickname || /^player_\d+$/.test(current.nickname);
      const nameFromTelegram = [profile.firstName, profile.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      const nickname =
        looksAutoNickname && nameFromTelegram
          ? await this.allocateUniqueNickname(nameFromTelegram.slice(0, 32), userId)
          : current.nickname;

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          username: current.username ?? profile.username,
          firstName: current.firstName ?? profile.firstName,
          lastName: current.lastName ?? profile.lastName,
          nickname,
          hiddenFromRating:
            current.hiddenFromRating ||
            isRatingExcludedUsername(current.username ?? profile.username),
        },
      });
    } catch {
      // не критично для входа
    }
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findOrCreateFromTelegram(telegramUser: TelegramInitDataUser): Promise<User> {
    const telegramId = String(telegramUser.id);
    let existing = await this.findByTelegramId(telegramId);
    if (!existing && telegramUser.username) {
      existing = await this.claimPendingFromTelegram({
        telegramId,
        username: telegramUser.username,
        firstName: telegramUser.first_name ?? null,
        lastName: telegramUser.last_name ?? null,
      });
    }
    // Не ждём Bot API за аватар на логине — это главный тормоз входа.
    // Берём photo_url из initData (если есть), аватар подтягиваем в фоне.
    const photoFromInit = telegramUser.photo_url ?? null;

    if (existing) {
      // Синк Telegram-профиля: обновляем поля из initData, но не затираем
      // уже известные значения пустотой. Никнейм/QR/XP не трогаем.
      const nickname =
        existing.nickname ??
        (await this.allocateUniqueNickname(defaultNickname(telegramUser), existing.id));

      const updated = await this.prisma.user.update({
        where: { id: existing.id },
        data: {
          username: telegramUser.username ?? existing.username,
          firstName: telegramUser.first_name ?? existing.firstName,
          lastName: telegramUser.last_name ?? existing.lastName,
          photoUrl: photoFromInit ?? existing.photoUrl,
          nickname,
          hiddenFromRating:
            existing.hiddenFromRating ||
            isRatingExcludedUsername(telegramUser.username ?? existing.username),
        },
      });

      void this.refreshPhotoInBackground(updated.id, telegramId);

      return updated.qrCode ? updated : this.ensureQrCode(updated.id);
    }

    const nickname = await this.allocateUniqueNickname(defaultNickname(telegramUser));

    const created = await this.prisma.user.create({
      data: {
        telegramId,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        nickname,
        photoUrl: photoFromInit,
        qrCode: generatePlayerQrCode(),
        hiddenFromRating: isRatingExcludedUsername(telegramUser.username),
        playerProfile: { create: { xp: 0 } },
      },
    });

    void this.refreshPhotoInBackground(created.id, telegramId);
    return created;
  }

  /** Фоновая подтяжка аватара — не блокирует /auth/telegram. */
  private async refreshPhotoInBackground(userId: string, telegramId: string): Promise<void> {
    if (!isRealTelegramId(telegramId)) {
      return;
    }
    try {
      const photoUrl = await this.telegramService.getUserProfilePhotoUrl(telegramId);
      if (!photoUrl) {
        return;
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: { photoUrl },
      });
    } catch {
      // ignore — аватар не критичен для входа
    }
  }

  async updateNickname(userId: string, nickname: string): Promise<User> {
    const normalized = normalizeNickname(nickname);

    if (normalized.length < 2 || normalized.length > 32) {
      throw new BadRequestException('Никнейм должен быть от 2 до 32 символов');
    }

    if (!/^[\p{L}\p{N} _.-]+$/u.test(normalized)) {
      throw new BadRequestException('Никнейм содержит недопустимые символы');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (await this.isNicknameTaken(normalized, userId)) {
      throw new ConflictException('Этот никнейм уже занят. Выберите другой');
    }

    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { nickname: normalized },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Этот никнейм уже занят. Выберите другой');
      }
      throw error;
    }
  }

  /** Проверка занятости ника без учёта регистра. */
  async isNicknameTaken(nickname: string, excludeUserId?: string): Promise<boolean> {
    const normalized = normalizeNickname(nickname);
    if (!normalized) {
      return false;
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        nickname: { equals: normalized, mode: 'insensitive' },
        ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
      },
      select: { id: true },
    });

    return Boolean(existing);
  }

  /**
   * Подбирает свободный ник: база, затем «база 2», «база 3»…
   * Нужен при автосоздании из Telegram-имени, чтобы не ломать логин.
   */
  async allocateUniqueNickname(
    base: string | null,
    excludeUserId?: string,
  ): Promise<string | null> {
    if (!base) {
      return null;
    }

    const normalized = normalizeNickname(base).slice(0, 32);
    if (normalized.length < 2) {
      return null;
    }

    for (let attempt = 0; attempt < 50; attempt += 1) {
      const suffix = attempt === 0 ? '' : ` ${attempt + 1}`;
      const candidate = `${normalized.slice(0, Math.max(1, 32 - suffix.length))}${suffix}`;

      if (!(await this.isNicknameTaken(candidate, excludeUserId))) {
        return candidate;
      }
    }

    const fallback = `${normalized.slice(0, 20)} ${Date.now().toString(36)}`.slice(0, 32);
    return fallback;
  }

  /**
   * Гарантирует наличие постоянного QR-кода. Если код уже выдан — возвращает
   * пользователя без изменений, поэтому вызов идемпотентен.
   */
  async ensureQrCode(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.qrCode) {
      return user;
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = generatePlayerQrCode();
      const taken = await this.prisma.user.findUnique({ where: { qrCode: candidate } });

      if (taken) {
        continue;
      }

      return this.prisma.user.update({ where: { id: userId }, data: { qrCode: candidate } });
    }

    throw new NotFoundException('Не удалось выдать QR-код, повторите попытку');
  }

  async findAll(params: { skip?: number; take?: number }): Promise<User[]> {
    return this.prisma.user.findMany({
      skip: params.skip,
      take: params.take,
      include: { playerProfile: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async block(userId: string): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { isBlocked: true } });
  }

  async unblock(userId: string): Promise<User> {
    return this.prisma.user.update({ where: { id: userId }, data: { isBlocked: false } });
  }

  /** Фиксирует принятие пользовательских соглашений. */
  async acceptConsent(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.consentAcceptedAt) {
      return user;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { consentAcceptedAt: new Date() },
    });
  }

  /** Сброс согласия администратором — экран приветствия покажется снова. */
  async resetConsent(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { consentAcceptedAt: null },
    });
  }
}
