import { Injectable } from "@nestjs/common";
import { CreatePermissionDto } from "./dto/create-permission.dto";
import { UpdatePermissionDto } from "./dto/update-permission.dto";
import { InjectModel } from "@app/transformers/model.transformer";
import { MongooseModel, MongooseDoc } from "@app/interfaces/mongoose.interface";
import {
  PaginateResult,
  PaginateQuery,
  PaginateOptions,
} from "@app/utils/paginate";
import { Permission } from "./entities/permission.entity";

@Injectable()
export class PermissionService {
  constructor(
    @InjectModel(Permission)
    private readonly permissionModel: MongooseModel<Permission>
  ) {}

  // get permissions
  public paginator(
    query: PaginateQuery<Permission>,
    options: PaginateOptions
  ): Promise<PaginateResult<Permission>> {
    return this.permissionModel.paginate(query, {
      ...options,
    });
  }

  // create permission
  async create(
    createPermissionDto: CreatePermissionDto
  ): Promise<MongooseDoc<Permission>> {
    const per = await this.permissionModel.create(createPermissionDto);
    return per;
  }

  // create many permission
  async insertMany(createPermissionDto: CreatePermissionDto[]) {
    const per = await this.permissionModel.insertMany(createPermissionDto);
    return per;
  }

  // get all permissions
  async findAll() {
    return await this.permissionModel.find().exec();
  }

  // get permission by id
  async findOne(id: string) {
    return await this.permissionModel
      .findOne({ _id: id })
      .exec()
      .then(
        (result) => result || Promise.reject(`Permission '${id}' not found`)
      );
  }

  // update permission
  async update(id: string, updatePermissionDto: UpdatePermissionDto) {
    const per = await this.permissionModel
      .findByIdAndUpdate(id, updatePermissionDto as any, { new: true })
      .exec();
    if (!per) throw `Permission '${id}' not found`;

    return per;
  }

  // delete permission
  async remove(id: string) {
    const per = await this.permissionModel.findByIdAndRemove(id).exec();
    if (!per) throw `Permission '${id}' not found`;

    return per;
  }
}
