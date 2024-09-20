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
import { FormService } from "./form.service";
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
import { FormDTO, FormPaginateQueryDTO, FormsDTO } from "./form.dto";
import { SettingService } from "../settting/setting.service";
import { AdminOnlyGuard } from "@app/guards/admin-only.guard";
import { MongooseDoc } from "@app/interfaces/mongoose.interface";
import { Form } from "./form.model";
import lodash from "lodash";
@Controller("form")
export class FormController {
  constructor(
    private readonly userService: UserService,
    private readonly formService: FormService,
    private readonly settingService: SettingService
  ) {}

  // get list forms
  @Get()
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
  @Get(":id")
  //@Responser.handle("Get form")
  findOne(@Param("id") formID: string): Promise<MongooseDoc<Form>> {
    return this.formService.findOne(formID);
  }

  // create form
  @Post()
  //@UseGuards(AdminOnlyGuard)
  @Responser.handle("Create form")
  createForm(@Req() req: any, @Body() form: FormDTO): Promise<Form> {
    return this.formService.create(form, req.user);
  }

  // update form
  @Put(":id")
 // @UseGuards(AdminOnlyGuard)
  @Responser.handle("Update form")
  updateForm(
    @Req() req: any,
    @Param("id") formID: string,
    @Body() form: Form
  ): Promise<MongooseDoc<Form>> {
    return this.formService.update(formID, form, req.user);
  }

  // update status form
  @Patch(":id")
  //@UseGuards(AdminOnlyGuard)
  @Responser.handle("Update form status")
  updateStatus(
    @Req() req: any,
    @Param("id") formID: string,
    @Body() form: { status: number }
  ): Promise<MongooseDoc<Form>> {
    return this.formService.updateStatus(formID, form.status, req.user);
  }

  // delete one form
  @Delete(":id")
 // @UseGuards(AdminOnlyGuard)
  @Responser.handle("Delete form")
  delForm(
    @Req() req: any,
    @Param("id") formID: string
  ): Promise<MongooseDoc<Form>> {
    return this.formService.delete(formID, req.user);
  }

  // delete many forms
  @Delete()
 // @UseGuards(AdminOnlyGuard)
  @Responser.handle("Delete forms")
  delForms(@Req() req: any, @Body() body: FormsDTO) {
    return this.formService.batchDelete(body.formIds, req.user);
  }
}
