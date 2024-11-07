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

export class UsersDTO {
  @ArrayUnique()
  @ArrayNotEmpty()
  @IsArray()
  userIds: string[];
}

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
  @IsNotEmpty()
  fullname: string;

  @IsString()
  @IsEmail()
  @IsOptional()
  emailAddress: string;

  @IsString()
  @IsOptional()
  position: string;

  @IsBoolean()
  isSuperAdmin: boolean = false;

  @IsInt()
  status: number;
}
