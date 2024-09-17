/**
 * @file Media model
 * @module module/media/model
 */

import { AutoIncrementID } from "@typegoose/auto-increment";
import { prop, plugin, modelOptions, Ref } from "@typegoose/typegoose";
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsDefined,
  IsIn,
  IsObject,
  IsArray,
  IsOptional,
} from "class-validator";
import { generalAutoIncrementIDConfig } from "@app/constants/increment.constant";
import { getProviderByTypegooseClass } from "@app/transformers/model.transformer";
import { mongoosePaginate } from "@app/utils/paginate";
import { PublishState, TypeState } from "@app/constants/biz.constant";
import { User } from "../user/entities/user.entity";
import { SignatureDTO } from "./media.dto";

export const PUBLISH_STATES = [
  PublishState.Draft,
  PublishState.Published,
] as const;

export const TYPE_STATES = [
  TypeState.Image,
  TypeState.Pdf,
  TypeState.Signature,
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
export class Media {
  @prop({ unique: true })
  id: number;

  @IsString()
  @IsNotEmpty()
  @prop({ required: true })
  title: string;

  @IsString()
  @prop({ default: null })
  caption: string;

  @IsObject()
  @prop({ default: null })
  thumbnail: object;

  @IsString()
  @prop({ default: null })
  pdf: string;

  @IsArray()
  @IsOptional()
  @prop({ default: [] })
  signatures: SignatureDTO[]

  @prop({ ref: () => User })
  signedBy: Ref<User>[];

  @IsIn(TYPE_STATES)
  @IsInt()
  @IsDefined()
  @prop({ enum: TypeState, default: TypeState.Pdf, index: true })
  type: TypeState;

  @IsIn(PUBLISH_STATES)
  @IsInt()
  @IsDefined()
  @prop({ enum: PublishState, default: PublishState.Published, index: true })
  status: PublishState;

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

  mediaCount?: number;
}

export const MediaProvider = getProviderByTypegooseClass(Media);
