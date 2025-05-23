/**
 * @file Auth jwt strategy
 * @module module/auth/jwt-strategy
 */

// https://docs.nestjs.com/security/authentication#implementing-passport-jwt
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { HttpUnauthorizedError } from "@app/errors/unauthorized.error";
import { AuthService } from "./auth.service";
import * as APP_CONFIG from "@app/app.config";
import { AuthPayload } from "./auth.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: APP_CONFIG.AUTH.jwtSecret,
    });
  }

  async validate(payload: AuthPayload) {
    return {
      id: payload.id,
      userName: payload.userName,
      roles: payload.roles,
      isSuperAdmin: payload.isSuperAdmin,
    };
  }
}
