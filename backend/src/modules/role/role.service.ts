import { Injectable } from "@nestjs/common";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { Role } from "./entities/role.entity";
import { InjectModel } from "@app/transformers/model.transformer";
import { MongooseModel, MongooseDoc } from "@app/interfaces/mongoose.interface";
import {
  PaginateResult,
  PaginateQuery,
  PaginateOptions,
} from "@app/utils/paginate";
import { Permission } from "../permission/entities/permission.entity";

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role) private readonly roleModel: MongooseModel<Role>,
    @InjectModel(Permission)
    private readonly perModel: MongooseModel<Permission>
  ) {}

  // get roles
  public paginator(
    query: PaginateQuery<Role>,
    options: PaginateOptions
  ): Promise<PaginateResult<Role>> {
    return this.roleModel.paginate(query, {
      ...options,
    });
  }

  // create role
  async create(createRoleDto: CreateRoleDto) {
    const role = await this.roleModel.create(createRoleDto);
    return role;
  }

  // get all roles
  findAll() {
    return `This action returns all role`;
  }

  // get role by id
  async findOne(id: string): Promise<Role> {
    let roles = await this.roleModel
      .findOne({ _id: id })
      .exec()
      .then((result) => result || Promise.reject(`Role '${id}' not found`));
    return roles;
  }

  // update role
  async update(
    id: string,
    updateRoleDto: UpdateRoleDto
  ): Promise<MongooseDoc<Role>> {
    const tag = await this.roleModel
      .findByIdAndUpdate(id, updateRoleDto as any, { new: true })
      .exec();
    if (!tag) {
      throw `Tag '${id}' not found`;
    }
    return tag;
  }

  // delete role
  async remove(id: string): Promise<MongooseDoc<Role>> {
    const role = await this.roleModel.findByIdAndRemove(id).exec();
    if (!role) {
      throw `Role '${id}' not found`;
    }
    return role;
  }
}
