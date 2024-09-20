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
import { FormProvider } from "../form/form.model";
import { QuestionProvider } from "../question/question.model";
import { StatisticProvider } from "../statistic/statistic.model";

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
    FormProvider,
    QuestionProvider,
    StatisticProvider,
  ],
  exports: [FeedbackService],
})
export class FeedbackModule {}
