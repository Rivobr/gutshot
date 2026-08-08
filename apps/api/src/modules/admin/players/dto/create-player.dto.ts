import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreatePlayerDto {
  @ApiProperty({ description: 'Telegram user id (числовой)' })
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{5,20}$/, { message: 'Telegram ID должен быть числом (5–20 цифр)' })
  telegramId!: string;

  @ApiPropertyOptional({ description: 'Сразу подтвердить KYC' })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}
