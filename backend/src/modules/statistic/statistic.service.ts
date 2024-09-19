/**
 * @file Statistic service
 * @module module/statistic/service
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@app/transformers/model.transformer";
import { MongooseDoc, MongooseModel } from "@app/interfaces/mongoose.interface";
import { UserService } from "../user/user.service";
import {
  PaginateOptions,
  PaginateQuery,
  PaginateResult,
} from "@app/utils/paginate";
import { PublishState } from "@app/constants/biz.constant";
import { Statistic } from "./statistic.model";
import { StatisticDTO } from "./statistic.dto";
import { AuthPayload } from "../auth/auth.interface";
import { Feedback } from "../feedback/feedback.model";
import moment from "moment";

@Injectable()
export class StatisticService {
  constructor(
    @InjectModel(Statistic)
    private readonly statisticModel: MongooseModel<Statistic>,
    @InjectModel(Feedback)
    private readonly feedbackModel: MongooseModel<Feedback>,
    private readonly userService: UserService
  ) {}

  // get list statistics
  public async paginator(
    query: PaginateQuery<Statistic>,
    options: PaginateOptions
  ): Promise<PaginateResult<Statistic>> {
    return await this.statisticModel.paginate(query, {
      ...options,
      lean: true,
    });
  }

  // get list statistics
  async listStatistics(): Promise<Statistic[]> {
    let statistics = await this.statisticModel
      .find({ status: PublishState.Published, deletedBy: null })
      .exec()
      .then((result) => (result.length ? result : []));

    return statistics;
  }

  // create statistic
  public async create(
    statisticDTO: StatisticDTO,
    user: AuthPayload
  ): Promise<Statistic> {
    let userInfo = await this.userService.findByUserName(user.userName);
    let feedbackInfo = await this.feedbackModel.findById(statisticDTO.feedback);
    if (!feedbackInfo) throw `Không tìm thấy form.`;

    let dataDTO = {
      feedback: statisticDTO.feedback,
      form: feedbackInfo.form,
      user: feedbackInfo.user,
      fullname: statisticDTO.fullname,
      position: statisticDTO.position,
      result: statisticDTO.result,
      time: moment().format("YYYY-MM-DDTHH:mm:ss"),
      createdBy: userInfo._id,
    };
    return await this.statisticModel.create(dataDTO);
  }

  // get statistic by id
  async findOne(statisticID: string): Promise<MongooseDoc<Statistic>> {
    let statistic = await this.statisticModel
      .findOne({ _id: statisticID, deletedBy: null })
      .exec()
      .then(
        (result) =>
          result ||
          Promise.reject(
            `Phân loại có ID "${statisticID}" không được tìm thấy.`
          )
      );
    return statistic;
  }
}
