/**
 * @file Statistic module
 * @module module/feedback/module
 */

import { Module } from "@nestjs/common";
import { StatisticController } from "./statistic.controller";
import { StatisticProvider } from "./statistic.model";
import { UserProvider } from "../user/entities/user.entity";
import { UserService } from "../user/user.service";
import { SettingProvider } from "../settting/setting.model";
import { SettingService } from "../settting/setting.service";
import { MediaProvider } from "../media/media.model";
import { StatisticService } from "./statistic.service";
import { FeedbackProvider } from "../feedback/feedback.model";
import { FormProvider } from "../form/form.model";
import { QuestionProvider } from "../question/question.model";

@Module({
  imports: [],
  controllers: [StatisticController],
  providers: [
    StatisticProvider,
    StatisticService,
    UserProvider,
    UserService,
    SettingProvider,
    SettingService,
    MediaProvider,
    FeedbackProvider,
    FormProvider,
    QuestionProvider,
  ],
  exports: [StatisticService],
})
export class StatisticModule {}
