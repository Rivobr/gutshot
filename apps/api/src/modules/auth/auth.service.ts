import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { verifyTelegramInitData } from '../../common/utils/telegram-init-data.util';
import {
  verifyTelegramWidgetCallback,
  TelegramWidgetUser,
} from '../../common/utils/telegram-widget.util';
import { normalizeRussianPhone } from '../../common/utils/phone.util';
import { AdminJwtPayload, JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { OtpService } from './otp.service';
import { SmsService } from './sms.service';
import { MailerService } from './mailer.service';

const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

interface WebConsents {
  offer: boolean;
  rules: boolean;
  pdn: boolean;
  media: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
    private readonly smsService: SmsService,
    private readonly mailerService: MailerService,
  ) {}

  async loginWithTelegram(initData: string) {
    const botToken = this.configService.get<string>('telegram.botToken');

    if (!botToken) {
      throw new UnauthorizedException('Telegram авторизация не настроена');
    }

    const parsed = verifyTelegramInitData(initData, botToken);

    if (!parsed) {
      throw new UnauthorizedException('Недействительная подпись Telegram');
    }

    const user = await this.usersService.findOrCreateFromTelegram(parsed.user);
    return this.issuePlayerToken(user);
  }

  /**
   * Ticket for WebViews where Telegram initData is missing (e.g. alternate HTTPS
   * front like Cloudflare quick tunnel). Issued by the bot when sending the open button.
   * Долгий TTL: старая кнопка в чате должна открывать приложение и через часы/дни.
   */
  createMiniAppTicket(telegramId: string): string {
    return this.jwtService.sign({ typ: 'miniapp_ticket', telegramId }, { expiresIn: '7d' });
  }

  async loginWithTicket(ticket: string) {
    let payload: { typ?: string; telegramId?: string };
    try {
      payload = this.jwtService.verify(ticket) as { typ?: string; telegramId?: string };
    } catch {
      throw new UnauthorizedException(
        'Ссылка входа устарела. Нажмите /start в боте и откройте новой кнопкой.',
      );
    }

    if (payload.typ !== 'miniapp_ticket' || !payload.telegramId) {
      throw new UnauthorizedException('Недействительный билет входа');
    }

    // Раньше ticket требовал уже существующего User — повторный/первый вход
    // с кнопки бота падал, пока initData не создавал профиль. Теперь создаём.
    const user = await this.usersService.findOrCreateByTelegramId(String(payload.telegramId));
    return this.issuePlayerToken(user);
  }

  private issuePlayerToken(user: {
    id: string;
    telegramId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    nickname: string | null;
    photoUrl: string | null;
    isBlocked: boolean;
  }) {
    if (user.isBlocked) {
      throw new UnauthorizedException('Пользователь заблокирован');
    }

    const jwtPayload: JwtPayload = { sub: user.id, telegramId: user.telegramId };
    const accessToken = this.jwtService.sign(jwtPayload);

    return {
      accessToken,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        nickname: user.nickname,
        photoUrl: user.photoUrl,
      },
    };
  }

  async loginAdmin(email: string, password: string) {
    // Почту вводят с телефона, где часто включена автозаглавная буква,
    // поэтому ищем без учёта регистра и лишних пробелов.
    const admin = await this.prisma.adminUser.findFirst({
      where: { email: { equals: email.trim(), mode: 'insensitive' } },
    });

    if (!admin) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const passwordValid = await compare(password, admin.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    const payload: AdminJwtPayload = { sub: admin.id, email: admin.email, role: admin.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.adminSecret'),
      expiresIn: this.configService.get<string>('jwt.adminExpiresIn'),
    });

    return {
      accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  // ═══════════════════════════════════════════════════════════
  // WEB AUTH (сайт клуба): пароль / телефон+код / Telegram
  // ═══════════════════════════════════════════════════════════

  /** Регистрация: ник + обязательная почта + пароль + согласия. Один ник — один игрок. */
  async registerWeb(input: {
    nickname: string;
    email: string;
    password: string;
    consents: WebConsents;
  }) {
    if (
      !input.consents.offer ||
      !input.consents.rules ||
      !input.consents.pdn ||
      !input.consents.media
    ) {
      throw new BadRequestException('Нужно принять все согласия: оферта, правила, ПДн, фото/видео');
    }

    if (await this.usersService.isNicknameTaken(input.nickname)) {
      throw new ConflictException('Такой ник уже занят — выберите другой');
    }
    if (await this.usersService.findByEmail(input.email)) {
      throw new ConflictException(
        'На эту почту уже есть аккаунт — войдите или восстановите пароль',
      );
    }

    const passwordHash = await hash(input.password, BCRYPT_ROUNDS);
    const user = await this.usersService.createWebPlayer({
      nickname: input.nickname,
      email: input.email,
      passwordHash,
    });

    await this.usersService.acceptConsent(user.id);
    const version = new Date().toISOString().slice(0, 10);
    await this.prisma.consentLog.createMany({
      data: [
        { userId: user.id, kind: 'OFFER', version },
        { userId: user.id, kind: 'RULES', version },
        { userId: user.id, kind: 'PDN', version },
        { userId: user.id, kind: 'MEDIA', version },
      ],
    });

    return this.issuePlayerToken(user);
  }

  /** Вход: логин = ник, почта или телефон + пароль. */
  async loginWithPassword(login: string, password: string) {
    const user = await this.usersService.findByLogin(login);

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    return this.issuePlayerToken(user);
  }

  /** Шаг 1 входа по телефону: выслать код (5 минут, повтор раз в 60с). */
  async requestPhoneCode(rawPhone: string) {
    const phone = normalizeRussianPhone(rawPhone);
    if (!phone) {
      throw new BadRequestException('Укажите номер телефона РФ, например +7 999 000-00-00');
    }

    return this.otpService.issue(phone, 'LOGIN', (to, text) => this.smsService.send(to, text));
  }

  /** Шаг 2 входа по телефону: проверить код. Нет аккаунта — создаём (ник попросят сменить). */
  async verifyPhoneCode(rawPhone: string, code: string) {
    const phone = normalizeRussianPhone(rawPhone);
    if (!phone) {
      throw new BadRequestException('Некорректный номер телефона');
    }

    await this.otpService.verify(phone, 'LOGIN', code);
    const { user, created } = await this.usersService.findOrCreateByPhone(phone);
    const token = await this.issuePlayerToken(user);

    return {
      ...token,
      needsNickname: created || /^Игрок \d{3}$/.test(user.nickname ?? ''),
    };
  }

  /**
   * «Продолжить с Telegram» на сайте. Только для уже привязанных —
   * второй игрок не создаётся.
   */
  async loginWithTelegramWidget(fields: Record<string, string>) {
    const botToken = this.configService.get<string>('telegram.botToken');
    if (!botToken) {
      throw new UnauthorizedException('Telegram авторизация не настроена');
    }

    const widgetUser: TelegramWidgetUser | null = verifyTelegramWidgetCallback(fields, botToken);
    if (!widgetUser) {
      throw new UnauthorizedException('Не удалось подтвердить вход через Telegram');
    }

    const user = await this.usersService.findByTelegramId(widgetUser.id);
    if (!user) {
      throw new UnauthorizedException(
        'Telegram не привязан к игроку. Войдите ником или телефоном и привяжите Telegram в профиле.',
      );
    }

    return this.issuePlayerToken(user);
  }

  /** Восстановление пароля: письмо со ссылкой (30 минут, одноразовая). Ответ всегда 200. */
  async forgotPassword(rawEmail: string): Promise<{ sent: true }> {
    const email = rawEmail.trim().toLowerCase();
    const user = await this.usersService.findByEmail(email);

    if (user) {
      const token = randomBytes(32).toString('hex');
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: this.sha256(token),
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const baseUrl = this.configService.get<string>('app.url') ?? 'https://gutshot.club';
      const link = `${baseUrl.replace(/\/$/, '')}/reset?token=${token}`;
      await this.mailerService.send(
        email,
        'GUTSHOT — восстановление пароля',
        [
          'Здравствуйте!',
          '',
          'Ссылка для смены пароля (действует 30 минут, одноразовая):',
          link,
          '',
          'Если это были не вы — просто игнорируйте письмо.',
          'Клуб GUTSHOT · Миллионная, 19 · +7 999 009-11-99',
        ].join('\n'),
      );
    }

    return { sent: true };
  }

  /** Установка нового пароля по одноразовому токену из письма. */
  async resetPassword(token: string, newPassword: string) {
    const row = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.sha256(token) },
    });

    if (!row || row.usedAt || row.expiresAt < new Date()) {
      throw new BadRequestException('Ссылка недействительна или устарела. Запросите новую.');
    }

    const passwordHash = await hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: row.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { ok: true };
  }

  /** Смена пароля из профиля. */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (user.passwordHash) {
      const valid = await compare(currentPassword, user.passwordHash);
      if (!valid) {
        throw new BadRequestException('Текущий пароль неверен');
      }
    }

    const passwordHash = await hash(newPassword, BCRYPT_ROUNDS);
    await this.usersService.setPasswordHash(userId, passwordHash);
    return { ok: true };
  }

  /** Код для привязки Telegram: игрок вводит в боте команду /link <код>. */
  createTelegramLinkCode(userId: string): string {
    return this.jwtService.sign({ typ: 'tg_link', sub: userId }, { expiresIn: '15m' });
  }

  /** Привязка Telegram по коду из бота (вызывается webhook-ом). */
  async linkTelegramByCode(code: string, chatId: string, username?: string | null) {
    let payload: { typ?: string; sub?: string };
    try {
      payload = this.jwtService.verify(code) as { typ?: string; sub?: string };
    } catch {
      throw new BadRequestException('Код привязки неверен или устарел. Получите новый на сайте.');
    }

    if (payload.typ !== 'tg_link' || !payload.sub) {
      throw new BadRequestException('Код привязки неверен');
    }

    const user = await this.usersService.linkTelegram(payload.sub, chatId, username);
    return this.issuePlayerToken(user);
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
