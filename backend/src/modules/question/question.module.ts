/**
 * @file Question module
 * @module module/activity/module
 */

import { Module } from "@nestjs/common";
import { QuestionController } from "./question.controller";
import { QuestionService } from "./question.service";
import { QuestionProvider } from "./question.model";
import { SettingProvider } from "../settting/setting.model";
import { SettingService } from "../settting/setting.service";
import { UserService } from "../user/user.service";
import { UserProvider } from "../user/entities/user.entity";
import { FormProvider } from "../form/form.model";
import { TemplateProvider } from "../template/template.model";

@Module({
  imports: [],
  controllers: [QuestionController],
  providers: [
    QuestionProvider,
    QuestionService,
    SettingService,
    SettingProvider,
    UserService,
    UserProvider,
    FormProvider,
    TemplateProvider,
  ],
  exports: [QuestionService],
})
export class QuestionModule {}
