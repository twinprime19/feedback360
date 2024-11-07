import {
  IsString,
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

  @IsInt()
  status: number;
}

export class UpdateUserSADto {
  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  emailAddress: string;

  @IsString()
  @IsOptional()
  position: string;
}
