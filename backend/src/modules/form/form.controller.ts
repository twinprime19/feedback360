/**
 * @file Form controller
 * @module module/form/controller
 */

import {
  Controller,
  Get,
  Query,
  Req,
  Param,
  Post,
  Body,
  Res,
} from "@nestjs/common";
import { FormService } from "./form.service";
import { UserService } from "../user/user.service";
import { SettingService } from "../settting/setting.service";
import { AdminMaybeGuard } from "@app/guards/admin-maybe.guard";
import { Responser } from "@app/decorators/responser.decorator";
import { PermissionPipe } from "@app/pipes/permission.pipe";
import { ExposePipe } from "@app/pipes/expose.pipe";
import { FormDTO, FormPaginateQueryDTO } from "./form.dto";
import { Form } from "./form.model";
import {
  PaginateOptions,
  PaginateQuery,
  PaginateResult,
} from "@app/utils/paginate";
import lodash from "lodash";
import { MongooseDoc } from "@app/interfaces/mongoose.interface";
import { AdminOnlyGuard } from "@app/guards/admin-only.guard";
import type { Response } from "express";

@Controller("form")
export class FormController {
  constructor(
    private readonly formService: FormService,
    private readonly userService: UserService,
    private readonly settingService: SettingService
  ) {}

  // get list forms
  @Get("/getAll")
  // @UseGuards(AdminMaybeGuard)
  @Responser.paginate()
  @Responser.handle("Get forms")
  async find(
    @Req() req: any,
    @Query(PermissionPipe, ExposePipe) query: FormPaginateQueryDTO
  ): Promise<PaginateResult<Form>> {
    let { page, page_size, field, order, status, ...filters } = query;
    console.log("QUERYDATA", query);
    //let user = await this.userService.findByUserName(req.user.userName);
    let setting = await this.settingService.getSetting();
    let pageSize = setting.web.find((item) => item.name === "page_size");
    page_size = Number(pageSize?.value) ?? 100;

    const paginateQuery: PaginateQuery<Form> = {};
    // search
    if (filters.keyword) {
      const trimmed = lodash.trim(filters.keyword);
      const keywordRegExp = new RegExp(trimmed, "i");
      paginateQuery.$or = [{ title: keywordRegExp }];
    }
    //filter form have deletedBy = null
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
    return this.formService.paginator(paginateQuery, paginateOptions);
  }

  // get list forms
  @Get("/list")
  @Responser.handle("Get list forms")
  listForms(): Promise<Form[]> {
    return this.formService.listForms();
  }

  // get form
  @Get("/get/:id")
  @Responser.handle("Get form")
  findOne(@Param("id") formID: string): Promise<MongooseDoc<Form>> {
    return this.formService.findOne(formID);
  }

  // create form
  @Post("/add")
  // @UseGuards(AdminOnlyGuard)
  @Responser.handle("Create form")
  createForm(@Req() req: any, @Body() form: FormDTO): Promise<Form> {
    return this.formService.create(form, req.user);
  }

  // export result statistic of form
  @Get("/statistic/:id")
  async downloadPdf(@Param("id") formID: string, @Res() res: Response) {
    const buffer = await this.formService.generatePdfFile(formID);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="report.pdf"',
    });

    res.send(buffer);
  }
}
