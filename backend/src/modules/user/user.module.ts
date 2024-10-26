import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { UserProvider } from "./entities/user.entity";
import { RoleService } from "../role/role.service";
import { RoleProvider } from "../role/entities/role.entity";
import { PermissionProvider } from "../permission/entities/permission.entity";
import { PermissionService } from "../permission/permission.service";
import { FormProvider } from "../form/form.model";
import { TemplateProvider } from "../template/template.model";

@Module({
  imports: [],
  controllers: [UserController],
  providers: [
    UserService,
    UserProvider,
    RoleService,
    RoleProvider,
    PermissionService,
    PermissionProvider,
    FormProvider,
    TemplateProvider,
  ],
  exports: [UserService],
})
export class UserModule {}
