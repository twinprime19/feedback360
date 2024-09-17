import {
  IsString,
  IsDefined,
  IsNotEmpty,
  IsBoolean,
  IsInt,
  IsArray,
  IsOptional,
  ArrayUnique,
  ArrayNotEmpty,
  IsEmail,
} from "class-validator";

export class CreateUserDto {

  @IsNotEmpty({ message: "username?" })
  @IsDefined()
  @IsString()
  userName: string;

  @IsNotEmpty({ message: "password?" })
  @IsDefined()
  @IsString()
  password: string;

  @IsString()
  @IsOptional()
  fullName: string;

  @IsString()
  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsBoolean()
  isSuperAdmin: boolean = false;

  @IsInt()
  status: number = 1;
}

export class UsersDTO {
  @ArrayUnique()
  @ArrayNotEmpty()
  @IsArray()
  userIds: string[];
}
