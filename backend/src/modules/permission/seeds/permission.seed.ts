import { Command } from "nestjs-command";
import { Injectable } from "@nestjs/common";
import { PERMISSIONS } from "./data";
import { PublishState } from "@app/constants/biz.constant";
import { PermissionService } from "../permission.service";
import { CreatePermissionDto } from "../dto/create-permission.dto";
import { Action } from "../entities/action.entity";

export const ACTION_STATES = [
  Action.Manage,
  Action.Create,
  Action.Update,
  Action.Delete,
  Action.Read,
];
@Injectable()
export class PermissionSeed {
  constructor(private readonly permissionService: PermissionService) {}

  //npx nestjs-command seeder:permissions
  @Command({ command: "seeder:permissions", describe: "seeder permissions" })
  async create() {
    const manyPermission: CreatePermissionDto[] = [];
    for (const name of PERMISSIONS) {
      const createPermissionDto: CreatePermissionDto = {
        name: name,
        state: PublishState.Published,
        actions: ACTION_STATES,
      };
      manyPermission.push(createPermissionDto);
    }
    const permission = await this.permissionService.insertMany(manyPermission);
    console.log("permission", permission);
  }
}
