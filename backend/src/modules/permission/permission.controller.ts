import lodash from "lodash";
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
} from "@nestjs/common";
import { PermissionService } from "./permission.service";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { UpdatePermissionDto } from "./dto/update-permission.dto";
import { PermissionPaginateQueryDTO } from "./dto/query-permission.dto";
import { Responser } from "@app/decorators/responser.decorator";
import {
  PaginateResult,
  PaginateQuery,
  PaginateOptions,
} from "@app/utils/paginate";
import { Permission } from "./entities/permission.entity";
import { AdminOnlyGuard } from "@app/guards/admin-only.guard";
import { PoliciesGuard } from "@app/guards/policies.guard";
@Controller("permission")
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  // create permission
  @Post()
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  // get permissions
  @Get()
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Responser.paginate()
  @Responser.handle("Get permissions")
  findAll(
    @Query() query: PermissionPaginateQueryDTO
  ): Promise<PaginateResult<Permission>> {
    const { page, page_size, sort, ...filters } = query;
    const paginateQuery: PaginateQuery<Permission> = {};
    // search
    if (filters.keyword) {
      const trimmed = lodash.trim(filters.keyword);
      const keywordRegExp = new RegExp(trimmed, "i");
      paginateQuery.$or = [{ name: keywordRegExp }];
    }

    const paginateOptions: PaginateOptions = { page, pageSize: page_size };
    return this.permissionService.paginator(paginateQuery, paginateOptions);
  }

  // get permission by id
  @Get(":id")
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  findOne(@Param("id") id: string) {
    return this.permissionService.findOne(id);
  }

  // update permission
  @Put(":id")
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  update(
    @Param("id") id: string,
    @Body() updatePermissionDto: UpdatePermissionDto
  ) {
    return this.permissionService.update(id, updatePermissionDto);
  }

  // delete permission
  @Delete(":id")
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  remove(@Param("id") id: string) {
    return this.permissionService.remove(id);
  }
}
