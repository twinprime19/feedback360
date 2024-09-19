/**
 * @file Question model
 * @module module/question/model
 */

import { AutoIncrementID } from "@typegoose/auto-increment";
import { prop, plugin, modelOptions, Ref } from "@typegoose/typegoose";
import {
  IsArray,
  ArrayUnique,
  IsIn,
  IsDefined,
  IsInt,
  IsNotEmpty,
  IsString,
  IsOptional,
} from "class-validator";
import { generalAutoIncrementIDConfig } from "@app/constants/increment.constant";
import { getProviderByTypegooseClass } from "@app/transformers/model.transformer";
import { mongoosePaginate } from "@app/utils/paginate";
import { KeyValueModel } from "@app/models/key-value.model";
import { PublishState, QuestionTypeState } from "@app/constants/biz.constant";
import { User } from "../user/entities/user.entity";

export const QUESTION_TYPE_STATES = [
  QuestionTypeState.POINT,
  QuestionTypeState.TEXT,
] as const;

export const POINT_STATUS_STATES = [
  PublishState.Draft,
  PublishState.Published,
] as const;

@plugin(mongoosePaginate)
@plugin(AutoIncrementID, generalAutoIncrementIDConfig)
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
export class Question {
  @prop({ unique: true })
  id: number;

  @IsString()
  @IsNotEmpty()
  @prop({ required: true, index: true })
  title: string;

  @IsString()
  @IsOptional()
  @prop({ required: false, default: "" })
  content: string;

  @IsIn(QUESTION_TYPE_STATES)
  @IsInt()
  @IsDefined()
  @prop({
    enum: QuestionTypeState,
    default: QuestionTypeState.POINT,
    index: true,
  })
  type: QuestionTypeState;

  @IsIn(POINT_STATUS_STATES)
  @IsInt()
  @IsDefined()
  @prop({ enum: PublishState, default: PublishState.Published, index: true })
  status: PublishState;

  @ArrayUnique()
  @IsArray()
  @prop({ _id: false, default: [], type: () => [KeyValueModel] })
  extends: KeyValueModel[];

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
  questionCount?: number;
}

export const QuestionProvider = getProviderByTypegooseClass(Question);
