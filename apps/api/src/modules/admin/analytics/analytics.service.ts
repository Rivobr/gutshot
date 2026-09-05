import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ReEntryKind } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { AnalyticsQueryDto, CreateShiftEntryDto, UpdateShiftEntryDto } from './dto/analytics.dto';

const RE_ENTRY_KINDS: ReEntryKind[] = [
  ReEntryKind.RE_ENTRY_1000,
  ReEntryKind.RE_ENTRY_1500,
  ReEntryKind.ADDON_1000,
];

/** Границы месяца [начало, конец) по строке YYYY-MM (по местному времени сервера). */
function monthRange(month?: string): { from: Date; to: Date; month: string } {
  const normalized = month && /^\d{4}-\d{2}$/.test(month) ? month : null;
  const now = new Date();
  const year = normalized ? Number(normalized.slice(0, 4)) : now.getFullYear();
  const monthIdx = normalized ? Number(normalized.slice(5, 7)) - 1 : now.getMonth();

  if (normalized && (monthIdx < 0 || monthIdx > 11 || year < 2000 || year > 2200)) {
    throw new BadRequestException('Некорректный месяц. Формат: YYYY-MM');
  }

  const from = new Date(year, monthIdx, 1);
  const to = new Date(year, monthIdx + 1, 1);

  return { from, to, month: `${year}-${String(monthIdx + 1).padStart(2, '0')}` };
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Смены за месяц: записи, общий итог и разбивка по сотрудникам. */
  async getShifts(query: AnalyticsQueryDto) {
    const { from, to, month } = monthRange(query.month);

    const entries = await this.prisma.shiftEntry.findMany({
      where: { date: { gte: from, lt: to } },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    const total = entries.reduce((sum, entry) => sum + entry.amount, 0);

    const byNameMap = new Map<string, { name: string; total: number; days: number }>();
    for (const entry of entries) {
      const current = byNameMap.get(entry.name) ?? { name: entry.name, total: 0, days: 0 };
      current.total += entry.amount;
      current.days += 1;
      byNameMap.set(entry.name, current);
    }

    return {
      month,
      entries,
      total,
      byName: [...byNameMap.values()].sort((a, b) => b.total - a.total),
    };
  }

  async createShift(dto: CreateShiftEntryDto, adminId: string) {
    return this.prisma.shiftEntry.create({
      data: {
        name: dto.name.trim(),
        date: new Date(dto.date),
        amount: dto.amount,
        note: dto.note ?? null,
        createdById: adminId,
      },
    });
  }

  async updateShift(id: string, dto: UpdateShiftEntryDto) {
    await this.ensureShiftExists(id);
    return this.prisma.shiftEntry.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
        ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
        ...(dto.note !== undefined ? { note: dto.note } : {}),
      },
    });
  }

  async deleteShift(id: string) {
    await this.ensureShiftExists(id);
    await this.prisma.shiftEntry.delete({ where: { id } });
    return { ok: true };
  }

  /** Ре-энтри/аддоны за месяц (или по турниру): агрегаты по видам и выручка. */
  async getReEntries(query: AnalyticsQueryDto & { tournamentId?: string }) {
    if (query.tournamentId) {
      return this.getReEntriesForTournament(query.tournamentId);
    }

    const { from, to, month } = monthRange(query.month);

    const logs = await this.prisma.reEntryLog.findMany({
      where: { createdAt: { gte: from, lt: to } },
      include: {
        tournament: { select: { id: true, title: true, date: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const byKind = this.emptyKindMap();
    for (const log of logs) {
      byKind[log.kind].count += 1;
      byKind[log.kind].revenue += log.amount;
    }

    const byTournamentMap = new Map<
      string,
      {
        tournamentId: string;
        tournamentTitle: string;
        tournamentDate: Date;
        counts: Record<ReEntryKind, { count: number; revenue: number }>;
        revenue: number;
      }
    >();
    for (const log of logs) {
      const current = byTournamentMap.get(log.tournamentId) ?? {
        tournamentId: log.tournamentId,
        tournamentTitle: log.tournament.title,
        tournamentDate: log.tournament.date,
        counts: this.emptyKindMap(),
        revenue: 0,
      };
      current.counts[log.kind].count += 1;
      current.counts[log.kind].revenue += log.amount;
      current.revenue += log.amount;
      byTournamentMap.set(log.tournamentId, current);
    }

    return {
      month,
      total: logs.length,
      revenue: logs.reduce((sum, log) => sum + log.amount, 0),
      byKind,
      byTournament: [...byTournamentMap.values()].sort(
        (a, b) => b.tournamentDate.getTime() - a.tournamentDate.getTime(),
      ),
      logs: logs.map((log) => ({
        id: log.id,
        tournamentId: log.tournamentId,
        tournamentTitle: log.tournament.title,
        kind: log.kind,
        amount: log.amount,
        chips: log.chips,
        playerName: log.playerName,
        createdAt: log.createdAt,
      })),
    };
  }

  private async getReEntriesForTournament(tournamentId: string) {
    const logs = await this.prisma.reEntryLog.findMany({
      where: { tournamentId },
      include: { tournament: { select: { id: true, title: true, date: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const byKind = this.emptyKindMap();
    for (const log of logs) {
      byKind[log.kind].count += 1;
      byKind[log.kind].revenue += log.amount;
    }

    return {
      tournament: logs[0]?.tournament ?? null,
      total: logs.length,
      revenue: logs.reduce((sum, log) => sum + log.amount, 0),
      byKind,
      byTournament: [],
      logs: logs.map((log) => ({
        id: log.id,
        tournamentId: log.tournamentId,
        tournamentTitle: log.tournament.title,
        kind: log.kind,
        amount: log.amount,
        chips: log.chips,
        playerName: log.playerName,
        createdAt: log.createdAt,
      })),
    };
  }

  /** Стартовая страница аналитики: сводка смен и ре-энтри за месяц. */
  async getSummary(query: AnalyticsQueryDto) {
    const [shifts, reEntries] = await Promise.all([
      this.getShifts(query),
      this.getReEntries(query),
    ]);

    return {
      month: shifts.month,
      shifts: {
        total: shifts.total,
        byName: shifts.byName,
        daysCount: shifts.entries.length,
      },
      reEntries: {
        total: reEntries.total,
        revenue: reEntries.revenue,
        byKind: reEntries.byKind,
      },
    };
  }

  private emptyKindMap(): Record<ReEntryKind, { count: number; revenue: number }> {
    return Object.fromEntries(
      RE_ENTRY_KINDS.map((kind) => [kind, { count: 0, revenue: 0 }]),
    ) as Record<ReEntryKind, { count: number; revenue: number }>;
  }

  private async ensureShiftExists(id: string): Promise<void> {
    const entry = await this.prisma.shiftEntry.findUnique({ where: { id }, select: { id: true } });
    if (!entry) {
      throw new NotFoundException('Запись смены не найдена');
    }
  }
}
