import { Injectable } from "@nestjs/common";
import { InjectModel } from "@app/transformers/model.transformer";
import { Form } from "./entities/form.entity";
import { MongooseModel } from "@app/interfaces/mongoose.interface";
import { User } from "../user/entities/user.entity";

@Injectable()
export class FormService {
  constructor(
    @InjectModel(User) private readonly userModel: MongooseModel<User>,
    @InjectModel(Form) private readonly formModel: MongooseModel<Form>
  ) {}
}
