import { Injectable } from "@nestjs/common";
import { InjectModel } from "@app/transformers/model.transformer";
import {
  MongooseDoc,
  MongooseID,
  MongooseModel,
} from "@app/interfaces/mongoose.interface";
import {
  PaginateOptions,
  PaginateQuery,
  PaginateResult,
} from "@app/utils/paginate";
import { PublishState } from "@app/constants/biz.constant";
import { AuthPayload } from "../auth/auth.interface";
import { UserService } from "../user/user.service";
import { Template } from "./template.model";
import { TemplateDTO } from "./template.dto";
import moment from "moment";

@Injectable()
export class TemplateService {
  constructor(
    @InjectModel(Template)
    private readonly templateModel: MongooseModel<Template>,
    private readonly userService: UserService
  ) {}

  // get list templates
  public async paginator(
    query: PaginateQuery<Template>,
    options: PaginateOptions
  ): Promise<PaginateResult<Template>> {
    return await this.templateModel.paginate(query, {
      ...options,
      lean: true,
    });
  }

  // get list templates
  async listTemplates(): Promise<Template[]> {
    let templates = await this.templateModel
      .find({ status: PublishState.Published, deletedBy: null })
      .exec()
      .then((result) => (result.length ? result : []));

    return templates;
  }

  // create template
  public async create(templateDTO: TemplateDTO, user: AuthPayload): Promise<Template> {
    //let userInfo = await this.userService.findByUserName(user.userName);
   // templateDTO.createdBy = userInfo._id;
    return await this.templateModel.create(templateDTO);
  }

  // get template by id
  async findOne(templateID: string): Promise<MongooseDoc<Template>> {
    let template = await this.templateModel
      .findOne({ _id: templateID, deletedBy: null })
      .exec()
      .then(
        (result) =>
          result ||
          Promise.reject(`Mẫu có ID "${templateID}" không được tìm thấy.`)
      );
    return template;
  }

  // update template
  public async update(
    templateID: MongooseID,
    templateDTO: Template,
    user: AuthPayload
  ): Promise<MongooseDoc<Template>> {
   // let userInfo = await this.userService.findByUserName(user.userName);
   // templateDTO.updatedBy = userInfo._id;

    const template = await this.templateModel
      .findByIdAndUpdate(templateID, templateDTO, { new: true })
      .exec();
    if (!template) throw `Mẫu có ID "${templateID}" không được tìm thấy.`;

    return template;
  }

  // update field status
  public async updateStatus(
    templateID: MongooseID,
    status: number,
    user: AuthPayload
  ): Promise<MongooseDoc<Template>> {
    let userInfo = await this.userService.findByUserName(user.userName);

    const template = await this.templateModel
      .findByIdAndUpdate(
        templateID,
        { status: status, updatedBy: userInfo._id },
        { new: true }
      )
      .exec();
    if (!template) throw `Mẫu có ID "${templateID}" không được tìm thấy.`;

    return template;
  }

  // delete template
  public async delete(
    templateID: MongooseID,
    user: AuthPayload
  ): Promise<MongooseDoc<Template>> {
    let userInfo = await this.userService.findByUserName(user.userName);

    const template = await this.templateModel
      .findByIdAndUpdate(
        templateID,
        {
          deletedBy: userInfo._id,
          deletedAt: moment(),
        },
        { new: true }
      )
      .exec();
    if (!template) throw `Mẫu có ID "${templateID}" không được tìm thấy.`;

    return template;
  }

  // delete templates
  public async batchDelete(templateIDs: MongooseID[], user: AuthPayload) {
    let userInfo = await this.userService.findByUserName(user.userName);

    const templates = await this.templateModel.find({ _id: { $in: templateIDs } }).exec();
    if (!templates) throw `Templates không được tìm thấy.`;

    return await this.templateModel
      .updateMany(
        { _id: { $in: templateIDs } },
        { deletedBy: userInfo._id, deletedAt: moment() },
        { new: true }
      )
      .exec();
  }
}
