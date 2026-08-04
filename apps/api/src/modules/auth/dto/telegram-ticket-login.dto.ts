import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TelegramTicketLoginDto {
  @ApiProperty({ description: 'Short-lived Mini App login ticket from the bot button' })
  @IsString()
  @IsNotEmpty()
  ticket!: string;
}
