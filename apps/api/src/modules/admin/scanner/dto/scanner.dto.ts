import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** События, которые сотрудник клуба отмечает после сканирования QR игрока. */
export enum ScannerEvent {
  ARRIVED = 'ARRIVED',
  ELIMINATED = 'ELIMINATED',
  RE_ENTRY = 'RE_ENTRY',
  ADDON = 'ADDON',
  BOUNTY = 'BOUNTY',
  FOUR_OF_A_KIND = 'FOUR_OF_A_KIND',
  STRAIGHT_FLUSH = 'STRAIGHT_FLUSH',
  ROYAL_FLUSH = 'ROYAL_FLUSH',
  /** Особые достижения по ТЗ: отмечаются вручную администратором. */
  TUTORIAL_COMPLETED = 'TUTORIAL_COMPLETED',
  FRIEND_REFERRED = 'FRIEND_REFERRED',
  SHORT_STACK_WIN = 'SHORT_STACK_WIN',
}

/** Виды ре-энтри / аддона (для аналитики выручки). */
export enum ReEntryKind {
  RE_ENTRY_1000 = 'RE_ENTRY_1000',
  RE_ENTRY_1500 = 'RE_ENTRY_1500',
  ADDON_1000 = 'ADDON_1000',
}

/** Стоимость вида ре-энтри / аддона: сумма и фишки. */
export const RE_ENTRY_KIND_PARAMS: Record<ReEntryKind, { amount: number; chips: number }> = {
  [ReEntryKind.RE_ENTRY_1000]: { amount: 1000, chips: 30000 },
  [ReEntryKind.RE_ENTRY_1500]: { amount: 1500, chips: 60000 },
  [ReEntryKind.ADDON_1000]: { amount: 1000, chips: 0 },
};

export class ScannerEventDto {
  @ApiProperty({ description: 'Постоянный QR-код игрока' })
  @IsString()
  @IsNotEmpty()
  qrCode!: string;

  @ApiProperty({ enum: ScannerEvent })
  @IsEnum(ScannerEvent)
  event!: ScannerEvent;

  @ApiPropertyOptional({
    description: 'Турнир события. Если не указан — берется активная регистрация игрока.',
  })
  @IsOptional()
  @IsString()
  tournamentId?: string;

  @ApiPropertyOptional({
    enum: ReEntryKind,
    description: 'Вид ре-энтри/аддона. Обязателен для RE_ENTRY/ADDON; по умолчанию RE_ENTRY_1000.',
  })
  @IsOptional()
  @IsIn(Object.values(ReEntryKind))
  reEntryKind?: ReEntryKind;
}

export class MarkAttendanceDto {
  @ApiProperty({ description: 'true — игрок пришел, false — снять отметку о явке' })
  @IsBoolean()
  arrived!: boolean;
}
