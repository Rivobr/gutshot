import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class PhoneRequestCodeDto {
  @ApiProperty({ example: '+7 999 009-11-99' })
  @IsString()
  @Matches(/[\d\s()+-]{10,18}/, { message: 'Некорректный номер телефона' })
  phone!: string;
}

export class PhoneVerifyDto {
  @ApiProperty({ example: '+7 999 009-11-99' })
  @IsString()
  @Matches(/[\d\s()+-]{10,18}/, { message: 'Некорректный номер телефона' })
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4,6}$/, { message: 'Код — 4–6 цифр' })
  code!: string;
}
