import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@gutshot.club' })
  // Мобильные клавиатуры добавляют пробел и заглавную букву — чистим до валидации.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '********' })
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
