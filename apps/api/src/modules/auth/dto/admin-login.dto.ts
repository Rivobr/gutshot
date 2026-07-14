import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@gutshot.club' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '********' })
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
