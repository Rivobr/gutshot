import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  BroadcastButtons,
  BroadcastDeliveryStatus,
  BroadcastSegment,
  BroadcastStatus,
  RegistrationStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { TelegramService } from '../../telegram/telegram.service';
import { CreateBroadcastDto, UpdateBroadcastDto } from './dto/broadcast.dto';

type Recipient = { userId: string; telegramId: string; name: string };

@Injectable()
export class AdminBroadcastService {
  private readonly logger = new Logger(AdminBroadcastService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly telegramService: TelegramService,
  ) {}

  async list() {
    const items = await this.prisma.broadcastCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        tournament: { select: { id: true, title: true, date: true } },
      },
    });
    return items.map((item) => this.serializeCampaign(item));
  }

  async getById(id: string) {
    const campaign = await this.prisma.broadcastCampaign.findUnique({
      where: { id },
      include: {
        tournament: { select: { id: true, title: true, date: true } },
        deliveries: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                firstName: true,
                username: true,
                telegramId: true,
              },
            },
          },
        },
      },
    });
    if (!campaign) {
      throw new NotFoundException('Рассылка не найдена');
    }
    return {
      ...this.serializeCampaign(campaign),
      deliveries: campaign.deliveries.map((d) => ({
        id: d.id,
        userId: d.userId,
        telegramId: d.telegramId,
        status: d.status,
        telegramMessageId: d.telegramMessageId,
        chatId: d.chatId,
        error: d.error,
        sentAt: d.sentAt?.toISOString() ?? null,
        name:
          d.user.nickname ||
          d.user.firstName ||
          d.user.username ||
          d.telegramId,
      })),
    };
  }

  async previewSegment(segment: BroadcastSegment, tournamentId?: string) {
    const recipients = await this.resolveRecipients(segment, tournamentId);
    return {
      segment,
      tournamentId: tournamentId ?? null,
      count: recipients.length,
      sample: recipients.slice(0, 10),
    };
  }

  async create(dto: CreateBroadcastDto, createdById?: string) {
    this.assertSegmentButtons(dto.segment, dto.buttons ?? BroadcastButtons.NONE, dto.tournamentId);
    const recipients = await this.resolveRecipients(dto.segment, dto.tournamentId);

    const campaign = await this.prisma.broadcastCampaign.create({
      data: {
        title: dto.title.trim(),
        bodyHtml: dto.bodyHtml.trim(),
        segment: dto.segment,
        tournamentId: dto.tournamentId || null,
        buttons: dto.buttons ?? BroadcastButtons.NONE,
        createdById: createdById || null,
        recipientCount: recipients.length,
        status: BroadcastStatus.DRAFT,
      },
      include: { tournament: { select: { id: true, title: true, date: true } } },
    });

    return this.serializeCampaign(campaign);
  }

  async update(id: string, dto: UpdateBroadcastDto) {
    const existing = await this.prisma.broadcastCampaign.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Рассылка не найдена');
    }
    if (existing.status !== BroadcastStatus.DRAFT && existing.status !== BroadcastStatus.FAILED) {
      throw new BadRequestException('Можно менять только черновик');
    }

    const segment = dto.segment ?? existing.segment;
    const buttons = dto.buttons ?? existing.buttons;
    const tournamentId =
      dto.tournamentId === undefined ? existing.tournamentId : dto.tournamentId;

    this.assertSegmentButtons(segment, buttons, tournamentId ?? undefined);
    const recipients = await this.resolveRecipients(segment, tournamentId ?? undefined);

    const campaign = await this.prisma.broadcastCampaign.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        bodyHtml: dto.bodyHtml?.trim(),
        segment: dto.segment,
        buttons: dto.buttons,
        tournamentId: tournamentId || null,
        recipientCount: recipients.length,
      },
      include: { tournament: { select: { id: true, title: true, date: true } } },
    });

    return this.serializeCampaign(campaign);
  }

  async sendTest(id: string, telegramId: string) {
    const campaign = await this.prisma.broadcastCampaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException('Рассылка не найдена');
    }

    const markup = this.buildMarkup(campaign.buttons, campaign.tournamentId, telegramId);
    const result = await this.telegramService.sendMessageDetailed(
      telegramId.trim(),
      campaign.bodyHtml,
      markup,
    );
    if (!result) {
      throw new BadRequestException('Не удалось отправить тест. Проверьте Telegram ID и что бот не заблокирован.');
    }
    return {
      ok: true,
      telegramId: telegramId.trim(),
      messageId: result.messageId,
      chatId: result.chatId,
    };
  }

  async send(id: string) {
    const campaign = await this.prisma.broadcastCampaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException('Рассылка не найдена');
    }
    if (campaign.status !== BroadcastStatus.DRAFT && campaign.status !== BroadcastStatus.FAILED) {
      throw new BadRequestException('Рассылка уже отправляется или отправлена');
    }

    this.assertSegmentButtons(campaign.segment, campaign.buttons, campaign.tournamentId ?? undefined);
    const recipients = await this.resolveRecipients(
      campaign.segment,
      campaign.tournamentId ?? undefined,
    );
    if (recipients.length === 0) {
      throw new BadRequestException('Нет получателей для выбранного сегмента');
    }

    await this.prisma.broadcastDelivery.deleteMany({ where: { campaignId: id } });
    await this.prisma.broadcastDelivery.createMany({
      data: recipients.map((r) => ({
        campaignId: id,
        userId: r.userId,
        telegramId: r.telegramId,
        status: BroadcastDeliveryStatus.PENDING,
      })),
    });

    await this.prisma.broadcastCampaign.update({
      where: { id },
      data: {
        status: BroadcastStatus.SENDING,
        recipientCount: recipients.length,
        sentCount: 0,
        failedCount: 0,
      },
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      const markup = this.buildMarkup(
        campaign.buttons,
        campaign.tournamentId,
        recipient.telegramId,
      );
      const result = await this.telegramService.sendMessageDetailed(
        recipient.telegramId,
        campaign.bodyHtml,
        markup,
      );

      if (result) {
        sentCount += 1;
        await this.prisma.broadcastDelivery.updateMany({
          where: { campaignId: id, userId: recipient.userId },
          data: {
            status: BroadcastDeliveryStatus.SENT,
            telegramMessageId: result.messageId,
            chatId: String(result.chatId),
            sentAt: new Date(),
            error: null,
          },
        });
      } else {
        failedCount += 1;
        await this.prisma.broadcastDelivery.updateMany({
          where: { campaignId: id, userId: recipient.userId },
          data: {
            status: BroadcastDeliveryStatus.FAILED,
            error: 'Telegram delivery failed',
          },
        });
      }

      await new Promise((r) => setTimeout(r, 80));
    }

    const updated = await this.prisma.broadcastCampaign.update({
      where: { id },
      data: {
        status: sentCount > 0 ? BroadcastStatus.SENT : BroadcastStatus.FAILED,
        sentCount,
        failedCount,
        sentAt: new Date(),
      },
      include: { tournament: { select: { id: true, title: true, date: true } } },
    });

    this.logger.log(
      `Broadcast ${id} done sent=${sentCount} failed=${failedCount} segment=${campaign.segment}`,
    );

    return this.serializeCampaign(updated);
  }

  async deleteMessages(id: string) {
    const campaign = await this.getById(id);
    let deleted = 0;
    let failed = 0;

    for (const delivery of campaign.deliveries) {
      if (
        delivery.status !== BroadcastDeliveryStatus.SENT ||
        delivery.telegramMessageId == null ||
        !delivery.chatId
      ) {
        continue;
      }
      const ok = await this.telegramService.deleteMessage(
        delivery.chatId,
        delivery.telegramMessageId,
      );
      if (ok) {
        deleted += 1;
      } else {
        failed += 1;
      }
      await new Promise((r) => setTimeout(r, 50));
    }

    return { deleted, failed, campaignId: id };
  }

  async deleteDraft(id: string) {
    const existing = await this.prisma.broadcastCampaign.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Рассылка не найдена');
    }
    if (existing.status !== BroadcastStatus.DRAFT) {
      throw new BadRequestException('Можно удалить только черновик');
    }
    await this.prisma.broadcastCampaign.delete({ where: { id } });
    return { ok: true };
  }

  private buildMarkup(
    buttons: BroadcastButtons,
    tournamentId: string | null,
    telegramId: string,
  ): object | undefined {
    if (buttons === BroadcastButtons.OPEN_APP) {
      return this.telegramService.buildOpenAppKeyboard(telegramId);
    }
    if (buttons === BroadcastButtons.RSVP) {
      if (!tournamentId) {
        throw new BadRequestException('Для RSVP нужен tournamentId');
      }
      return this.telegramService.buildRsvpKeyboard(tournamentId);
    }
    return undefined;
  }

  private assertSegmentButtons(
    segment: BroadcastSegment,
    buttons: BroadcastButtons,
    tournamentId?: string | null,
  ) {
    const needsTournament =
      segment === BroadcastSegment.TOURNAMENT_REGISTERED ||
      segment === BroadcastSegment.TOURNAMENT_RSVP_PENDING ||
      buttons === BroadcastButtons.RSVP;

    if (needsTournament && !tournamentId) {
      throw new BadRequestException('Укажите турнир для этого сегмента / RSVP');
    }
  }

  private async resolveRecipients(
    segment: BroadcastSegment,
    tournamentId?: string | null,
  ): Promise<Recipient[]> {
    if (segment === BroadcastSegment.ALL_ACTIVE) {
      const users = await this.prisma.user.findMany({
        where: {
          isBlocked: false,
          telegramId: { not: '' },
        },
        select: {
          id: true,
          telegramId: true,
          nickname: true,
          firstName: true,
          username: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      return users
        .filter((u) => /^[0-9]{6,}$/.test(u.telegramId))
        .filter((u) => !['000000001', '999000111'].includes(u.telegramId))
        .map((u) => ({
          userId: u.id,
          telegramId: u.telegramId,
          name: u.nickname || u.firstName || u.username || u.telegramId,
        }));
    }

    if (!tournamentId) {
      throw new BadRequestException('Нужен tournamentId');
    }

    const tournament = await this.prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }

    const registrations = await this.prisma.registration.findMany({
      where: {
        tournamentId,
        status: {
          in: [RegistrationStatus.REGISTERED, RegistrationStatus.CHECKED_IN],
        },
        user: { isBlocked: false },
      },
      include: {
        user: {
          select: {
            id: true,
            telegramId: true,
            nickname: true,
            firstName: true,
            username: true,
          },
        },
      },
      orderBy: { registeredAt: 'asc' },
    });

    let list = registrations
      .filter((r) => /^[0-9]{6,}$/.test(r.user.telegramId))
      .map((r) => ({
        userId: r.user.id,
        telegramId: r.user.telegramId,
        name: r.user.nickname || r.user.firstName || r.user.username || r.user.telegramId,
      }));

    if (segment === BroadcastSegment.TOURNAMENT_RSVP_PENDING) {
      const confirms = await this.prisma.notification.findMany({
        where: {
          type: 'SYSTEM',
          title: 'RSVP: подтверждение',
          message: { contains: tournamentId },
          userId: { in: list.map((x) => x.userId) },
        },
        select: { userId: true },
      });
      const confirmed = new Set(confirms.map((c) => c.userId));
      list = list.filter((x) => !confirmed.has(x.userId));
    }

    return list;
  }

  private serializeCampaign(campaign: {
    id: string;
    title: string;
    bodyHtml: string;
    segment: BroadcastSegment;
    tournamentId: string | null;
    buttons: BroadcastButtons;
    status: BroadcastStatus;
    recipientCount: number;
    sentCount: number;
    failedCount: number;
    sentAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    tournament?: { id: string; title: string; date: Date } | null;
  }) {
    return {
      id: campaign.id,
      title: campaign.title,
      bodyHtml: campaign.bodyHtml,
      segment: campaign.segment,
      tournamentId: campaign.tournamentId,
      buttons: campaign.buttons,
      status: campaign.status,
      recipientCount: campaign.recipientCount,
      sentCount: campaign.sentCount,
      failedCount: campaign.failedCount,
      sentAt: campaign.sentAt?.toISOString() ?? null,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
      tournament: campaign.tournament
        ? {
            id: campaign.tournament.id,
            title: campaign.tournament.title,
            date: campaign.tournament.date.toISOString(),
          }
        : null,
    };
  }
}
