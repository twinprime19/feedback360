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
  Patch,
  Req,
  StreamableFile,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto, UsersDTO } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { AdminOnlyGuard } from "@app/guards/admin-only.guard";
import { Responser } from "@app/decorators/responser.decorator";
import {
  PaginateResult,
  PaginateQuery,
  PaginateOptions,
} from "@app/utils/paginate";
import { User } from "./entities/user.entity";
import { UserPaginateQueryDTO } from "./dto/query-user.dto";
import { Role } from "../role/entities/role.entity";
import { RoleService } from "../role/role.service";
import {
  QueryParams,
  QueryParamsResult,
} from "@app/decorators/queryparams.decorator";
import { MongooseDoc } from "@app/interfaces/mongoose.interface";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";

@Controller("user")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService
  ) {}

  // create user
  @Post()
  // @UseGuards(AdminOnlyGuard, PoliciesGuard)
  async create(
    @Body() createUserDto: CreateUserDto
  ): Promise<MongooseDoc<User>> {
    createUserDto.password = await this.userService.hashPassword(
      createUserDto.password
    );
    return this.userService.create(createUserDto);
  }

  // get list users
  @Get()
  // @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Responser.paginate()
  @Responser.handle("Get users")
  findAll(@Query() query: UserPaginateQueryDTO): Promise<PaginateResult<User>> {
    const { page, page_size, field, order, status, ...filters } = query;
    const paginateQuery: PaginateQuery<User> = {};
    // search
    if (filters.keyword) {
      const trimmed = lodash.trim(filters.keyword);
      const keywordRegExp = new RegExp(trimmed, "i");
      paginateQuery.$or = [
        { fullName: keywordRegExp },
        { userName: keywordRegExp },
        { phone: keywordRegExp },
        { email: keywordRegExp },
      ];
    }
    // status
    if (!lodash.isUndefined(status)) {
      const queryState = status.split(",");
      paginateQuery.status = { $in: queryState };
    }
    //filter user have deletedBy = null
    paginateQuery.deletedBy = null;
    paginateQuery.isSuperAdmin = false;
    const paginateOptions: PaginateOptions = { page, pageSize: page_size };
    if (field && order) {
      const setSort = {};
      setSort[field] = order;
      paginateOptions.sort = setSort;
    }
    return this.userService.paginator(paginateQuery, paginateOptions);
  }

  //import users
  @Post("/import")
  // @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Responser.handle("Import list users")
  @UseInterceptors(FileInterceptor("file"))
  public async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any
  ): Promise<User[]> {
    if (!file)
      throw new BadRequestException("File is not excel or no file attached !");

    return await this.userService.importUsers(file, req.user);
  }

  // export list users
  @Post("/export")
  // @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Responser.handle("Export list users")
  async export(
    @Query() query: UserPaginateQueryDTO,
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {
    const { page, page_size, field, order, status, ...filters } = query;
    console.log("QUERYDATA", query);

    const paginateQuery: PaginateQuery<User> = {};
    // search
    if (filters.keyword) {
      const trimmed = lodash.trim(filters.keyword);
      const keywordRegExp = new RegExp(trimmed, "i");
      paginateQuery.$or = [
        { fullName: keywordRegExp },
        { userName: keywordRegExp },
        { phone: keywordRegExp },
        { email: keywordRegExp },
      ];
    }
    // status
    if (!lodash.isUndefined(status)) {
      const queryState = status.split(",");
      paginateQuery.status = { $in: queryState };
    }
    //filter user have deletedBy = null
    paginateQuery.deletedBy = null;
    paginateQuery.isSuperAdmin = false;
    const paginateOptions: PaginateOptions = {};
    if (field && order) {
      const setSort = {};
      setSort[field] = order;
      paginateOptions.sort = setSort;
    }

    let buffer = await this.userService.exportUsers(
      paginateQuery,
      paginateOptions
    );
    res.set({
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename=users.xlsx`,
    });
    return new StreamableFile(buffer);
  }

  // get init roles
  @Get("init-roles")
  // @UseGuards(AdminOnlyGuard, PoliciesGuard)
  @Responser.paginate()
  @Responser.handle("Get init roles")
  findAllRoles(): Promise<PaginateResult<Role>> {
    const paginateQuery: PaginateQuery<Role> = {};
    const paginateOptions: PaginateOptions = {};
    return this.roleService.paginator(paginateQuery, paginateOptions);
  }

  // get user by id
  @Get(":id")
  @UseGuards(AdminOnlyGuard)
  findOne(@Param("id") userID: string): Promise<MongooseDoc<User>> {
    return this.userService.findOne(userID);
  }

  // update user
  @Put(":id")
  @UseGuards(AdminOnlyGuard)
  async update(
    @Param("id") userID: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<MongooseDoc<User>> {
    if (updateUserDto.password) {
      updateUserDto.password = await this.userService.hashPassword(
        updateUserDto.password
      );
    } else {
      delete updateUserDto.password;
    }

    return this.userService.update(userID, updateUserDto);
  }

  // update status user
  @Patch(":id")
  @UseGuards(AdminOnlyGuard)
  @Responser.handle("Update status user")
  async updateStatus(
    @Param("id") userID: string,
    @Body() newUser: { status: number }
  ): Promise<MongooseDoc<User>> {
    return this.userService.updateStatus(userID, newUser.status);
  }

  // delete user
  @Delete(":id")
  // @UseGuards(AdminOnlyGuard, PoliciesGuard)
  remove(
    @Req() req: any,
    @QueryParams() { params }: QueryParamsResult
  ): Promise<MongooseDoc<User>> {
    return this.userService.remove(params.id, req.user);
  }

  // delete many users
  @Delete()
  @UseGuards(AdminOnlyGuard)
  @Responser.handle("Delete users")
  delUsers(@Req() req: any, @Body() body: UsersDTO) {
    return this.userService.batchDelete(body.userIds, req.user);
  }
}
