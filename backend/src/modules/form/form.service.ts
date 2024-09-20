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
import { Form } from "./form.model";
import { FormDTO } from "./form.dto";
import moment from "moment";

@Injectable()
export class FormService {
  constructor(
    @InjectModel(Form)
    private readonly formModel: MongooseModel<Form>,
    private readonly userService: UserService
  ) {}

  // get list forms
  public async paginator(
    query: PaginateQuery<Form>,
    options: PaginateOptions
  ): Promise<PaginateResult<Form>> {
    return await this.formModel.paginate(query, {
      ...options,
      lean: true,
    });
  }

  // get list forms
  async listForms(): Promise<Form[]> {
    let forms = await this.formModel
      .find({ status: PublishState.Published, deletedBy: null })
      .exec()
      .then((result) => (result.length ? result : []));

    return forms;
  }

  // create form
  public async create(formDTO: FormDTO, user: AuthPayload): Promise<Form> {
    //let userInfo = await this.userService.findByUserName(user.userName);
   // formDTO.createdBy = userInfo._id;
    return await this.formModel.create(formDTO);
  }

  // get form by id
  async findOne(formID: string): Promise<MongooseDoc<Form>> {
    let form = await this.formModel
      .findOne({ _id: formID, deletedBy: null })
      .exec()
      .then(
        (result) =>
          result ||
          Promise.reject(`Phân loại có ID "${formID}" không được tìm thấy.`)
      );
    return form;
  }

  // update form
  public async update(
    formID: MongooseID,
    formDTO: Form,
    user: AuthPayload
  ): Promise<MongooseDoc<Form>> {
   // let userInfo = await this.userService.findByUserName(user.userName);
   // formDTO.updatedBy = userInfo._id;

    const form = await this.formModel
      .findByIdAndUpdate(formID, formDTO, { new: true })
      .exec();
    if (!form) throw `Phân loại có ID "${formID}" không được tìm thấy.`;

    return form;
  }

  // update field status
  public async updateStatus(
    formID: MongooseID,
    status: number,
    user: AuthPayload
  ): Promise<MongooseDoc<Form>> {
    let userInfo = await this.userService.findByUserName(user.userName);

    const form = await this.formModel
      .findByIdAndUpdate(
        formID,
        { status: status, updatedBy: userInfo._id },
        { new: true }
      )
      .exec();
    if (!form) throw `Phân loại có ID "${formID}" không được tìm thấy.`;

    return form;
  }

  // delete form
  public async delete(
    formID: MongooseID,
    user: AuthPayload
  ): Promise<MongooseDoc<Form>> {
    let userInfo = await this.userService.findByUserName(user.userName);

    const form = await this.formModel
      .findByIdAndUpdate(
        formID,
        {
          deletedBy: userInfo._id,
          deletedAt: moment(),
        },
        { new: true }
      )
      .exec();
    if (!form) throw `Phân loại có ID "${formID}" không được tìm thấy.`;

    return form;
  }

  // delete forms
  public async batchDelete(formIDs: MongooseID[], user: AuthPayload) {
    let userInfo = await this.userService.findByUserName(user.userName);

    const forms = await this.formModel.find({ _id: { $in: formIDs } }).exec();
    if (!forms) throw `Forms không được tìm thấy.`;

    return await this.formModel
      .updateMany(
        { _id: { $in: formIDs } },
        { deletedBy: userInfo._id, deletedAt: moment() },
        { new: true }
      )
      .exec();
  }
}
