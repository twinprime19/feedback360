/**
 * @file Setting controller
 * @module module/setting/controller
 */

import { Controller, Get, Put, Body, UseGuards, Post } from "@nestjs/common";
import { Responser } from "@app/decorators/responser.decorator";
import { AdminOnlyGuard } from "@app/guards/admin-only.guard";
import { AdminMaybeGuard } from "@app/guards/admin-maybe.guard";
import { SettingService } from "./setting.service";
import { KeyValueModel } from "@app/models/key-value.model";
import { MongooseDoc } from "@app/interfaces/mongoose.interface";
import { Setting } from "./setting.model";

@Controller("setting")
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  // get site settings
  @Get()
  @Responser.handle("Get site settings")
  getSetting(): Promise<MongooseDoc<Setting>> {
    return this.settingService.getSetting();
  }

  // update site settings
  @Put()
  @UseGuards(AdminMaybeGuard)
  @Responser.handle("Update site settings")
  putSetting(
    @Body() newSetting: { web: KeyValueModel[] }
  ): Promise<MongooseDoc<Setting> | null> {
    return this.settingService.updateSetting(newSetting);
  }
}
