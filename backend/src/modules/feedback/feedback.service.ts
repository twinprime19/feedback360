/**
 * @file Feedback service
 * @module module/feedback/service
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@app/transformers/model.transformer";
import { MongooseModel } from "@app/interfaces/mongoose.interface";
import { Feedback } from "./feedback.model";
import { UserService } from "../user/user.service";

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback)
    private readonly feedbackModel: MongooseModel<Feedback>,
    private readonly userService: UserService
  ) {}
}
