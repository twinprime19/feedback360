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
import {
  PublishState,
  QuestionTypeState,
  RelationshipState,
} from "@app/constants/biz.constant";
import { Statistic } from "./statistic.model";
import { StatisticDTO } from "./statistic.dto";
import { AuthPayload } from "../auth/auth.interface";
import { Feedback } from "../feedback/feedback.model";
import { Form } from "../form/form.model";
import { Question } from "../question/question.model";
import moment from "moment";

@Injectable()
export class StatisticService {
  constructor(
    @InjectModel(Statistic)
    private readonly statisticModel: MongooseModel<Statistic>,
    @InjectModel(Feedback)
    private readonly feedbackModel: MongooseModel<Feedback>,
    @InjectModel(Form)
    private readonly formModel: MongooseModel<Form>,
    @InjectModel(Question)
    private readonly questionModel: MongooseModel<Question>,
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
    //let userInfo = await this.userService.findByUserName(user.userName);
    let feedbackInfo = await this.feedbackModel.findById(statisticDTO.feedback);
    if (!feedbackInfo) throw `Không tìm thấy form.`;

    let formInfo = await this.formModel.findById(feedbackInfo.form);
    if (!formInfo) throw `Không tìm thấy form.`;

    // phân tích kết quả
    let template = formInfo.template;
    let reviewQuestions = template.reviewQuestions;
    let answerQuestions = template.answerQuestions;

    let arrReviewQuestions: any = [];
    let arrAnswerQuestions: any = [];
    let arrQuestions: any = [];

    for (let qid of reviewQuestions) {
      let question = await this.questionModel.findById(qid);
      if (question && question.type === QuestionTypeState.POINT) {
        arrReviewQuestions.push(question);
        arrQuestions.push(question);
      }
    }

    for (let qid of answerQuestions) {
      let question = await this.questionModel.findById(qid);
      if (question && question.type === QuestionTypeState.POINT) {
        arrAnswerQuestions.push(question);
        arrQuestions.push(question);
      }
    }

    let results = statisticDTO.result;
    let statisticData: any = [];

    for (let questionObj of arrQuestions) {
      let newQuestion = {
        id: String(questionObj._id),
        title: questionObj.title,
        type: questionObj.type,
        selfPoint: 0,
        // senior: 0,
        // peer: 0,
        // subordinate: 0,

        senior_detail: {
          one: 0,
          two: 0,
          three: 0,
          four: 0,
          five: 0,
          ko: false,
          tc: true,
        },
        peer_detail: {
          one: 0,
          two: 0,
          three: 0,
          four: 0,
          five: 0,
          ko: false,
          tc: true,
        },
        subordinate_detail: {
          one: 0,
          two: 0,
          three: 0,
          four: 0,
          five: 0,
          ko: false,
          tc: true,
        },
      };

      let checkQuestion = results.find(
        (result) => result.question === String(questionObj._id)
      );
      if (checkQuestion) {
        if (statisticDTO.relationship === RelationshipState.SELF) {
          newQuestion.selfPoint = checkQuestion.point;
        }
        if (statisticDTO.relationship === RelationshipState.PEER) {
          if (checkQuestion.point === 0) newQuestion.peer_detail.ko = true;
          if (checkQuestion.point === 1) newQuestion.peer_detail.one = 1;
          if (checkQuestion.point === 2) newQuestion.peer_detail.one = 2;
          if (checkQuestion.point === 3) newQuestion.peer_detail.one = 3;
          if (checkQuestion.point === 4) newQuestion.peer_detail.one = 4;
          if (checkQuestion.point === 5) newQuestion.peer_detail.one = 5;
        }
        if (statisticDTO.relationship === RelationshipState.SENIOR) {
          if (checkQuestion.point === 0) newQuestion.senior_detail.ko = true;
          if (checkQuestion.point === 1) newQuestion.senior_detail.one = 1;
          if (checkQuestion.point === 2) newQuestion.senior_detail.one = 2;
          if (checkQuestion.point === 3) newQuestion.senior_detail.one = 3;
          if (checkQuestion.point === 4) newQuestion.senior_detail.one = 4;
          if (checkQuestion.point === 5) newQuestion.senior_detail.one = 5;
        }
        if (statisticDTO.relationship === RelationshipState.SUBORDINATE) {
          if (checkQuestion.point === 0)
            newQuestion.subordinate_detail.ko = true;
          if (checkQuestion.point === 1) newQuestion.subordinate_detail.one = 1;
          if (checkQuestion.point === 2) newQuestion.subordinate_detail.one = 2;
          if (checkQuestion.point === 3) newQuestion.subordinate_detail.one = 3;
          if (checkQuestion.point === 4) newQuestion.subordinate_detail.one = 4;
          if (checkQuestion.point === 5) newQuestion.subordinate_detail.one = 5;
        }
      }

      statisticData.push(newQuestion);
    }

    console.log("statisticData", statisticData);
    let dataDTO = {
      feedback: statisticDTO.feedback,
      form: feedbackInfo.form,
      user: feedbackInfo.user,
      fullname: statisticDTO.fullname,
      position: statisticDTO.position,
      result: statisticDTO.result,
      statisticData: statisticData,
      time: moment().format("YYYY-MM-DDTHH:mm:ss"),
      relationship: statisticDTO.relationship,
      //createdBy: userInfo._id,
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
