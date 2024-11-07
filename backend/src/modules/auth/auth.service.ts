/**
 * @file Auth service
 * @module module/auth/service
 */

import lodash from "lodash";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AuthPayload, TokenResult } from "./auth.interface";
import { AuthLoginDTO } from "./auth.dto";
import { UserService } from "../user/user.service";
import * as bcrypt from "bcrypt";
import * as APP_CONFIG from "@app/app.config";
import { User } from "../user/entities/user.entity";
import { MongooseDoc } from "@app/interfaces/mongoose.interface";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService
  ) {}

  public async createToken(data: AuthPayload): Promise<TokenResult> {
    let user: any = await this.userService.authToken(data.id);
    if (!user) {
      user = {};
    }
    return {
      access_token: this.jwtService.sign(data),
      expires_in: APP_CONFIG.AUTH.expiresIn as number,
      user: user,
    };
  }

  public verifyToken(token: any) {
    return this.jwtService.decode(token);
  }

  public validateAuthData(payload: any): Promise<any> {
    const isVerified = lodash.isEqual(payload.data, APP_CONFIG.AUTH.data);
    return isVerified ? payload.data : null;
  }

  public async adminLogin(authLoginDTO: AuthLoginDTO) {
    const user = await this.userService.findOneByUserName(
      authLoginDTO.userName
    );

    if (!user)
      throw new UnauthorizedException(401, "Tên tài khoản không đúng.");

    if (!user.status)
      throw new UnauthorizedException(401, "Tài khoản không hoạt động.");

    const check = await this.comparePassword(
      authLoginDTO.password,
      user.password
    );

    if (!user || !check) {
      throw new UnauthorizedException(
        401,
        "Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng thử lại."
      );
    } else {
      return user;
    }
  }

  async login(user: MongooseDoc<User>) {
    const payload: AuthPayload = {
      id: String(user._id),
      userName: user.userName,
      roles: user.roles,
      isSuperAdmin: user.isSuperAdmin,
    };

    return this.createToken(payload);
  }

  //function compare password param with user password in database
  async comparePassword(
    password: string,
    storePasswordHash: string
  ): Promise<any> {
    return await bcrypt.compare(password, storePasswordHash);
  }
}
