import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/** Поля callback Telegram Login Widget — приходят как плоский объект. */
export class TelegramWidgetDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ required: false })
  @IsOptional()
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
