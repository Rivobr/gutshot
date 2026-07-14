import { Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramService } from './telegram.service';

export interface NotifyInput {
  userId: string;
  telegramId: string;
  type: NotificationType;
  title: string;
  message: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  /**
   * Создает запись Notification и отправляет сообщение в Telegram.
   * Запись создается всегда (история), sentAt проставляется только при успешной доставке.
   * Вызывать после коммита бизнес-транзакции.
   */
  async notify(input: NotifyInput): Promise<void> {
    const delivered = await this.telegramService.sendMessage(input.telegramId, input.message);

    await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        sentAt: delivered ? new Date() : null,
      },
    });
  }

  /**
   * Создает запись Notification внутри переданной транзакции без отправки Telegram.
   * Используется, когда доставка выполняется отдельным шагом после коммита.
   */
  async createInTransaction(
    tx: Prisma.TransactionClient,
    input: Omit<NotifyInput, 'telegramId'>,
  ): Promise<void> {
    await tx.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
      },
    });
  }
}
