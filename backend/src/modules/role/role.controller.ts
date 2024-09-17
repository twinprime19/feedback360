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
import { RoleService } from "./role.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { RolePaginateQueryDTO } from "./dto/query-role.dto";
import { Responser } from "@app/decorators/responser.decorator";
import {
  PaginateResult,
  PaginateQuery,
  PaginateOptions,
} from "@app/utils/paginate";
import { Role } from "./entities/role.entity";
import { AdminOnlyGuard } from "@app/guards/admin-only.guard";
import { PoliciesGuard } from "@app/guards/policies.guard";
import { SortType } from "@app/constants/biz.constant";
import { Permission } from "../permission/entities/permission.entity";
import { PermissionService } from "../permission/permission.service";

@Controller("role")
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
    private readonly permissionService: PermissionService
  ) {}

  // create role
  @Post()
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  // get roles
  @Get()
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Responser.paginate()
  @Responser.handle("Get roles")
  findAll(@Query() query: RolePaginateQueryDTO): Promise<PaginateResult<Role>> {
    const { page, page_size, sort, state, keySort, valueSort, ...filters } =
      query;
    const paginateQuery: PaginateQuery<Role> = {};
    // search
    if (filters.keyword) {
      const trimmed = lodash.trim(filters.keyword);
      const keywordRegExp = new RegExp(trimmed, "i");
      paginateQuery.$or = [{ name: keywordRegExp }];
    }

    // state
    if (!lodash.isUndefined(state)) {
      const queryState = state.split(",");
      paginateQuery.state = { $in: queryState };
    }

    const paginateOptions: PaginateOptions = { page, pageSize: page_size };
    // sort
    if (keySort && valueSort) {
      const setSort = {};
      setSort[keySort] = valueSort;
      paginateOptions.sort = setSort;
    }
    return this.roleService.paginator(paginateQuery, paginateOptions);
  }

  // get init permissions
  @Get("init-permissions")
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Responser.paginate()
  @Responser.handle("Get init permissions")
  findAllPermissions(): Promise<PaginateResult<Permission>> {
    const paginateQuery: PaginateQuery<Permission> = {};
    const paginateOptions: PaginateOptions = {};
    return this.permissionService.paginator(paginateQuery, paginateOptions);
  }

  // get role by id
  @Get(":id")
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  findOne(@Param("id") id: string) {
    return this.roleService.findOne(id);
  }

  // update role
  @Put(":id")
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  update(@Param("id") id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(id, updateRoleDto);
  }

  // delete role
  @Delete(":id")
  @UseGuards(AdminOnlyGuard, PoliciesGuard)
  remove(@Param("id") id: string) {
    return this.roleService.remove(id);
  }
}
