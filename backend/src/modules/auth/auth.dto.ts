/**
 * @file Auth DTO
 * @module module/auth/dto
 */

import { IsString, IsDefined, IsNotEmpty } from "class-validator";
import { Auth } from "./auth.model";

export class AuthLoginDTO {
  @IsString({ message: "username must be string type" })
  @IsNotEmpty({ message: "username?" })
  @IsDefined()
  userName: string;

  @IsString({ message: "password must be string type" })
  @IsNotEmpty({ message: "password?" })
  @IsDefined()
  password: string;
}

export class AuthUpdateDTO extends Auth {
  new_password?: string;
}

export class PasswordDTO {
  @IsString({ message: "New password must be string type" })
  @IsNotEmpty({ message: "password?" })
  newPassword: string;

  @IsString({ message: "password must be string type" })
  @IsNotEmpty({ message: "password?" })
  password: string;
}
