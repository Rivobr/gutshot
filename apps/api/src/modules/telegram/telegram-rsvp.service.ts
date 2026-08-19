import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationType,
  PlayerEventType,
  RegistrationStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from './telegram.service';

/** callback_data: rsvp:y:<tournamentId> | rsvp:n:<tournamentId> (лимит Telegram — 64 байта). */
const RSVP_CALLBACK_RE = /^rsvp:([yn]):([a-z0-9]+)$/i;

export interface TelegramCallbackQuery {
  id: string;
  data?: string;
  from?: { id?: number };
  message?: {
    message_id?: number;
    chat?: { id?: number };
    text?: string;
  };
}

/**
 * Подтверждение / отказ от участия по inline-кнопкам в Telegram.
 * «Буду» — фиксируем ответ в Notification (без CHECKED_IN, чтобы не путать с QR-явкой).
 * «Не смогу» — снимаем с турнира и поднимаем следующего из листа ожидания.
 */
@Injectable()
export class TelegramRsvpService {
  private readonly logger = new Logger(TelegramRsvpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  async handleCallback(query: TelegramCallbackQuery): Promise<void> {
    const callbackId = query.id;
    const data = query.data?.trim() ?? '';
    const telegramId = query.from?.id != null ? String(query.from.id) : '';
    const chatId = query.message?.chat?.id;
    const messageId = query.message?.message_id;
    const originalText = query.message?.text ?? '';

    const match = RSVP_CALLBACK_RE.exec(data);
    if (!match) {
      await this.telegramService.answerCallbackQuery(callbackId);
      return;
    }

    if (!telegramId || chatId == null || messageId == null) {
      await this.telegramService.answerCallbackQuery(callbackId, 'Не удалось обработать ответ');
      return;
    }

    const confirm = match[1].toLowerCase() === 'y';
    const tournamentId = match[2];

    const user = await this.prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      await this.telegramService.answerCallbackQuery(callbackId, 'Профиль не найден');
      return;
    }

    const registration = await this.prisma.registration.findUnique({
      where: { userId_tournamentId: { userId: user.id, tournamentId } },
      include: { tournament: true },
    });

    if (!registration) {
      await this.telegramService.answerCallbackQuery(callbackId, 'Вы не записаны на этот турнир');
      return;
    }

    if (confirm) {
      await this.confirm(callbackId, chatId, messageId, originalText, user.id, registration);
      return;
    }

    await this.decline(callbackId, chatId, messageId, originalText, user.id, registration);
  }

  private async confirm(
    callbackId: string,
    chatId: number,
    messageId: number,
    originalText: string,
    userId: string,
    registration: {
      id: string;
      status: RegistrationStatus;
      tournamentId: string;
      tournament: { title: string };
    },
  ): Promise<void> {
    if (
      registration.status === RegistrationStatus.CANCELLED ||
      registration.status === RegistrationStatus.FINISHED
    ) {
      await this.telegramService.answerCallbackQuery(callbackId, 'Запись уже неактивна');
      await this.telegramService.editMessageText(
        chatId,
        messageId,
        `${originalText}\n\n⚠️ Запись уже неактивна.`,
      );
      return;
    }

    const already = await this.prisma.notification.findFirst({
      where: {
        userId,
        type: NotificationType.SYSTEM,
        title: 'RSVP: подтверждение',
        message: { contains: registration.tournamentId },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (already) {
      await this.telegramService.answerCallbackQuery(callbackId, 'Уже подтверждено');
      return;
    }

    await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.SYSTEM,
        title: 'RSVP: подтверждение',
        message: `tournamentId=${registration.tournamentId}; messageId=${messageId}; chatId=${chatId}`,
        sentAt: new Date(),
      },
    });

    await this.telegramService.answerCallbackQuery(callbackId, 'Участие подтверждено');
    await this.telegramService.editMessageText(
      chatId,
      messageId,
      `${originalText}\n\n✅ Участие подтверждено. Ждём вас за столом!`,
    );
    this.logger.log(
      `RSVP yes user=${userId} tournament=${registration.tournamentId} messageId=${messageId}`,
    );
  }

  private async decline(
    callbackId: string,
    chatId: number,
    messageId: number,
    originalText: string,
    userId: string,
    registration: {
      id: string;
      status: RegistrationStatus;
      tournamentId: string;
      tournament: { title: string };
    },
  ): Promise<void> {
    if (
      registration.status === RegistrationStatus.CANCELLED ||
      registration.status === RegistrationStatus.FINISHED
    ) {
      await this.telegramService.answerCallbackQuery(callbackId, 'Вы уже сняты');
      await this.telegramService.editMessageText(
        chatId,
        messageId,
        `${originalText}\n\n❌ Запись уже отменена.`,
      );
      return;
    }

    if (
      registration.status === RegistrationStatus.PLAYING ||
      registration.status === RegistrationStatus.CHECKED_IN
    ) {
      await this.telegramService.answerCallbackQuery(
        callbackId,
        'Уже отмечены — отмену сделайте у администратора',
      );
      return;
    }

    const promoted = await this.prisma.$transaction(async (tx) => {
      const wasActiveSlot = registration.status === RegistrationStatus.REGISTERED;

      await tx.registration.update({
        where: { id: registration.id },
        data: { status: RegistrationStatus.CANCELLED, cancelledAt: new Date() },
      });

      await tx.playerEvent.create({
        data: {
          userId,
          type: PlayerEventType.TOURNAMENT_CANCELLED,
          tournamentId: registration.tournamentId,
          metadata: {
            title: registration.tournament.title,
            source: 'telegram_rsvp',
            messageId,
            chatId,
          },
        },
      });

      await tx.notification.create({
        data: {
          userId,
          type: NotificationType.SYSTEM,
          title: 'RSVP: отказ',
          message: `tournamentId=${registration.tournamentId}; messageId=${messageId}; chatId=${chatId}`,
          sentAt: new Date(),
        },
      });

      if (!wasActiveSlot) {
        return null;
      }

      const nextWaiting = await tx.registration.findFirst({
        where: {
          tournamentId: registration.tournamentId,
          status: RegistrationStatus.WAITING,
        },
        orderBy: { registeredAt: 'asc' },
        include: { user: true },
      });

      if (!nextWaiting) {
        return null;
      }

      await tx.registration.update({
        where: { id: nextWaiting.id },
        data: { status: RegistrationStatus.REGISTERED },
      });

      return nextWaiting;
    });

    await this.telegramService.answerCallbackQuery(callbackId, 'Сняли с турнира');
    await this.telegramService.editMessageText(
      chatId,
      messageId,
      `${originalText}\n\n❌ Вы сняты с турнира. Место освобождено.`,
    );

    if (promoted) {
      await this.telegramService.sendMessage(
        promoted.user.telegramId,
        this.telegramService.templates.movedFromWaiting(registration.tournament.title),
      );
    }

    this.logger.log(
      `RSVP no user=${userId} tournament=${registration.tournamentId} messageId=${messageId}`,
    );
  }
}
