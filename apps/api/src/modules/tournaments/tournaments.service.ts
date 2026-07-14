import { Injectable, NotFoundException } from '@nestjs/common';
import { Tournament, TournamentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TournamentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: { status?: TournamentStatus; date?: string }): Promise<Tournament[]> {
    return this.prisma.tournament.findMany({
      where: {
        status: filters.status,
        date: filters.date
          ? {
              gte: new Date(new Date(filters.date).setHours(0, 0, 0, 0)),
              lt: new Date(new Date(filters.date).setHours(24, 0, 0, 0)),
            }
          : undefined,
      },
      orderBy: { date: 'asc' },
      include: { _count: { select: { registrations: true } } },
    });
  }

  async findById(id: string): Promise<Tournament> {
    const tournament = await this.prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });

    if (!tournament) {
      throw new NotFoundException('Турнир не найден');
    }

    return tournament;
  }

  async findNearest(): Promise<Tournament | null> {
    return this.prisma.tournament.findFirst({
      where: {
        date: { gte: new Date() },
        status: { in: [TournamentStatus.REGISTRATION_OPEN, TournamentStatus.REGISTRATION_CLOSED] },
      },
      orderBy: { date: 'asc' },
      include: { _count: { select: { registrations: true } } },
    });
  }

  async create(data: {
    title: string;
    description?: string;
    date: Date;
    buyIn: number;
    maxPlayers: number;
    registrationOpen?: Date;
    registrationClose?: Date;
  }): Promise<Tournament> {
    return this.prisma.tournament.create({ data });
  }

  async update(id: string, data: Partial<Tournament>): Promise<Tournament> {
    await this.findById(id);
    return this.prisma.tournament.update({ where: { id }, data });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.tournament.delete({ where: { id } });
  }

  async openRegistration(id: string): Promise<Tournament> {
    await this.findById(id);
    return this.prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.REGISTRATION_OPEN },
    });
  }

  async closeRegistration(id: string): Promise<Tournament> {
    await this.findById(id);
    return this.prisma.tournament.update({
      where: { id },
      data: { status: TournamentStatus.REGISTRATION_CLOSED },
    });
  }
}
