import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class AddPlayerByTelegramDto {
  @ApiProperty({ description: 'Telegram user id (числовой)' })
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{5,20}$/, { message: 'Telegram ID должен быть числом (5–20 цифр)' })
  telegramId!: string;
}
