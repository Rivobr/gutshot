import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ConsentsDto {
  @ApiProperty()
  @IsBoolean()
  offer!: boolean;

  @ApiProperty()
  @IsBoolean()
  rules!: boolean;

  @ApiProperty()
  @IsBoolean()
  pdn!: boolean;

  @ApiProperty({ description: 'Согласие на фото- и видеосъёмку' })
  @IsBoolean()
  media!: boolean;
}

export class WebRegisterDto {
  @ApiProperty({ example: 'Mila_Ace' })
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  nickname!: string;

  @ApiProperty({ example: 'you@mail.ru' })
  @Transform(({ value }) =>
    String(value ?? '')
      .trim()
      .toLowerCase(),
  )
  @IsEmail({}, { message: 'Некорректная почта' })
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Пароль — минимум 8 символов' })
  @MaxLength(72)
  password!: string;

  @ApiProperty({ type: ConsentsDto })
  @ValidateNested()
  @Type(() => ConsentsDto)
  consents!: ConsentsDto;
}
