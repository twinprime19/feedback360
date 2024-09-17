/**
 * @file Feedback model
 * @module module/Feedback/model
 */

import { AutoIncrementID } from "@typegoose/auto-increment";
import { prop, plugin, modelOptions, Ref } from "@typegoose/typegoose";
import { IsOptional } from "class-validator";
import { generalAutoIncrementIDConfig } from "@app/constants/increment.constant";
import { getProviderByTypegooseClass } from "@app/transformers/model.transformer";
import { mongoosePaginate } from "@app/utils/paginate";
import { User } from "../user/entities/user.entity";
import { Form } from "../form/entities/form.entity";

@plugin(mongoosePaginate)
@plugin(AutoIncrementID, generalAutoIncrementIDConfig)
@modelOptions({
  schemaOptions: {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  },
})
export class Feedback {
  @prop({ unique: true })
  id: number;

  @prop({ ref: () => Form, required: true })
  form: Ref<Form>; // mẫu form

  @prop({ ref: () => User, default: true })
  user: Ref<User>; // nhân viên WKEY

  @IsOptional()
  @prop({ default: [] })
  assessors: any; // người đánh giá

  @prop({ default: Date.now, immutable: true })
  createdAt?: Date;

  @prop({ default: Date.now })
  updatedAt?: Date;

  @prop({ default: null })
  deletedAt: Date;

  @prop({ ref: () => User })
  createdBy: Ref<User>;

  @prop({ ref: () => User, default: null })
  updatedBy: Ref<User>;

  @prop({ ref: () => User, default: null })
  deletedBy: Ref<User>;

  // for article aggregate
  feedbackCount?: number;
}

export const FeedbackProvider = getProviderByTypegooseClass(Feedback);
