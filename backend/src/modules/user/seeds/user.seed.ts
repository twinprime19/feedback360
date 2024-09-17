import { Command } from "nestjs-command";
import { Injectable } from "@nestjs/common";
import { UserService } from "@app/modules/user/user.service";
import { CreateSuperAdminDto } from "../dto/create-superAdmin.dto";
import { UserStatus } from "@app/constants/biz.constant";

@Injectable()
export class UserSeed {
  constructor(private readonly userService: UserService) {}

  //npx nestjs-command create:supperAdmin
  @Command({
    command: "create:supperAdmin",
    describe: "seed create supper admin",
  })
  async create() {
    const hashPassword = await this.userService.hashPassword("123456");
    const CreateSuperAdminDto: CreateSuperAdminDto = {
      userName: "supperAdmin@gmail.com",
      password: hashPassword,
      isSuperAdmin: true,
      status: UserStatus.ONLINE,
    };
    const user = this.userService.createSuperAdmin(CreateSuperAdminDto);

    console.log(user);
    console.log("DONE !");
  }
}
