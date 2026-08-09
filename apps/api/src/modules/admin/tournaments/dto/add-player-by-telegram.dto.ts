import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Добавление игрока в турнир.
 * Принимает числовой Telegram ID, @username или никнейм клуба.
 * Поле telegramId оставлено для совместимости со старым клиентом.
 */
export class AddPlayerByTelegramDto {
  @ApiPropertyOptional({
    description: 'Telegram ID, @username или никнейм',
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
}
