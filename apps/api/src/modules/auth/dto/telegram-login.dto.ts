import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TelegramLoginDto {
  @ApiProperty({ description: 'Telegram WebApp initData' })
  @IsString()
  @IsNotEmpty()
  initData!: string;
}
