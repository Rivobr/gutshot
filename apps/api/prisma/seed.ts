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
  BOUNTY: 50,
  FOUR_OF_A_KIND: 100,
  STRAIGHT_FLUSH: 200,
  ROYAL_FLUSH: 500,
  TOURNAMENT_WIN: 2000,
  PLACE_2: 1600,
  PLACE_3: 1300,
  PLACE_4: 1100,
  PLACE_5: 1000,
  PLACE_6: 900,
  PLACE_7: 800,
  PLACE_8: 750,
  PLACE_9: 700,
  PLACE_10: 650,
  PLACE_11: 600,
  PLACE_12: 550,
  PLACE_13: 500,
  PLACE_14: 475,
  PLACE_15: 450,
  PLACE_16: 425,
  PLACE_17: 400,
  PLACE_18: 375,
  PLACE_19: 350,
  PLACE_20: 325,
  PLACE_21: 250,
  PLACE_22: 250,
  PLACE_23: 250,
  PLACE_24: 250,
  PLACE_25: 250,
  PLACE_26: 200,
  PLACE_27: 200,
  PLACE_28: 200,
  PLACE_29: 200,
  PLACE_30: 200,
  PLACE_31_40: 125,
  PLACE_41_50: 100,
  PLACE_51_PLUS: 75,
  WEEKLY_TOP_1: 2000,
  WEEKLY_TOP_2: 1250,
  WEEKLY_TOP_3: 800,
  MONTHLY_TOP_1: 5000,
  MONTHLY_TOP_2: 3000,
  MONTHLY_TOP_3: 2000,
};

function requiredXpForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level >= 100) return 600_000;
  let total = 0;
  for (let from = 1; from < level; from += 1) {
    if (from < 20) total += 200 + 40 * (from - 1);
    else if (from < 50) total += 1000 + 90 * (from - 20);
    else total += 4000 + 261 * (from - 50);
  }
  return total;
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
    title: 'Публичная оферта',
    content: 'Публичная оферта GUTSHOT.\n\nСкан документа показывается в Mini App.',
  },
  {
    type: LegalDocumentType.PERSONAL_DATA_CONSENT,
    title: 'Политика обработки персональных данных',
    content:
      'Политика обработки персональных данных GUTSHOT.\n\nСкан документа показывается в Mini App.',
  },
  {
    type: LegalDocumentType.MEDIA_CONSENT,
    title: 'Согласие на фото- и видеосъемку',
    content:
      'Согласие на фото- и видеосъемку в помещении клуба.\n\nЗаполните этот документ в админ-панели: раздел «Документы».',
  },
];

async function upsertAdmin(input: {
  email: string;
  name: string;
  role: AdminRole;
  password: string;
}): Promise<{ email: string; role: AdminRole }> {
  const passwordHash = await hash(input.password, 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      role: input.role,
      passwordHash,
    },
    create: {
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash,
    },
  });
  return { email: admin.email, role: admin.role };
}

async function main(): Promise<void> {
  // Никогда не удаляем живых админов. 2026-09-05 seed с deleteMany({})
  // стёр admin/dl — дилеры и сотрудники потеряли вход.
  const admins: { email: string; role: AdminRole }[] = [];

  admins.push(
    await upsertAdmin({
      email: 'dl',
      name: 'Дилер',
      role: AdminRole.DEALER,
      password: process.env.ADMIN_PASSWORD_DL || 'dl12345',
    }),
  );
  admins.push(
    await upsertAdmin({
      email: 'admin',
      name: 'Админ',
      role: AdminRole.OWNER,
      password: process.env.ADMIN_PASSWORD_ADMIN || 'adminowner12345!',
    }),
  );

  const namedOwners = [
    { email: 'Sergei', name: 'Sergei', password: process.env.ADMIN_PASSWORD_SERGEI },
    { email: 'Tima', name: 'Tima', password: process.env.ADMIN_PASSWORD_TIMA },
    { email: 'Misha', name: 'Misha', password: process.env.ADMIN_PASSWORD_MISHA },
  ];
  for (const owner of namedOwners) {
    if (!owner.password) {
      continue;
    }
    admins.push(
      await upsertAdmin({
        email: owner.email,
        name: owner.name,
        role: AdminRole.OWNER,
        password: owner.password,
      }),
    );
  }

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
    admins: admins.map((item) => `${item.email} (${item.role})`),
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
