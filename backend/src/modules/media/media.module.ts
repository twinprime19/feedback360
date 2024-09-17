/**
 * @file Media module
 * @module module/media/module
 */

import { Module } from "@nestjs/common";
import { MediaController } from "./media.controller";
import { MediaProvider } from "./media.model";
import { MediaService } from "./media.service";
import { UserProvider } from "../user/entities/user.entity";

@Module({
  controllers: [MediaController],
  providers: [MediaProvider, MediaService, UserProvider],
  exports: [MediaService],
})
export class MediaModule {}
