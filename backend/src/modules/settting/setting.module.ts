/**
 * @file Setting module
 * @module module/setting/module
 */

import { Module } from "@nestjs/common";
import { MediaProvider } from "../media/media.model";
import { MediaService } from "../media/media.service";
import { UserProvider } from "../user/entities/user.entity";
import { SettingController } from "./setting.controller";
import { SettingProvider } from "./setting.model";
import { SettingService } from "./setting.service";

@Module({
  controllers: [SettingController],
  providers: [
    SettingProvider,
    UserProvider,
    SettingService,
    MediaService,
    MediaProvider,
  ],
  exports: [SettingService],
})
export class SettingModule {}
