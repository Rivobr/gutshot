import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Создание игрока в БД.
 * Принимает числовой Telegram ID или @username (через Bot API).
 * Поле telegramId оставлено для совместимости со старым клиентом.
 */
export class CreatePlayerDto {
  @ApiPropertyOptional({
    description: 'Telegram ID или @username',
    example: '@username',
  })
  @Transform(({ value }) => (value == null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  @MaxLength(64)
  query?: string;

  @ApiPropertyOptional({ description: 'Устаревшее поле: Telegram ID / query' })
  @Transform(({ value }) => (value == null ? undefined : String(value).trim()))
  @IsOptional()
  @IsString()
  @MaxLength(64)
  telegramId?: string;

  @ApiPropertyOptional({ description: 'Сразу подтвердить KYC' })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
