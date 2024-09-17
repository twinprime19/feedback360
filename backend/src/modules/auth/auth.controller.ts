import {
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Body,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "@app/guards/local-auth.guard";
import { JwtAuthGuard } from "@app/guards/jwt-auth.guard";
import { TokenResult } from "./auth.interface";
import { Responser } from "@app/decorators/responser.decorator";
import { UserService } from "../user/user.service";
import { AdminOnlyGuard } from "@app/guards/admin-only.guard";
import { PasswordDTO } from "./auth.dto";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService
  ) {}

  // login
  @UseGuards(LocalAuthGuard)
  @Post("login")
  @Responser.handle("Login")
  async login(@Request() req): Promise<TokenResult> {
    return this.authService.login(req.user);
  }

  // get auth token
  @UseGuards(JwtAuthGuard)
  @Get("auth-token")
  getProfile(@Request() req) {
    let userName = req.user.userName;
    return this.userService.authToken(userName);
  }

  // change password
  @UseGuards(AdminOnlyGuard)
  @Post("change-password")
  changePassword(@Request() req, @Body() password: PasswordDTO) {
    let userName = req.user.userName;
    return this.userService.changePassword(userName, password);
  }
}
