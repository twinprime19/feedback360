/**
 * @file Feedback controller
 * @module module/Feedback/controller
 */

import { Controller } from "@nestjs/common";
import { FeedbackService } from "./feedback.service";
import { UserService } from "../user/user.service";
import { SettingService } from "../settting/setting.service";

@Controller("Feedback")
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly userService: UserService,
    private readonly settingService: SettingService
  ) {}
}
