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

// Значения продублированы из src/common/constants/xp-defaults.constants.ts,
// чтобы seed оставался самостоятельным скриптом без зависимости от кода приложения.
const DEFAULT_XP_SETTINGS: Record<XpSettingKey, number> = {
  ATTENDANCE: 100,
  ELIMINATION: 50,
  RE_ENTRY: 0,
  BOUNTY: 75,
  FOUR_OF_A_KIND: 150,
  STRAIGHT_FLUSH: 300,
  ROYAL_FLUSH: 1000,
  TOURNAMENT_WIN: 5000,
  PLACE_2: 3800,
  PLACE_3: 3000,
  PLACE_4: 2500,
  PLACE_5: 2100,
  PLACE_6: 1800,
  PLACE_7: 1600,
  PLACE_8: 1450,
  PLACE_9: 1300,
  PLACE_10: 1200,
  PLACE_11: 1100,
  PLACE_12: 1000,
  PLACE_13: 900,
  PLACE_14: 825,
  PLACE_15: 750,
  PLACE_16: 700,
  PLACE_17: 650,
  PLACE_18: 600,
  PLACE_19: 550,
  PLACE_20: 500,
  PLACE_21: 450,
  PLACE_22: 400,
  PLACE_23: 350,
  PLACE_24: 300,
  PLACE_25: 250,
  PLACE_26: 225,
  PLACE_27: 200,
  PLACE_28: 175,
  PLACE_29: 150,
  PLACE_30: 125,
  WEEKLY_TOP_1: 15000,
  WEEKLY_TOP_2: 10000,
  WEEKLY_TOP_3: 7000,
  MONTHLY_TOP_1: 30000,
  MONTHLY_TOP_2: 20000,
  MONTHLY_TOP_3: 12000,
};

function levelStepIncrement(transition: number): number {
  if (transition < 10) return 60;
  if (transition < 25) return 80;
  if (transition < 50) return 100;
  if (transition < 75) return 120;
  return 140;
}

// Уровни 1–100 по ТЗ клуба: 10 ур. — 4 410, 50 ур. — 104 410, 100 ур. — 481 910 XP.
const DEFAULT_LEVEL_THRESHOLDS = (() => {
  const rows = [{ level: 1, requiredXp: 0 }];
  let step = 250;
  let cumulative = 0;

  for (let transition = 1; transition < 100; transition += 1) {
    if (transition > 1) {
      step += levelStepIncrement(transition - 1);
    }
    cumulative += step;
    rows.push({ level: transition + 1, requiredXp: cumulative });
  }

  return rows;
})();

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

  // Настройки XP и таблица уровней. Существующие значения не перезаписываются,
  // чтобы seed можно было запускать повторно без потери настроек клуба.
  await prisma.xpSetting.createMany({
    data: (Object.keys(DEFAULT_XP_SETTINGS) as XpSettingKey[]).map((key) => ({
      key,
      value: DEFAULT_XP_SETTINGS[key],
    })),
    skipDuplicates: true,
  });

  await prisma.levelThreshold.createMany({
    data: DEFAULT_LEVEL_THRESHOLDS,
    skipDuplicates: true,
  });

  await prisma.legalDocument.createMany({
    data: LEGAL_DOCUMENTS,
    skipDuplicates: true,
  });

  console.log('Seed завершен:', {
    owner: owner.email,
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
