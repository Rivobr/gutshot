import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/** Поля callback Telegram Login Widget — приходят как плоский объект. */
export class TelegramWidgetDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ required: false })
  @IsString()
  first_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  last_name?: string;

  @ApiProperty({ required: false })
  @IsString()
  username?: string;

  @ApiProperty({ required: false })
  @IsString()
  photo_url?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  auth_date!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  hash!: string;
}
