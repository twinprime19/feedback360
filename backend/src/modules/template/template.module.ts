import { Module } from "@nestjs/common";
import { TemplateService } from "./template.service";
import { TemplateController } from "./template.controller";
import { UserService } from "../user/user.service";
import { UserProvider } from "../user/entities/user.entity";
import { TemplateProvider } from "./template.model";
import { SettingService } from "../settting/setting.service";
import { SettingProvider } from "../settting/setting.model";
import { FormProvider } from "../form/form.model";

@Module({
  imports: [],
  controllers: [TemplateController],
  providers: [
    UserService,
    UserProvider,
    TemplateProvider,
    TemplateService,
    SettingService,
    SettingProvider,
    FormProvider,
  ],
  exports: [TemplateService],
})
export class TemplateModule {}
