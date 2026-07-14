import { PrismaClient, TournamentStatus, AdminRole } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const owner = await prisma.adminUser.upsert({
    where: { email: 'owner@gutshot.club' },
    update: {},
    create: {
      email: 'owner@gutshot.club',
      passwordHash: await hash('ChangeMe123!', 10),
      name: 'Владелец клуба',
      role: AdminRole.OWNER,
    },
  });

  const player = await prisma.user.upsert({
    where: { telegramId: '000000001' },
    update: {},
    create: {
      telegramId: '000000001',
      username: 'test_player',
      firstName: 'Тест',
      lastName: 'Игрок',
      playerProfile: {
        create: { xp: 0 },
      },
    },
  });

  const tournament = await prisma.tournament.create({
    data: {
      title: 'Пятничный турнир GUTSHOT',
      description: 'Еженедельный турнир по покеру в клубе GUTSHOT',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      buyIn: 3000,
      maxPlayers: 24,
      status: TournamentStatus.REGISTRATION_OPEN,
      registrationOpen: new Date(),
      registrationClose: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('Seed завершен:', { owner: owner.email, player: player.telegramId, tournament: tournament.title });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
