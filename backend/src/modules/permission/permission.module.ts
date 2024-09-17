import { Module } from "@nestjs/common";
import { PermissionService } from "./permission.service";
import { PermissionController } from "./permission.controller";
import { PermissionProvider } from "./entities/permission.entity";

@Module({
  controllers: [PermissionController],
  providers: [PermissionService, PermissionProvider],
})
export class PermissionModule {}
