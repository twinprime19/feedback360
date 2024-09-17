import { prop } from "@typegoose/typegoose";
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
import { PublishState } from "@app/constants/biz.constant";
import { Action } from "../entities/action.entity";

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

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty({ message: "name?" })
  @prop({ required: true })
  name: string;

  @IsIn(PUBLISH_STATES)
  @IsInt()
  @IsDefined()
  @prop({ enum: PublishState, default: PublishState.Published, index: true })
  state: PublishState;

  @ArrayUnique()
  @ArrayNotEmpty()
  @IsArray()
  @prop({ default: ACTION_STATES })
  actions: Action[];
}
