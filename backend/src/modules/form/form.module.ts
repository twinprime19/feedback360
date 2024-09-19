import { Module } from "@nestjs/common";
import { FormService } from "./form.service";
import { FormController } from "./form.controller";
import { UserService } from "../user/user.service";
import { UserProvider } from "../user/entities/user.entity";
import { FormProvider } from "./form.model";
import { SettingService } from "../settting/setting.service";
import { SettingProvider } from "../settting/setting.model";

@Module({
  imports: [],
  controllers: [FormController],
  providers: [
    UserService,
    UserProvider,
    FormProvider,
    FormService,
    SettingService,
    SettingProvider,
  ],
  exports: [FormService],
})
export class FormModule {}
