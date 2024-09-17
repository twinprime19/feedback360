/**
 * @file Feedback module
 * @module module/feedback/module
 */

import { Module } from "@nestjs/common";
import { FeedbackController } from "./feedback.controller";
import { FeedbackProvider } from "./feedback.model";
import { UserProvider } from "../user/entities/user.entity";
import { UserService } from "../user/user.service";
import { SettingProvider } from "../settting/setting.model";
import { SettingService } from "../settting/setting.service";
import { MediaProvider } from "../media/media.model";
import { FeedbackService } from "./feedback.service";

@Module({
  imports: [],
  controllers: [FeedbackController],
  providers: [
    FeedbackProvider,
    FeedbackService,
    UserProvider,
    UserService,
    SettingProvider,
    SettingService,
    MediaProvider,
  ],
  exports: [FeedbackService],
})
export class FeedbackModule {}
