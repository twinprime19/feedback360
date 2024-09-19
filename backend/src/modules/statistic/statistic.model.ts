/**
 * @file Statistic model
 * @module module/Statistic/model
 */

import { AutoIncrementID } from "@typegoose/auto-increment";
import { prop, plugin, modelOptions, Ref } from "@typegoose/typegoose";
import {
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { generalAutoIncrementIDConfig } from "@app/constants/increment.constant";
import { getProviderByTypegooseClass } from "@app/transformers/model.transformer";
import { mongoosePaginate } from "@app/utils/paginate";
import { User } from "../user/entities/user.entity";
import { Form } from "../form/form.model";
import { Feedback } from "../feedback/feedback.model";
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
export class Statistic {
  @prop({ unique: true })
  id: number;

  @prop({ ref: () => Feedback, required: true })
  feedback: Ref<Feedback>; // mẫu feedback

  @prop({ ref: () => Form, required: true })
  form: Ref<Form>; // mẫu form

  @prop({ ref: () => User, default: true })
  user: Ref<User>; // nhân viên được đánh giá

  @IsOptional()
  @prop({ required: false, default: null })
  assessor: Ref<User>; // người đánh giá

  @IsString()
  @IsNotEmpty()
  @prop({ required: true })
  time: string; // thời gian phản hồi

  @IsString()
  @IsNotEmpty()
  @prop({ required: true })
  fullname: string; // họ tên

  @IsString()
  @IsNotEmpty()
  @prop({ required: true })
  position: string; // chức vụ

  @IsIn(RELATIONSHIP_STATES)
  @IsInt()
  @IsDefined()
  @prop({
    enum: RelationshipState,
    default: RelationshipState.SELF,
    index: true,
  })
  relationship: RelationshipState;

  @prop({ required: true })
  result: any; // kêt quả của người đánh giá

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
  statisticCount?: number;
}

export const StatisticProvider = getProviderByTypegooseClass(Statistic);
