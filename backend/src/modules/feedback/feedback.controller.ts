/**
 * @file Feedback controller
 * @module module/feedback/controller
 */

import {
  Controller,
  UseGuards,
  Get,
  Query,
  Req,
  Param,
  Post,
  Body,
  Delete,
} from "@nestjs/common";
import { PermissionPipe } from "@app/pipes/permission.pipe";
import { ExposePipe } from "@app/pipes/expose.pipe";
import { Responser } from "@app/decorators/responser.decorator";
import {
  PaginateOptions,
  PaginateQuery,
  PaginateResult,
} from "@app/utils/paginate";
import { AdminOnlyGuard } from "@app/guards/admin-only.guard";
import { MongooseDoc } from "@app/interfaces/mongoose.interface";
import {
  FeedbackDTO,
  FeedbackPaginateQueryDTO,
  FeedbacksDTO,
} from "./feedback.dto";
import { FeedbackService } from "./feedback.service";
import { Feedback } from "./feedback.model";
import { PoliciesGuard } from "@app/guards/policies.guard";
import lodash from "lodash";

@Controller("feedback")
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // get list feedbacks
  @Get("/list-pagination")
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Responser.paginate()
  @Responser.handle("Get feedbacks")
  async find(
    @Req() req: any,
    @Query(PermissionPipe, ExposePipe) query: FeedbackPaginateQueryDTO
  ): Promise<PaginateResult<Feedback>> {
    let { page, page_size, field, order, status, form, ...filters } = query;

    const paginateQuery: PaginateQuery<Feedback> = {};
    // search
    if (filters.keyword) {
      const trimmed = lodash.trim(filters.keyword);
      const keywordRegExp = new RegExp(trimmed, "i");
      paginateQuery.$or = [{ assessor: keywordRegExp }];
    }
    //filter feedback have deletedBy = null
    paginateQuery.deletedBy = null;
    //filter feedback have form = form id
    paginateQuery.form = form;
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
    return this.feedbackService.paginator(paginateQuery, paginateOptions);
  }

  // get list feedbacks
  @Get("/list")
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Responser.handle("Get list feedbacks")
  listFeedbacks(): Promise<Feedback[]> {
    return this.feedbackService.listFeedbacks();
  }

  // get feedback
  @Get("/get/:id")
  @Responser.handle("Get feedback")
  findOne(@Param("id") feedbackID: string): Promise<MongooseDoc<Feedback>> {
    return this.feedbackService.findOne(feedbackID);
  }

  // create feedback
  @Post("/add")
  @Responser.handle("Create feedback")
  createFeedback(
    @Req() req: any,
    @Body() feedback: FeedbackDTO
  ): Promise<Feedback> {
    return this.feedbackService.create(feedback, req.user);
  }

  // delete one feedback
  @Delete("/delete/:id")
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Responser.handle("Delete feedback")
  delFeedback(
    @Req() req: any,
    @Param("id") feedbackID: string
  ): Promise<MongooseDoc<Feedback>> {
    return this.feedbackService.delete(feedbackID, req.user);
  }

  // delete many feedbacks
  @Delete("/delete")
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Responser.handle("Delete feedbacks")
  delFeedbacks(@Req() req: any, @Body() body: FeedbacksDTO) {
    return this.feedbackService.batchDelete(body.feedbackIds, req.user);
  }
}
