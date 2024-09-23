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
import { TemplateService } from "./template.service";
import { AdminMaybeGuard } from "@app/guards/admin-maybe.guard";
import { PermissionPipe } from "@app/pipes/permission.pipe";
import { ExposePipe } from "@app/pipes/expose.pipe";
import { Responser } from "@app/decorators/responser.decorator";
import {
  PaginateOptions,
  PaginateQuery,
  PaginateResult,
} from "@app/utils/paginate";
import { UserService } from "../user/user.service";
import {
  TemplateDTO,
  TemplatePaginateQueryDTO,
  TemplatesDTO,
} from "./template.dto";
import { SettingService } from "../settting/setting.service";
import { AdminOnlyGuard } from "@app/guards/admin-only.guard";
import { MongooseDoc } from "@app/interfaces/mongoose.interface";
import { Template } from "./template.model";
import lodash from "lodash";

@Controller("template")
export class TemplateController {
  constructor(
    private readonly userService: UserService,
    private readonly templateService: TemplateService,
    private readonly settingService: SettingService
  ) {}

  // get list templates
  @Get("/getAll")
  // @UseGuards(AdminMaybeGuard)
  @Responser.paginate()
  @Responser.handle("Get templates")
  async find(
    @Req() req: any,
    @Query(PermissionPipe, ExposePipe) query: TemplatePaginateQueryDTO
  ): Promise<PaginateResult<Template>> {
    let { page, page_size, field, order, status, ...filters } = query;
    console.log("QUERYDATA", query);
    //let user = await this.userService.findByUserName(req.user.userName);
    page_size = page_size ?? 100;

    const paginateQuery: PaginateQuery<Template> = {};
    // search
    if (filters.keyword) {
      const trimmed = lodash.trim(filters.keyword);
      const keywordRegExp = new RegExp(trimmed, "i");
      paginateQuery.$or = [{ title: keywordRegExp }];
    }
    //filter template have deletedBy = null
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
    return this.templateService.paginator(paginateQuery, paginateOptions);
  }

  // get list templates
  @Get("/list")
  @Responser.handle("Get list templates")
  listTemplates(): Promise<Template[]> {
    return this.templateService.listTemplates();
  }

  // get template
  @Get("/get/:id")
  //@Responser.handle("Get template")
  findOne(@Param("id") templateID: string): Promise<MongooseDoc<Template>> {
    return this.templateService.findOne(templateID);
  }

  // create template
  @Post("/add")
  //@UseGuards(AdminOnlyGuard)
  @Responser.handle("Create template")
  createTemplate(
    @Req() req: any,
    @Body() template: TemplateDTO
  ): Promise<Template> {
    return this.templateService.create(template, req.user);
  }

  // update template
  @Put("/edit/:id")
  // @UseGuards(AdminOnlyGuard)
  @Responser.handle("Update template")
  updateTemplate(
    @Req() req: any,
    @Param("id") templateID: string,
    @Body() template: Template
  ): Promise<MongooseDoc<Template>> {
    return this.templateService.update(templateID, template, req.user);
  }

  // update status template
  @Patch("/edit/:id")
  //@UseGuards(AdminOnlyGuard)
  @Responser.handle("Update template status")
  updateStatus(
    @Req() req: any,
    @Param("id") templateID: string,
    @Body() template: { status: number }
  ): Promise<MongooseDoc<Template>> {
    return this.templateService.updateStatus(
      templateID,
      template.status,
      req.user
    );
  }

  // delete one template
  @Delete("/delete/:id")
  // @UseGuards(AdminOnlyGuard)
  @Responser.handle("Delete template")
  delTemplate(
    @Req() req: any,
    @Param("id") templateID: string
  ): Promise<MongooseDoc<Template>> {
    return this.templateService.delete(templateID, req.user);
  }

  // delete many templates
  @Delete("/delete")
  // @UseGuards(AdminOnlyGuard)
  @Responser.handle("Delete templates")
  delTemplates(@Req() req: any, @Body() body: TemplatesDTO) {
    return this.templateService.batchDelete(body.templateIds, req.user);
  }
}
