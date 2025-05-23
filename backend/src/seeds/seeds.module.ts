import { Module } from "@nestjs/common";
import { CommandModule } from "nestjs-command";
import { PermissionSeed } from "@app/modules/permission/seeds/permission.seed";
import { PermissionProvider } from "@app/modules/permission/entities/permission.entity";
import { PermissionService } from "@app/modules/permission/permission.service";
import { UserSeed } from "@app/modules/user/seeds/user.seed";
import { UserService } from "@app/modules/user/user.service";
import { UserProvider } from "@app/modules/user/entities/user.entity";
import { FormProvider } from "@app/modules/form/form.model";
import { TemplateProvider } from "@app/modules/template/template.model";

@Module({
  imports: [CommandModule],
  providers: [
    PermissionSeed,
    PermissionProvider,
    PermissionService,
    UserSeed,
    UserService,
    UserProvider,
    FormProvider,
    TemplateProvider,
  ],
  exports: [PermissionSeed, UserSeed],
})
export class SeedsModule {}
