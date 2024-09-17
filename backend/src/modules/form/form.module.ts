import { Module } from "@nestjs/common";
import { FormService } from "./form.service";
import { FormController } from "./form.controller";
import { UserService } from "../user/user.service";
import { UserProvider } from "../user/entities/user.entity";
import { FormProvider } from "./entities/form.entity";

@Module({
  imports: [],
  controllers: [FormController],
  providers: [UserService, UserProvider, FormProvider, FormService],
  exports: [FormService],
})
export class FormModule {}
