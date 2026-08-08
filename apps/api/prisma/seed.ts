import {
  PrismaClient,
  TournamentStatus,
  AdminRole,
  LegalDocumentType,
  XpSettingKey,
} from '@prisma/client';
import { hash } from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Значения продублированы из src/common/constants/xp-defaults.constants.ts
const DEFAULT_XP_SETTINGS: Record<XpSettingKey, number> = {
  ATTENDANCE: 100,
  ELIMINATION: 50,
  RE_ENTRY: 0,
  BOUNTY: 75,
  FOUR_OF_A_KIND: 150,
  STRAIGHT_FLUSH: 300,
  ROYAL_FLUSH: 1000,
  TOURNAMENT_WIN: 3500,
  PLACE_2: 2800,
  PLACE_3: 2300,
  PLACE_4: 2000,
  PLACE_5: 1800,
  PLACE_6: 1600,
  PLACE_7: 1450,
  PLACE_8: 1300,
  PLACE_9: 1200,
  PLACE_10: 1100,
  PLACE_11: 1000,
  PLACE_12: 900,
  PLACE_13: 850,
  PLACE_14: 800,
  PLACE_15: 750,
  PLACE_16: 700,
  PLACE_17: 650,
  PLACE_18: 600,
  PLACE_19: 550,
  PLACE_20: 500,
  PLACE_21: 400,
  PLACE_22: 400,
  PLACE_23: 400,
  PLACE_24: 400,
  PLACE_25: 400,
  PLACE_26: 300,
  PLACE_27: 300,
  PLACE_28: 300,
  PLACE_29: 300,
  PLACE_30: 300,
  PLACE_31_40: 200,
  PLACE_41_50: 150,
  PLACE_51_PLUS: 100,
  WEEKLY_TOP_1: 7500,
  WEEKLY_TOP_2: 5000,
  WEEKLY_TOP_3: 3500,
  MONTHLY_TOP_1: 20000,
  MONTHLY_TOP_2: 12500,
  MONTHLY_TOP_3: 7500,
};

function requiredXpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level >= 100) return 250_000;
  const n = level - 1;
  return Math.round(970 * n + 15.7 * n * n);
}

const DEFAULT_LEVEL_THRESHOLDS = Array.from({ length: 100 }, (_, index) => {
  const level = index + 1;
  return { level, requiredXp: requiredXpForLevel(level) };
});

const QR_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generatePlayerQrCode(): string {
  const suffix = Array.from(randomBytes(16))
    .map((byte) => QR_ALPHABET[byte % QR_ALPHABET.length])
    .join('');

  return `GS-${suffix}`;
}

const LEGAL_DOCUMENTS: { type: LegalDocumentType; title: string; content: string }[] = [
  {
    type: LegalDocumentType.CLUB_RULES,
    title: 'Правила клуба',
    content:
      'Правила клуба GUTSHOT.\n\nЗаполните этот документ в админ-панели: раздел «Документы».',
  },
  {
    type: LegalDocumentType.USER_AGREEMENT,
    title: 'Пользовательское соглашение',
    content:
      'Пользовательское соглашение GUTSHOT.\n\nЗаполните этот документ в админ-панели: раздел «Документы».',
  },
  {
    type: LegalDocumentType.PERSONAL_DATA_CONSENT,
    title: 'Согласие на обработку персональных данных',
    content:
      'Согласие на обработку персональных данных.\n\nЗаполните этот документ в админ-панели: раздел «Документы».',
  },
  {
    type: LegalDocumentType.MEDIA_CONSENT,
    title: 'Согласие на фото- и видеосъемку',
    content:
      'Согласие на фото- и видеосъемку в помещении клуба.\n\nЗаполните этот документ в админ-панели: раздел «Документы».',
  },
];

async function main(): Promise<void> {
  await prisma.adminUser.deleteMany({
    where: { email: { in: ['owner@gutshot.club', 'tvadmin'] } },
  });

  const dealer = await prisma.adminUser.upsert({
    where: { email: 'dl' },
    update: {
      name: 'Дилер',
      role: AdminRole.DEALER,
      passwordHash: await hash('dl12345', 10),
    },
    create: {
      email: 'dl',
      passwordHash: await hash('dl12345', 10),
      name: 'Дилер',
      role: AdminRole.DEALER,
    },
  });

  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin' },
    update: {
      name: 'Админ',
      role: AdminRole.OWNER,
      passwordHash: await hash('adminowner12345!', 10),
    },
    create: {
      email: 'admin',
      passwordHash: await hash('adminowner12345!', 10),
      name: 'Админ',
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
      qrCode: generatePlayerQrCode(),
      playerProfile: {
        create: { xp: 0 },
      },
    },
  });

  const tournament = await prisma.tournament.upsert({
    where: { id: 'seed-tournament' },
    update: {},
    create: {
      id: 'seed-tournament',
      title: 'Пятничный турнир GUTSHOT',
      description: 'Еженедельный турнир по покеру в клубе GUTSHOT',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      buyIn: 0,
      maxPlayers: 24,
      status: TournamentStatus.REGISTRATION_OPEN,
      registrationOpen: new Date(),
      registrationClose: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    },
  });

  for (const key of Object.keys(DEFAULT_XP_SETTINGS) as XpSettingKey[]) {
    await prisma.xpSetting.upsert({
      where: { key },
      update: { value: DEFAULT_XP_SETTINGS[key] },
      create: { key, value: DEFAULT_XP_SETTINGS[key] },
    });
  }

  await prisma.levelThreshold.deleteMany();
  await prisma.levelThreshold.createMany({
    data: DEFAULT_LEVEL_THRESHOLDS,
  });

  await prisma.legalDocument.createMany({
    data: LEGAL_DOCUMENTS,
    skipDuplicates: true,
  });

  console.log('Seed завершен:', {
    dealer: dealer.email,
    admin: admin.email,
    player: player.telegramId,
    qrCode: player.qrCode,
    tournament: tournament.title,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
