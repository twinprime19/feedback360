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
  Res,
  StreamableFile,
} from "@nestjs/common";
import { FeedbackService } from "./feedback.service";
import { UserService } from "../user/user.service";
import { SettingService } from "../settting/setting.service";
import { AdminMaybeGuard } from "@app/guards/admin-maybe.guard";
import { Responser } from "@app/decorators/responser.decorator";
import { PermissionPipe } from "@app/pipes/permission.pipe";
import { ExposePipe } from "@app/pipes/expose.pipe";
import { FeedbackDTO, FeedbackPaginateQueryDTO } from "./feedback.dto";
import { Feedback } from "./feedback.model";
import {
  PaginateOptions,
  PaginateQuery,
  PaginateResult,
} from "@app/utils/paginate";
import lodash from "lodash";
import { MongooseDoc } from "@app/interfaces/mongoose.interface";
import { AdminOnlyGuard } from "@app/guards/admin-only.guard";
import type { Response } from "express";

@Controller("feedback")
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
    private readonly userService: UserService,
    private readonly settingService: SettingService
  ) {}

  // get list feedbacks
  @Get()
  // @UseGuards(AdminMaybeGuard)
  @Responser.paginate()
  @Responser.handle("Get feedbacks")
  async find(
    @Req() req: any,
    @Query(PermissionPipe, ExposePipe) query: FeedbackPaginateQueryDTO
  ): Promise<PaginateResult<Feedback>> {
    let { page, page_size, field, order, status, ...filters } = query;
    console.log("QUERYDATA", query);
    //let user = await this.userService.findByUserName(req.user.userName);
    let setting = await this.settingService.getSetting();
    let pageSize = setting.web.find((item) => item.name === "page_size");
    page_size = Number(pageSize?.value) ?? 100;

    const paginateQuery: PaginateQuery<Feedback> = {};
    // search
    if (filters.keyword) {
      const trimmed = lodash.trim(filters.keyword);
      const keywordRegExp = new RegExp(trimmed, "i");
      paginateQuery.$or = [{ title: keywordRegExp }];
    }
    //filter feedback have deletedBy = null
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
    return this.feedbackService.paginator(paginateQuery, paginateOptions);
  }

  // get list feedbacks
  @Get("/list")
  @Responser.handle("Get list feedbacks")
  listFeedbacks(): Promise<Feedback[]> {
    return this.feedbackService.listFeedbacks();
  }

  // get feedback
  @Get(":id")
  @Responser.handle("Get feedback")
  findOne(@Param("id") feedbackID: string): Promise<MongooseDoc<Feedback>> {
    return this.feedbackService.findOne(feedbackID);
  }

  // create feedback
  @Post()
  // @UseGuards(AdminOnlyGuard)
  @Responser.handle("Create feedback")
  createFeedback(
    @Req() req: any,
    @Body() feedback: FeedbackDTO
  ): Promise<Feedback> {
    return this.feedbackService.create(feedback, req.user);
  }

  // export list products
  @Get("/download/:id")
  async downloadPdf(@Param("id") feedbackID: string, @Res() res: Response) {
    const filePath = await this.feedbackService.generatePdfFile(feedbackID);
    res.download(filePath);
  }
}
