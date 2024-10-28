/**
 * @file Feedback service
 * @module module/feedback/service
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
import { Feedback } from "./feedback.model";
import { FeedbackDTO } from "./feedback.dto";
import { AuthPayload } from "../auth/auth.interface";
import { Form } from "../form/form.model";
import { Template } from "../template/template.model";
import { Question } from "../question/question.model";
import { FormRelationship } from "../form_relationship/form_relationship.model";
import moment from "moment";

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback)
    private readonly feedbackModel: MongooseModel<Feedback>,
    @InjectModel(Form)
    private readonly formModel: MongooseModel<Form>,
    @InjectModel(Template)
    private readonly templateModel: MongooseModel<Template>,
    @InjectModel(Question)
    private readonly questionModel: MongooseModel<Question>,
    @InjectModel(FormRelationship)
    private readonly formRelationshipModel: MongooseModel<FormRelationship>,
    private readonly userService: UserService
  ) {}

  // get list feedbacks
  public async paginator(
    query: PaginateQuery<Feedback>,
    options: PaginateOptions
  ): Promise<PaginateResult<Feedback>> {
    return await this.feedbackModel.paginate(query, {
      ...options,
      lean: true,
    });
  }

  // get list feedbacks
  async listFeedbacks(): Promise<Feedback[]> {
    let feedbacks = await this.feedbackModel
      .find({ status: PublishState.Published, deletedBy: null })
      .exec()
      .then((result) => (result.length ? result : []));

    return feedbacks;
  }

  // create feedback
  public async create(
    feedbackDTO: FeedbackDTO,
    user: AuthPayload
  ): Promise<Feedback> {
    //let userInfo = await this.userService.findByUserName(user.userName);
    let formInfo = await this.formModel.findById(feedbackDTO.form);
    if (!formInfo) throw `Không tìm thấy form.`;

    let formRelationshipInfo = await this.formRelationshipModel.findById(
      feedbackDTO.relationship_id
    );
    if (!formRelationshipInfo) throw `Không tìm thấy form.`;

    if (formRelationshipInfo.isSubmitted == true)
      throw `Bạn đã gửi phản hồi trước đó rồi.`;

    let templateInfo = await this.templateModel.findById(formInfo.template);
    if (!templateInfo) throw `Không tìm thấy template.`;

    let relationship = formRelationshipInfo.relationship;

    // phân tích kết quả
    let template = templateInfo.template;
    let reviewQuestions = template.reviewQuestions;
    let answerQuestions = template.answerQuestions;

    let arrReviewQuestions: any = [];
    let arrAnswerQuestions: any = [];

    for (let qid of reviewQuestions) {
      let question = await this.questionModel.findById(qid);
      if (question) {
        if (question.type === QuestionTypeState.POINT)
          arrReviewQuestions.push(question);
        else arrAnswerQuestions.push(question);
      }
    }

    for (let qid of answerQuestions) {
      let question = await this.questionModel.findById(qid);
      if (question) {
        if (question.type === QuestionTypeState.POINT)
          arrReviewQuestions.push(question);
        else arrAnswerQuestions.push(question);
      }
    }

    let results = feedbackDTO.result;
    let feedbackData: any = [];

    for (let questionObj of arrReviewQuestions) {
      let newQuestion = {
        id: String(questionObj._id),
        title: questionObj.title,
        type: questionObj.type,
        relationship: relationship,
        selfPoint: 0,
        // senior: 0,
        // peer: 0,
        // subordinate: 0,

        senior_detail: {
          point: 0,
          one: false,
          two: false,
          three: false,
          four: false,
          five: false,
          ko: false,
          tc: true,
        },
        peer_detail: {
          point: 0,
          one: false,
          two: false,
          three: false,
          four: false,
          five: false,
          ko: false,
          tc: true,
        },
        subordinate_detail: {
          point: 0,
          one: false,
          two: false,
          three: false,
          four: false,
          five: false,
          ko: false,
          tc: true,
        },
      };

      let checkQuestion = results.find(
        (result) => result.question === String(questionObj._id)
      );
      if (checkQuestion) {
        if (relationship === RelationshipState.SELF) {
          if (checkQuestion.point < 1) checkQuestion.point = 0;
          if (checkQuestion.point > 5) checkQuestion.point = 5;
          newQuestion.selfPoint = checkQuestion.point;
        }
        if (relationship === RelationshipState.PEER) {
          if (checkQuestion.point < 1) checkQuestion.point = 0;
          if (checkQuestion.point > 5) checkQuestion.point = 5;
          newQuestion.peer_detail.point = checkQuestion.point;

          if (checkQuestion.point === 0) newQuestion.peer_detail.ko = true;
          if (checkQuestion.point === 1) newQuestion.peer_detail.one = true;
          if (checkQuestion.point === 2) newQuestion.peer_detail.two = true;
          if (checkQuestion.point === 3) newQuestion.peer_detail.three = true;
          if (checkQuestion.point === 4) newQuestion.peer_detail.four = true;
          if (checkQuestion.point === 5) newQuestion.peer_detail.five = true;
        }
        if (relationship === RelationshipState.SENIOR) {
          if (checkQuestion.point < 1) checkQuestion.point = 0;
          if (checkQuestion.point > 5) checkQuestion.point = 5;
          newQuestion.senior_detail.point = checkQuestion.point;

          if (checkQuestion.point === 0) newQuestion.senior_detail.ko = true;
          if (checkQuestion.point === 1) newQuestion.senior_detail.one = true;
          if (checkQuestion.point === 2) newQuestion.senior_detail.two = true;
          if (checkQuestion.point === 3) newQuestion.senior_detail.three = true;
          if (checkQuestion.point === 4) newQuestion.senior_detail.four = true;
          if (checkQuestion.point === 5) newQuestion.senior_detail.five = true;
        }
        if (relationship === RelationshipState.SUBORDINATE) {
          if (checkQuestion.point < 1) checkQuestion.point = 0;
          if (checkQuestion.point > 5) checkQuestion.point = 5;
          newQuestion.subordinate_detail.point = checkQuestion.point;

          if (checkQuestion.point === 0)
            newQuestion.subordinate_detail.ko = true;
          if (checkQuestion.point === 1)
            newQuestion.subordinate_detail.one = true;
          if (checkQuestion.point === 2)
            newQuestion.subordinate_detail.two = true;
          if (checkQuestion.point === 3)
            newQuestion.subordinate_detail.three = true;
          if (checkQuestion.point === 4)
            newQuestion.subordinate_detail.four = true;
          if (checkQuestion.point === 5)
            newQuestion.subordinate_detail.five = true;
        }
      }

      feedbackData.push(newQuestion);
    }

    for (let questionObj of arrAnswerQuestions) {
      let newQuestion = {
        id: String(questionObj._id),
        title: questionObj.title,
        type: questionObj.type,
        relationship: relationship,
        answer: "",
      };

      let checkQuestion = results.find(
        (result) => result.question === String(questionObj._id)
      );
      if (checkQuestion) newQuestion.answer = checkQuestion.answer;

      feedbackData.push(newQuestion);
    }

    let dataDTO = {
      form: feedbackDTO.form,
      relationship_id: feedbackDTO.relationship_id,
      template: formInfo.template,
      user: formInfo.user,
      result: feedbackDTO.result,
      feedbackData: feedbackData,
      time: moment().format("YYYY-MM-DDTHH:mm:ss"),
      relationship: relationship,
      //createdBy: userInfo._id,
    };

    let feedbackInfo = await this.feedbackModel.create(dataDTO);
    await this.formRelationshipModel
      .findByIdAndUpdate(
        feedbackDTO.relationship_id,
        { isSubmitted: false },
        //{ isSubmitted: true },
        { new: true }
      )
      .exec();

    return feedbackInfo;
  }

  // get feedback by id
  async findOne(feedbackID: string): Promise<MongooseDoc<Feedback>> {
    let feedback = await this.feedbackModel
      .findOne({ _id: feedbackID, deletedBy: null })
      .exec()
      .then(
        (result) =>
          result ||
          Promise.reject(`Phản hồi có ID "${feedbackID}" không được tìm thấy.`)
      );
    return feedback;
  }
}
