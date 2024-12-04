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
import { PoliciesGuard } from "@app/guards/policies.guard";
import { User } from "../user/entities/user.entity";
import { UpdateUserSADto } from "../user/dto/update-user.dto";

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
    let userID = req.user.id;
    return this.userService.authToken(userID);
  }

  // change password
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Post("change-password")
  changePassword(@Request() req, @Body() password: PasswordDTO) {
    let userID = req.user.id;
    return this.userService.changePassword(userID, password);
  }

  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Post("/update-profile")
  updateProfile(@Request() req, @Body() user: UpdateUserSADto) {
    let userID = req.user.id;
    return this.userService.updateProfile(userID, user);
  }

  // forgot password user
  @Post("/forgot-password")
  @Responser.handle("Forgot password")
  async forgotPassword(@Body() body: { emailAddress: string }): Promise<User> {
    return this.userService.forgotPassword(body.emailAddress);
  }
}
