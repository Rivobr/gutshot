import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BroadcastButtons, BroadcastSegment } from '@prisma/client';

export class CreateBroadcastDto {
  @ApiProperty({ example: 'RSVP фриролл 12.08' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @ApiProperty({ description: 'Текст сообщения (HTML как в Telegram)' })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  bodyHtml!: string;

  @ApiProperty({ enum: BroadcastSegment })
  @IsEnum(BroadcastSegment)
  segment!: BroadcastSegment;

  @ApiPropertyOptional({ description: 'Нужен для сегментов турнира и RSVP-кнопок' })
  @IsOptional()
  @IsString()
  tournamentId?: string;

  @ApiPropertyOptional({ enum: BroadcastButtons, default: BroadcastButtons.NONE })
  @IsOptional()
  @IsEnum(BroadcastButtons)
  buttons?: BroadcastButtons;
}

export class UpdateBroadcastDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  bodyHtml?: string;

  @ApiPropertyOptional({ enum: BroadcastSegment })
  @IsOptional()
  @IsEnum(BroadcastSegment)
  segment?: BroadcastSegment;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tournamentId?: string | null;

  @ApiPropertyOptional({ enum: BroadcastButtons })
  @IsOptional()
  @IsEnum(BroadcastButtons)
  buttons?: BroadcastButtons;
}

export class TestBroadcastDto {
  @ApiProperty({ description: 'Telegram ID, куда отправить тестовое сообщение' })
  @IsString()
  @MinLength(5)
  @MaxLength(32)
  telegramId!: string;
}
