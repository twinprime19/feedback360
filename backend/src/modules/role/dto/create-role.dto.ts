import { AutoIncrementID } from "@typegoose/auto-increment";
import { PublishState } from "@app/constants/biz.constant";
import { prop, Ref } from "@typegoose/typegoose";
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsDefined,
  IsIn,
  IsInt,
  ArrayUnique,
} from "class-validator";
import { Permission } from "@app/modules/permission/entities/permission.entity";

export const PUBLISH_STATES = [
  PublishState.Draft,
  PublishState.Published,
] as const;

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty({ message: "name?" })
  @prop({ required: true })
  name: string;

  @ArrayUnique()
  @IsArray()
  @prop({ type: () => [Permission] })
  permissions: Permission[];

  @IsIn(PUBLISH_STATES)
  @IsInt()
  @IsDefined()
  @prop({ enum: PublishState, default: PublishState.Published, index: true })
  state: PublishState;
}
