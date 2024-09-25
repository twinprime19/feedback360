/**
 * @file Form model
 * @module module/form/model
 */

import { AutoIncrementID } from "@typegoose/auto-increment";
import { prop, plugin, modelOptions, Ref } from "@typegoose/typegoose";
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { generalAutoIncrementIDConfig } from "@app/constants/increment.constant";
import { getProviderByTypegooseClass } from "@app/transformers/model.transformer";
import { mongoosePaginate } from "@app/utils/paginate";
import { User } from "../user/entities/user.entity";
import { Template } from "../template/template.model";
import { RelationshipState } from "@app/constants/biz.constant";

export const RELATIONSHIP_STATES = [
  RelationshipState.SELF,
  RelationshipState.PEER,
  RelationshipState.SUBORDINATE,
  RelationshipState.SENIOR,
] as const;

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
export class Form {
  @prop({ unique: true })
  id: number;

  @prop({ ref: () => Template, required: true })
  template: Ref<Template>; // mẫu template

  @prop({ ref: () => User, default: true })
  user: Ref<User>; // nhân viên được đánh giá

  @IsOptional()
  @prop({ default: [] })
  template_email: any; // mẫu email dùng để gửi

  @IsOptional()
  @prop({ default: [] })
  assessors: any; // dánh sách người đánh giá

  @IsIn(RELATIONSHIP_STATES)
  @IsInt()
  @IsOptional()
  @prop({
    enum: RelationshipState,
    default: RelationshipState.SELF,
    index: true,
  })
  relationship: RelationshipState;

  @IsString()
  @IsNotEmpty()
  @prop({ required: true })
  time: string; // thời gian tạo form

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
  formCount?: number;
}

export const FormProvider = getProviderByTypegooseClass(Form);
