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
  Prisma,
  RegistrationStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { TelegramService } from '../../telegram/telegram.service';
import {
  CreateBroadcastDto,
  CustomBroadcastButtonDto,
  UpdateBroadcastDto,
} from './dto/broadcast.dto';

type Recipient = { userId: string; telegramId: string; name: string };

type CustomButton = {
  text: string;
  type?: 'url' | 'open_app';
  url?: string;
};

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
        targetUser: {
          select: { id: true, nickname: true, firstName: true, username: true, telegramId: true },
        },
      },
    });
    return items.map((item) => this.serializeCampaign(item));
  }

  async getById(id: string) {
    const campaign = await this.prisma.broadcastCampaign.findUnique({
      where: { id },
      include: {
        tournament: { select: { id: true, title: true, date: true } },
        targetUser: {
          select: { id: true, nickname: true, firstName: true, username: true, telegramId: true },
        },
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

  async previewSegment(
    segment: BroadcastSegment,
    tournamentId?: string,
    targetUserId?: string,
  ) {
    const recipients = await this.resolveRecipients(segment, tournamentId, targetUserId);
    return {
      segment,
      tournamentId: tournamentId ?? null,
      targetUserId: targetUserId ?? null,
      count: recipients.length,
      sample: recipients.slice(0, 10),
    };
  }

  async create(dto: CreateBroadcastDto, createdById?: string) {
    const buttons = dto.buttons ?? BroadcastButtons.NONE;
    const customButtons = this.normalizeCustomButtons(dto.customButtons);
    this.assertConfig(dto.segment, buttons, dto.tournamentId, dto.targetUserId, customButtons);
    const recipients = await this.resolveRecipients(
      dto.segment,
      dto.tournamentId,
      dto.targetUserId,
    );

    const campaign = await this.prisma.broadcastCampaign.create({
      data: {
        title: dto.title.trim(),
        bodyHtml: dto.bodyHtml.trim(),
        segment: dto.segment,
        tournamentId: dto.tournamentId || null,
        targetUserId: dto.targetUserId || null,
        photoUrl: dto.photoUrl?.trim() || null,
        buttons,
        customButtons:
          buttons === BroadcastButtons.CUSTOM
            ? (customButtons as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        createdById: createdById || null,
        recipientCount: recipients.length,
        status: BroadcastStatus.DRAFT,
      },
      include: {
        tournament: { select: { id: true, title: true, date: true } },
        targetUser: {
          select: { id: true, nickname: true, firstName: true, username: true, telegramId: true },
        },
      },
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
    const targetUserId =
      dto.targetUserId === undefined ? existing.targetUserId : dto.targetUserId;
    const photoUrl = dto.photoUrl === undefined ? existing.photoUrl : dto.photoUrl;
    const customButtons =
      dto.customButtons === undefined
        ? this.readCustomButtons(existing.customButtons)
        : this.normalizeCustomButtons(dto.customButtons ?? []);

    this.assertConfig(segment, buttons, tournamentId, targetUserId, customButtons);
    const recipients = await this.resolveRecipients(segment, tournamentId, targetUserId);

    const campaign = await this.prisma.broadcastCampaign.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        bodyHtml: dto.bodyHtml?.trim(),
        segment: dto.segment,
        buttons: dto.buttons,
        tournamentId: tournamentId || null,
        targetUserId: targetUserId || null,
        photoUrl: photoUrl?.trim() || null,
        customButtons:
          buttons === BroadcastButtons.CUSTOM
            ? (customButtons as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        recipientCount: recipients.length,
      },
      include: {
        tournament: { select: { id: true, title: true, date: true } },
        targetUser: {
          select: { id: true, nickname: true, firstName: true, username: true, telegramId: true },
        },
      },
    });

    return this.serializeCampaign(campaign);
  }

  async sendTest(id: string, telegramId: string) {
    const campaign = await this.prisma.broadcastCampaign.findUnique({ where: { id } });
    if (!campaign) {
      throw new NotFoundException('Рассылка не найдена');
    }

    const result = await this.deliverOne(
      telegramId.trim(),
      campaign.bodyHtml,
      campaign.photoUrl,
      campaign.buttons,
      campaign.tournamentId,
      this.readCustomButtons(campaign.customButtons),
    );
    if (!result) {
      throw new BadRequestException(
        'Не удалось отправить тест. Проверьте Telegram ID, фото-URL и что бот не заблокирован.',
      );
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

    const customButtons = this.readCustomButtons(campaign.customButtons);
    this.assertConfig(
      campaign.segment,
      campaign.buttons,
      campaign.tournamentId,
      campaign.targetUserId,
      customButtons,
    );
    const recipients = await this.resolveRecipients(
      campaign.segment,
      campaign.tournamentId,
      campaign.targetUserId,
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
      const result = await this.deliverOne(
        recipient.telegramId,
        campaign.bodyHtml,
        campaign.photoUrl,
        campaign.buttons,
        campaign.tournamentId,
        customButtons,
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
      include: {
        tournament: { select: { id: true, title: true, date: true } },
        targetUser: {
          select: { id: true, nickname: true, firstName: true, username: true, telegramId: true },
        },
      },
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

  private async deliverOne(
    telegramId: string,
    bodyHtml: string,
    photoUrl: string | null,
    buttons: BroadcastButtons,
    tournamentId: string | null,
    customButtons: CustomButton[],
  ) {
    const markup = this.buildMarkup(buttons, tournamentId, telegramId, customButtons);
    if (photoUrl?.trim()) {
      return this.telegramService.sendPhotoDetailed(
        telegramId,
        photoUrl.trim(),
        bodyHtml,
        markup,
      );
    }
    return this.telegramService.sendMessageDetailed(telegramId, bodyHtml, markup);
  }

  private buildMarkup(
    buttons: BroadcastButtons,
    tournamentId: string | null,
    telegramId: string,
    customButtons: CustomButton[],
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
    if (buttons === BroadcastButtons.CUSTOM) {
      const mapped = customButtons.map((btn) => {
        if (btn.type === 'open_app') {
          const keyboard = this.telegramService.buildOpenAppKeyboard(telegramId) as {
            inline_keyboard: Array<Array<{ text: string; web_app?: { url: string } }>>;
          };
          const open = keyboard.inline_keyboard[0]?.[0];
          return { text: btn.text || open?.text || '♠️ Открыть клуб', web_app: open?.web_app };
        }
        return { text: btn.text, url: btn.url };
      });
      const rows: Array<typeof mapped> = [];
      for (let i = 0; i < mapped.length; i += 2) {
        rows.push(mapped.slice(i, i + 2));
      }
      return { inline_keyboard: rows };
    }
    return undefined;
  }

  private assertConfig(
    segment: BroadcastSegment,
    buttons: BroadcastButtons,
    tournamentId?: string | null,
    targetUserId?: string | null,
    customButtons: CustomButton[] = [],
  ) {
    const needsTournament =
      segment === BroadcastSegment.TOURNAMENT_REGISTERED ||
      segment === BroadcastSegment.TOURNAMENT_RSVP_PENDING ||
      buttons === BroadcastButtons.RSVP;

    if (needsTournament && !tournamentId) {
      throw new BadRequestException('Укажите турнир для этого сегмента / RSVP');
    }
    if (segment === BroadcastSegment.SINGLE_PLAYER && !targetUserId) {
      throw new BadRequestException('Выберите игрока');
    }
    if (buttons === BroadcastButtons.CUSTOM) {
      if (!customButtons.length) {
        throw new BadRequestException('Добавьте хотя бы одну свою кнопку');
      }
      for (const btn of customButtons) {
        if (!btn.text?.trim()) {
          throw new BadRequestException('У кнопки должен быть текст');
        }
        if ((btn.type ?? 'url') === 'url' && !btn.url?.trim()) {
          throw new BadRequestException(`У кнопки «${btn.text}» нужна ссылка`);
        }
      }
    }
  }

  private normalizeCustomButtons(
    buttons?: CustomBroadcastButtonDto[] | null,
  ): CustomButton[] {
    return (buttons ?? [])
      .map((btn) => ({
        text: btn.text.trim(),
        type: btn.type ?? 'url',
        url: btn.url?.trim() || undefined,
      }))
      .filter((btn) => btn.text);
  }

  private readCustomButtons(value: Prisma.JsonValue | null | undefined): CustomButton[] {
    if (!value || !Array.isArray(value)) {
      return [];
    }
    return value
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const raw = item as Record<string, unknown>;
        const text = typeof raw.text === 'string' ? raw.text : '';
        const type = raw.type === 'open_app' ? 'open_app' : 'url';
        const url = typeof raw.url === 'string' ? raw.url : undefined;
        if (!text) return null;
        return { text, type, url } as CustomButton;
      })
      .filter((item): item is CustomButton => item != null);
  }

  private async resolveRecipients(
    segment: BroadcastSegment,
    tournamentId?: string | null,
    targetUserId?: string | null,
  ): Promise<Recipient[]> {
    if (segment === BroadcastSegment.SINGLE_PLAYER) {
      if (!targetUserId) {
        throw new BadRequestException('Выберите игрока');
      }
      const user = await this.prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          telegramId: true,
          nickname: true,
          firstName: true,
          username: true,
          isBlocked: true,
        },
      });
      if (!user || user.isBlocked) {
        throw new NotFoundException('Игрок не найден или заблокирован');
      }
      if (!/^[0-9]{6,}$/.test(user.telegramId)) {
        throw new BadRequestException('У игрока нет корректного Telegram ID');
      }
      return [
        {
          userId: user.id,
          telegramId: user.telegramId,
          name: user.nickname || user.firstName || user.username || user.telegramId,
        },
      ];
    }

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
    targetUserId?: string | null;
    photoUrl?: string | null;
    buttons: BroadcastButtons;
    customButtons?: Prisma.JsonValue | null;
    status: BroadcastStatus;
    recipientCount: number;
    sentCount: number;
    failedCount: number;
    sentAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    tournament?: { id: string; title: string; date: Date } | null;
    targetUser?: {
      id: string;
      nickname: string | null;
      firstName: string | null;
      username: string | null;
      telegramId: string;
    } | null;
  }) {
    return {
      id: campaign.id,
      title: campaign.title,
      bodyHtml: campaign.bodyHtml,
      segment: campaign.segment,
      tournamentId: campaign.tournamentId,
      targetUserId: campaign.targetUserId ?? null,
      photoUrl: campaign.photoUrl ?? null,
      buttons: campaign.buttons,
      customButtons: this.readCustomButtons(campaign.customButtons),
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
      targetUser: campaign.targetUser
        ? {
            id: campaign.targetUser.id,
            name:
              campaign.targetUser.nickname ||
              campaign.targetUser.firstName ||
              campaign.targetUser.username ||
              campaign.targetUser.telegramId,
            telegramId: campaign.targetUser.telegramId,
          }
        : null,
    };
  }
}
