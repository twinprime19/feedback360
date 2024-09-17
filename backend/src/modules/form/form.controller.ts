import { Controller } from "@nestjs/common";
import { FormService } from "./form.service";

@Controller("form")
export class FormController {
  constructor(
    private readonly userService: FormService,
    private readonly formService: FormService
  ) {}
}
