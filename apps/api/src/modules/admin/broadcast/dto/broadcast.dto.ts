import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { BroadcastSegment } from '@prisma/client';

export class CreateBroadcastDto {
  @ApiProperty({ example: 'Анонс фриролла' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title!: string;

  @ApiProperty({ description: 'Текст сообщения (HTML как в Telegram)' })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  bodyHtml!: string;

  @ApiProperty({ enum: ['ALL_ACTIVE', 'SINGLE_PLAYER'], default: 'ALL_ACTIVE' })
  @IsEnum(BroadcastSegment)
  segment!: BroadcastSegment;

  @ApiPropertyOptional({ description: 'Telegram ID получателя для SINGLE_PLAYER' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{5,20}$/, { message: 'Telegram ID должен быть числом' })
  targetTelegramId?: string;

  @ApiPropertyOptional({
    description: 'Путь к загруженному фото (из ответа POST admin/broadcasts/photo)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  photoPath?: string;
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

  @ApiPropertyOptional({ enum: ['ALL_ACTIVE', 'SINGLE_PLAYER'] })
  @IsOptional()
  @IsEnum(BroadcastSegment)
  segment?: BroadcastSegment;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{5,20}$/, { message: 'Telegram ID должен быть числом' })
  targetTelegramId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  photoPath?: string | null;
}
