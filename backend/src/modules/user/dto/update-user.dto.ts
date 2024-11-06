import {
  IsString,
  IsBoolean,
  IsInt,
  IsOptional,
  IsEmail,
  IsNotEmpty,
} from "class-validator";

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  emailAddress: string;

  @IsString()
  @IsOptional()
  position: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  address: string;

  @IsBoolean()
  @IsOptional()
  isSuperAdmin?: boolean;

  @IsInt()
  status: number;

  @IsInt()
  gender: number;
}

export class UpdateUserSADto {
  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  emailAddress: string;

  @IsString()
  @IsOptional()
  position: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  address: string;

  @IsBoolean()
  @IsOptional()
  isSuperAdmin?: boolean;

  @IsInt()
  @IsOptional()
  status: number;

  @IsInt()
  @IsOptional()
  gender: number;
}
