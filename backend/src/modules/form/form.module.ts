/**
 * @file Form module
 * @module module/form/module
 */

import { Module } from "@nestjs/common";
import { FormController } from "./form.controller";
import { FormProvider } from "./form.model";
import { UserProvider } from "../user/entities/user.entity";
import { UserService } from "../user/user.service";
import { SettingProvider } from "../settting/setting.model";
import { SettingService } from "../settting/setting.service";
import { MediaProvider } from "../media/media.model";
import { FormService } from "./form.service";
import { TemplateProvider } from "../template/template.model";
import { QuestionProvider } from "../question/question.model";
import { FeedbackProvider } from "../feedback/feedback.model";
import { FormRelationshipProvider } from "../form_relationship/form_relationship.model";
import { ChartService } from "../chart/chart.service";


@Module({
  imports: [],
  controllers: [FormController],
  providers: [
    FormProvider,
    FormService,
    UserProvider,
    UserService,
    SettingProvider,
    SettingService,
    MediaProvider,
    TemplateProvider,
    QuestionProvider,
    FeedbackProvider,
    FormRelationshipProvider,
    ChartService,
  ],
  exports: [FormService],
})
export class FormModule {}
