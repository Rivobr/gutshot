import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** События, которые сотрудник клуба отмечает после сканирования QR игрока. */
export enum ScannerEvent {
  ARRIVED = 'ARRIVED',
  ELIMINATED = 'ELIMINATED',
  RE_ENTRY = 'RE_ENTRY',
  BOUNTY = 'BOUNTY',
  FOUR_OF_A_KIND = 'FOUR_OF_A_KIND',
  STRAIGHT_FLUSH = 'STRAIGHT_FLUSH',
  ROYAL_FLUSH = 'ROYAL_FLUSH',
  /** Особые достижения по ТЗ: отмечаются вручную администратором. */
  TUTORIAL_COMPLETED = 'TUTORIAL_COMPLETED',
  FRIEND_REFERRED = 'FRIEND_REFERRED',
  SHORT_STACK_WIN = 'SHORT_STACK_WIN',
}

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
}

export class MarkAttendanceDto {
  @ApiProperty({ description: 'true — игрок пришел, false — снять отметку о явке' })
  @IsBoolean()
  arrived!: boolean;
}
