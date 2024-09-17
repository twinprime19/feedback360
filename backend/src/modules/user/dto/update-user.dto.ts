import {
  IsString,
  IsBoolean,
  IsInt,
  IsOptional,
  IsEmail,
} from "class-validator";

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsBoolean()
  @IsOptional()
  isSuperAdmin?: boolean;

  @IsInt()
  status: number;
}
