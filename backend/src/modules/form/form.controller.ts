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
  UseGuards,
} from "@nestjs/common";
import { FormService } from "./form.service";
import { UserService } from "../user/user.service";
import { SettingService } from "../settting/setting.service";
import { AdminMaybeGuard } from "@app/guards/admin-maybe.guard";
import { Responser } from "@app/decorators/responser.decorator";
import { PermissionPipe } from "@app/pipes/permission.pipe";
import { ExposePipe } from "@app/pipes/expose.pipe";
import { FormDTO, FormPaginateQueryDTO, ListEmailDTO } from "./form.dto";
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
    let { page, page_size, field, order, status, user, ...filters } = query;
    console.log("QUERYDATA", query);
    //let user = await this.userService.findByUserName(req.user.userName);
    page_size = page_size ?? 100;

    const paginateQuery: PaginateQuery<Form> = {};
    // search
    if (filters.keyword) {
      const trimmed = lodash.trim(filters.keyword);
      const keywordRegExp = new RegExp(trimmed, "i");
      paginateQuery.$or = [{ title: keywordRegExp }];
    }
    // filter by user
    if (user) paginateQuery.user = user;
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
  @Get(":id")
  @Responser.handle("Get form")
  findOne(@Param("id") formID: string): Promise<MongooseDoc<Form>> {
    return this.formService.findOne(formID);
  }

  // get form by id của form relationship
  @Get("/get/:id")
  @Responser.handle("Get form by id của form relationship")
  getForm(@Param("id") formID: string): Promise<MongooseDoc<any>> {
    return this.formService.getForm(formID);
  }

  // get relationship của form
  @Get("/get-relationship/:id")
  @Responser.handle("Get relationship của form")
  getRelationship(@Param("id") formID: string): Promise<MongooseDoc<any>> {
    return this.formService.getRelationship(formID);
  }

  // create form
  @Post("/add")
  @UseGuards(AdminOnlyGuard)
  @Responser.handle("Create form")
  createForm(@Req() req: any, @Body() form: FormDTO): Promise<Form> {
    return this.formService.create(form, req.user);
  }

  // send form
  @Post("/send")
  @UseGuards(AdminOnlyGuard)
  @Responser.handle("Send form")
  sendForm(@Req() req: any, @Body() body: ListEmailDTO) {
    return this.formService.sendForm(
      String(body.form),
      body.listEmailAddress,
      body.relationship,
      req.user
    );
  }

  // export result statistic of form
  @Get("/statistic/:id")
  async downloadPdf(@Param("id") formID: string, @Res() res: Response) {
    const { filename, buffer } = await this.formService.generatePdfFile(formID);

    // Mã hóa tên file theo RFC 5987 để xử lý ký tự tiếng Việt
    const safeFilename = encodeURIComponent(filename);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename*=UTF-8''${safeFilename}`,
    });

    res.send(buffer);
  }
}
