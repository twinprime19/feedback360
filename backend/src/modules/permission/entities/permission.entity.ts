import { AutoIncrementID } from "@typegoose/auto-increment";
import { prop, plugin, modelOptions, Ref } from "@typegoose/typegoose";
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsDefined,
  IsIn,
  IsInt,
  ArrayNotEmpty,
  ArrayUnique,
} from "class-validator";
import { generalAutoIncrementIDConfig } from "@app/constants/increment.constant";
import { getProviderByTypegooseClass } from "@app/transformers/model.transformer";
import { mongoosePaginate } from "@app/utils/paginate";
import { PublishState } from "@app/constants/biz.constant";
import { Action } from "./action.entity";

export const PUBLISH_STATES = [
  PublishState.Draft,
  PublishState.Published,
] as const;

export const ACTION_STATES = [
  Action.Manage,
  Action.Create,
  Action.Update,
  Action.Delete,
  Action.Read,
];
@plugin(mongoosePaginate)
@modelOptions({
  schemaOptions: {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
})
export class Permission {
  @IsString()
  @IsNotEmpty({ message: "name?" })
  @prop({ required: true })
  name: string;

  @ArrayUnique()
  @ArrayNotEmpty()
  @IsArray()
  @prop({ default: ACTION_STATES })
  actions: Action[];

  @IsIn(PUBLISH_STATES)
  @IsInt()
  @IsDefined()
  @prop({ enum: PublishState, default: PublishState.Published })
  state: PublishState;
}

export const PermissionProvider = getProviderByTypegooseClass(Permission);
