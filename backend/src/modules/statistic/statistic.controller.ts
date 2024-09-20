/**
 * @file Statistic controller
 * @module module/statistic/controller
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
} from "@nestjs/common";
import { AdminMaybeGuard } from "@app/guards/admin-maybe.guard";
import { PermissionPipe } from "@app/pipes/permission.pipe";
import { ExposePipe } from "@app/pipes/expose.pipe";
import { Responser } from "@app/decorators/responser.decorator";
import {
  PaginateOptions,
  PaginateQuery,
  PaginateResult,
} from "@app/utils/paginate";
import { SettingService } from "../settting/setting.service";
import { AdminOnlyGuard } from "@app/guards/admin-only.guard";
import { MongooseDoc } from "@app/interfaces/mongoose.interface";
import { UserService } from "../user/user.service";
import { StatisticDTO, StatisticPaginateQueryDTO } from "./statistic.dto";
import { StatisticService } from "./statistic.service";
import { Statistic } from "./statistic.model";
import lodash from "lodash";

@Controller("statistic")
export class StatisticController {
  constructor(
    private readonly statisticService: StatisticService,
    private readonly userService: UserService,
    private readonly settingService: SettingService
  ) {}

  // get list statistics
  @Get()
 // @UseGuards(AdminMaybeGuard)
  @Responser.paginate()
  @Responser.handle("Get statistics")
  async find(
    @Req() req: any,
    @Query(PermissionPipe, ExposePipe) query: StatisticPaginateQueryDTO
  ): Promise<PaginateResult<Statistic>> {
    let { page, page_size, field, order, status, ...filters } = query;
    console.log("QUERYDATA", query);
    //let user = await this.userService.findByUserName(req.user.userName);
    let setting = await this.settingService.getSetting();
    let pageSize = setting.web.find((item) => item.name === "page_size");
    page_size = Number(pageSize?.value) ?? 100;

    const paginateQuery: PaginateQuery<Statistic> = {};
    // search
    if (filters.keyword) {
      const trimmed = lodash.trim(filters.keyword);
      const keywordRegExp = new RegExp(trimmed, "i");
      paginateQuery.$or = [
        { title: keywordRegExp },
        { description: keywordRegExp },
      ];
    }
    //filter statistic have deletedBy = null
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
    return this.statisticService.paginator(paginateQuery, paginateOptions);
  }

  // get list statistics
  @Get("/list")
  @Responser.handle("Get list statistics")
  listStatistics(): Promise<Statistic[]> {
    return this.statisticService.listStatistics();
  }

  // get statistic
  @Get(":id")
  @Responser.handle("Get statistic")
  findOne(@Param("id") statisticID: string): Promise<MongooseDoc<Statistic>> {
    return this.statisticService.findOne(statisticID);
  }

  // create statistic
  @Post()
  //@UseGuards(AdminOnlyGuard)
  @Responser.handle("Create statistic")
  createStatistic(
    @Req() req: any,
    @Body() statistic: StatisticDTO
  ): Promise<Statistic> {
    return this.statisticService.create(statistic, req.user);
  }
}
