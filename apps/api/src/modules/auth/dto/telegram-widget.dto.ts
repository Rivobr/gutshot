import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

/** Виджет присылает id и auth_date числами — приводим к строкам до валидации. */
const ToString = Transform(({ value }) =>
  value === null || value === undefined ? value : String(value),
);

/** Поля callback Telegram Login Widget — приходят как плоский объект. */
export class TelegramWidgetDto {
  @ApiProperty()
  @ToString
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ToString
  @IsString()
  first_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ToString
  @IsString()
  username?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  photo_url?: string;

  @ApiProperty()
  @ToString
  @IsString()
  @IsNotEmpty()
  auth_date!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  hash!: string;
}
