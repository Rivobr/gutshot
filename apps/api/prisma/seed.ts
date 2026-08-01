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
  TOURNAMENT_WIN: 3600,
  PLACE_2: 2900,
  PLACE_3: 2705,
  PLACE_4: 2520,
  PLACE_5: 2335,
  PLACE_6: 2150,
  PLACE_7: 1975,
  PLACE_8: 1805,
  PLACE_9: 1635,
  PLACE_10: 1475,
  PLACE_11: 1320,
  PLACE_12: 1170,
  PLACE_13: 1025,
  PLACE_14: 890,
  PLACE_15: 760,
  PLACE_16: 640,
  PLACE_17: 530,
  PLACE_18: 435,
  PLACE_19: 355,
  PLACE_20: 300,
};

const DEFAULT_LEVEL_THRESHOLDS = Array.from({ length: 30 }, (_, index) => ({
  level: index + 1,
  requiredXp: Math.pow(index, 2) * 100,
}));

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
