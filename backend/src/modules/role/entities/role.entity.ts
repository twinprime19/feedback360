import { AutoIncrementID } from "@typegoose/auto-increment";
import { PublishState } from "@app/constants/biz.constant";
import { prop, plugin, modelOptions } from "@typegoose/typegoose";
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
import { Permission } from "@app/modules/permission/entities/permission.entity";

export const PUBLISH_STATES = [
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
})
export class Role {
  @prop({ unique: true })
  id: number;

  @IsString()
  @IsNotEmpty({ message: "name?" })
  @prop({ required: true })
  name: string;

  @ArrayUnique()
  @ArrayNotEmpty()
  @IsArray()
  @prop({ type: () => [Permission] })
  permissions: Permission[];

  @IsIn(PUBLISH_STATES)
  @IsInt()
  @IsDefined()
  @prop({ enum: PublishState, default: PublishState.Published, index: true })
  state: PublishState;
}

export const RoleProvider = getProviderByTypegooseClass(Role);
