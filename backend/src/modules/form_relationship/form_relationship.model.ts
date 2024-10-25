/**
 * @file Evoucher Customer model
 * @module module/evoucher_customer/model
 */

import { prop, plugin, modelOptions, Ref } from "@typegoose/typegoose";
import { getProviderByTypegooseClass } from "@app/transformers/model.transformer";
import { mongoosePaginate } from "@app/utils/paginate";
import { Form } from "../form/form.model";
import { RelationshipState } from "@app/constants/biz.constant";
import {
  IsBoolean,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
} from "class-validator";
import { User } from "../user/entities/user.entity";

export const RELATIONSHIP_STATES = [
  RelationshipState.SELF,
  RelationshipState.PEER,
  RelationshipState.SUBORDINATE,
  RelationshipState.SENIOR,
] as const;

@plugin(mongoosePaginate)
@modelOptions({
  schemaOptions: {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        //delete ret.thumbnail;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
})
export class FormRelationship {
  @prop({ ref: () => Form, required: true })
  form: Ref<Form>; // biểu mẫu

  @IsIn(RELATIONSHIP_STATES)
  @IsInt()
  @IsDefined()
  @prop({
    enum: RelationshipState,
    default: RelationshipState.SELF,
    index: true,
  })
  relationship: RelationshipState; // mối quan hệ

  @prop({ ref: () => User, required: true })
  user: Ref<User>;

  @IsString()
  @prop({ default: [] })
  receivers: string[]; // dánh sách người đánh giá

  @IsNotEmpty()
  @prop({ required: true })
  templateEmail: string; // mẫu email dùng để gửi

  @IsString()
  @IsNotEmpty()
  @prop({ required: true })
  time: string; // thời gian tạo form

  @IsBoolean()
  @prop({ required: false, default: false })
  isSubmitted: boolean;

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
}

export const FormRelationshipProvider =
  getProviderByTypegooseClass(FormRelationship);
