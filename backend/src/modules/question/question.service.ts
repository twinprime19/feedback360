/**
 * @file Question service
 * @module module/question/service
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@app/transformers/model.transformer";
import {
  MongooseDoc,
  MongooseID,
  MongooseModel,
} from "@app/interfaces/mongoose.interface";
import {
  PaginateOptions,
  PaginateQuery,
  PaginateResult,
} from "@app/utils/paginate";
import { Question } from "./question.model";
import { PublishState } from "@app/constants/biz.constant";
import { QuestionDTO } from "./question.dto";
import { AuthPayload } from "../auth/auth.interface";
import { UserService } from "../user/user.service";
import moment from "moment";

@Injectable()
export class QuestionService {
  constructor(
    @InjectModel(Question)
    private readonly questionModel: MongooseModel<Question>,
    private readonly userService: UserService
  ) {}

  // get list questions
  public async paginator(
    query: PaginateQuery<Question>,
    options: PaginateOptions
  ): Promise<PaginateResult<Question>> {
    return await this.questionModel.paginate(query, {
      ...options,
      lean: true,
    });
  }

  // get list questions
  async listQuestions(): Promise<Question[]> {
    let questions = await this.questionModel
      .find({ status: PublishState.Published, deletedBy: null })
      .exec()
      .then((result) => (result.length ? result : []));

    return questions;
  }

  // create question
  public async create(
    questionDTO: QuestionDTO,
    user: AuthPayload
  ): Promise<Question> {
    //let userInfo = await this.userService.findByUserName(user.userName);
    //questionDTO.createdBy = userInfo._id;
    return await this.questionModel.create(questionDTO);
  }

  // get question by id
  async findOne(questionID: string): Promise<MongooseDoc<Question>> {
    let question = await this.questionModel
      .findOne({ _id: questionID, deletedBy: null })
      .exec()
      .then(
        (result) =>
          result ||
          Promise.reject(`Câu hỏi có ID "${questionID}" không được tìm thấy.`)
      );
    return question;
  }

  // update question
  public async update(
    questionID: MongooseID,
    questionDTO: Question,
    user: AuthPayload
  ): Promise<MongooseDoc<Question>> {
   // let userInfo = await this.userService.findByUserName(user.userName);
   // questionDTO.updatedBy = userInfo._id;

    const question = await this.questionModel
      .findByIdAndUpdate(questionID, questionDTO, { new: true })
      .exec();
    if (!question) throw `Câu hỏi có ID "${questionID}" không được tìm thấy.`;

    return question;
  }

  // update field status
  public async updateStatus(
    questionID: MongooseID,
    status: number,
    user: AuthPayload
  ): Promise<MongooseDoc<Question>> {
    // let userInfo = await this.userService.findByUserName(user.userName);

    const question = await this.questionModel
      .findByIdAndUpdate(
        questionID,
        { status: status, /* updatedBy: userInfo._id */ },
        { new: true }
      )
      .exec();
    if (!question) throw `Câu hỏi có ID "${questionID}" không được tìm thấy.`;

    return question;
  }

  // delete question
  public async delete(
    questionID: MongooseID,
    user: AuthPayload
  ): Promise<MongooseDoc<Question>> {
    // let userInfo = await this.userService.findByUserName(user.userName);

    const question = await this.questionModel
      .findByIdAndUpdate(
        questionID,
        {
          /* deletedBy: userInfo._id, */
          deletedAt: moment(),
        },
        { new: true }
      )
      .exec();
    if (!question) throw `Câu hỏi có ID "${questionID}" không được tìm thấy.`;

    return question;
  }

  // delete questions
  public async batchDelete(questionIDs: MongooseID[], user: AuthPayload) {
    //let userInfo = await this.userService.findByUserName(user.userName);

    const questions = await this.questionModel
      .find({ _id: { $in: questionIDs } })
      .exec();
    if (!questions) throw `Questions không được tìm thấy.`;

    return await this.questionModel
      .updateMany(
        { _id: { $in: questionIDs } },
        { /* deletedBy: userInfo._id, */ deletedAt: moment() },
        { new: true }
      )
      .exec();
  }
}
