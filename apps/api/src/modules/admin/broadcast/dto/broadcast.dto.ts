import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BroadcastButtons, BroadcastSegment } from '@prisma/client';

export class CustomBroadcastButtonDto {
  @ApiProperty({ example: 'Записаться' })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  text!: string;

  @ApiPropertyOptional({ enum: ['url', 'open_app'], default: 'url' })
  @IsOptional()
  @IsEnum(['url', 'open_app'] as const)
  type?: 'url' | 'open_app';

  @ApiPropertyOptional({ description: 'Ссылка для type=url' })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  url?: string;
}

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

  @ApiPropertyOptional({ description: 'ID игрока для SINGLE_PLAYER' })
  @IsOptional()
  @IsString()
  targetUserId?: string;

  @ApiPropertyOptional({ description: 'URL картинки (Telegram скачает по ссылке)' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  photoUrl?: string;

  @ApiPropertyOptional({ enum: BroadcastButtons, default: BroadcastButtons.NONE })
  @IsOptional()
  @IsEnum(BroadcastButtons)
  buttons?: BroadcastButtons;

  @ApiPropertyOptional({ type: [CustomBroadcastButtonDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomBroadcastButtonDto)
  customButtons?: CustomBroadcastButtonDto[];
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetUserId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  photoUrl?: string | null;

  @ApiPropertyOptional({ enum: BroadcastButtons })
  @IsOptional()
  @IsEnum(BroadcastButtons)
  buttons?: BroadcastButtons;

  @ApiPropertyOptional({ type: [CustomBroadcastButtonDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomBroadcastButtonDto)
  customButtons?: CustomBroadcastButtonDto[] | null;
}

export class TestBroadcastDto {
  @ApiProperty({ description: 'Telegram ID, куда отправить тестовое сообщение' })
  @IsString()
  @MinLength(5)
  @MaxLength(32)
  telegramId!: string;
}
