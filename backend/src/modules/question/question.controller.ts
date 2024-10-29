/**
 * @file Question controller
 * @module module/question/controller
 */

import {
  Controller,
  UseGuards,
  Get,
  Query,
  Req,
  Param,
  Delete,
  Post,
  Body,
  Put,
  Patch,
} from "@nestjs/common";
import { PermissionPipe } from "@app/pipes/permission.pipe";
import { ExposePipe } from "@app/pipes/expose.pipe";
import { Responser } from "@app/decorators/responser.decorator";
import {
  PaginateOptions,
  PaginateQuery,
  PaginateResult,
} from "@app/utils/paginate";
import {
  QuestionDTO,
  QuestionPaginateQueryDTO,
  QuestionsDTO,
} from "./question.dto";
import { Question } from "./question.model";
import { QuestionService } from "./question.service";
import { AdminOnlyGuard } from "@app/guards/admin-only.guard";
import { MongooseDoc } from "@app/interfaces/mongoose.interface";
import { PoliciesGuard } from "@app/guards/policies.guard";
import lodash from "lodash";

@Controller("question")
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  // get list questions
  @Get("/getAll")
  @Responser.paginate()
  @Responser.handle("Get questions")
  async find(
    @Req() req: any,
    @Query(PermissionPipe, ExposePipe) query: QuestionPaginateQueryDTO
  ): Promise<PaginateResult<Question>> {
    let { page, page_size, field, order, status, type, ...filters } = query;
    console.log("QUERYDATA", query);

    const paginateQuery: PaginateQuery<Question> = {};
    // search
    if (filters.keyword) {
      const trimmed = lodash.trim(filters.keyword);
      const keywordRegExp = new RegExp(trimmed, "i");
      paginateQuery.$or = [
        { title: keywordRegExp },
        { content: keywordRegExp },
      ];
    }
    //filter type point/text
    if (type) paginateQuery.type = Number(type);
    //filter question have deletedBy = null
    paginateQuery.deletedBy = null;
    // status
    if (!lodash.isUndefined(status)) {
      const queryState = status.split(",");
      paginateQuery.status = { $in: queryState };
    }
    const paginateOptions: PaginateOptions = { page, pageSize: page_size };
    // sort
    if (field && order) {
      const setSort = {};
      setSort[field] = order;
      paginateOptions.sort = setSort;
    }
    return this.questionService.paginator(paginateQuery, paginateOptions);
  }

  // get list questions
  @Get("/list")
  @Responser.handle("Get list questions")
  listQuestions(): Promise<Question[]> {
    return this.questionService.listQuestions();
  }

  // get question
  @Get("/get/:id")
  @Responser.handle("Get question")
  findOne(@Param("id") questionID: string): Promise<MongooseDoc<Question>> {
    return this.questionService.findOne(questionID);
  }

  // create question
  @Post("/add")
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Responser.handle("Create question")
  createQuestion(
    @Req() req: any,
    @Body() question: QuestionDTO
  ): Promise<Question> {
    return this.questionService.create(question, req.user);
  }

  // update question
  @Put("/edit/:id")
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Responser.handle("Update question")
  updateQuestion(
    @Req() req: any,
    @Param("id") questionID: string,
    @Body() question: Question
  ): Promise<MongooseDoc<Question>> {
    return this.questionService.update(questionID, question, req.user);
  }

  // update status question
  @Patch("/edit/:id")
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Responser.handle("Update question status")
  updateStatus(
    @Req() req: any,
    @Param("id") questionID: string,
    @Body() question: { status: number }
  ): Promise<MongooseDoc<Question>> {
    return this.questionService.updateStatus(
      questionID,
      question.status,
      req.user
    );
  }

  // delete one question
  @Delete("/delete/:id")
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Responser.handle("Delete question")
  delQuestion(
    @Req() req: any,
    @Param("id") questionID: string
  ): Promise<MongooseDoc<Question>> {
    return this.questionService.delete(questionID, req.user);
  }

  // delete many questions
  @Delete("/delete")
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Responser.handle("Delete questions")
  delQuestions(@Req() req: any, @Body() body: QuestionsDTO) {
    return this.questionService.batchDelete(body.questionIds, req.user);
  }
}
