import {
  IsString,
  IsDefined,
  IsNotEmpty,
  IsBoolean,
  IsInt,
  IsOptional,
  IsEmail,
} from "class-validator";

export class CreateSuperAdminDto {
  @IsNotEmpty({ message: "username?" })
  @IsDefined()
  @IsString()
  userName: string;

  @IsNotEmpty({ message: "password?" })
  @IsDefined()
  @IsString()
  password: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  emailAddress: string;

  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsString()
  @IsOptional()
  position: string;

  @IsBoolean()
  isSuperAdmin: boolean;

  @IsInt()
  status: number;
}
