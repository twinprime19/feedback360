import { Module } from "@nestjs/common";
import { RoleService } from "./role.service";
import { RoleController } from "./role.controller";
import { RoleProvider } from "./entities/role.entity";
import { PermissionService } from "../permission/permission.service";
import { PermissionProvider } from "../permission/entities/permission.entity";
@Module({
  controllers: [RoleController],
  providers: [RoleService, RoleProvider, PermissionService, PermissionProvider],
})
export class RoleModule {}
