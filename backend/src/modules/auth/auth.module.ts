/**
 * @file Auth module
 * @module module/auth/module
 */

import jwt from "jsonwebtoken";
import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthProvider } from "./auth.model";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { LocalStrategy } from "./local.strategy";

import * as APP_CONFIG from "@app/app.config";
import { UserProvider } from "../user/entities/user.entity";
import { UserService } from "../user/user.service";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      privateKey: APP_CONFIG.AUTH.jwtSecret as string,
      signOptions: {
        expiresIn: APP_CONFIG.AUTH.expiresIn as number,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthProvider,
    AuthService,
    JwtStrategy,
    UserProvider,
    UserService,
    LocalStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
