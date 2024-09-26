import { AutoIncrementID } from "@typegoose/auto-increment";
import { prop, plugin, modelOptions, Ref } from "@typegoose/typegoose";
import { generalAutoIncrementIDConfig } from "@app/constants/increment.constant";
import { getProviderByTypegooseClass } from "@app/transformers/model.transformer";
import { mongoosePaginate } from "@app/utils/paginate";
import { Role } from "@app/modules/role/entities/role.entity";
import { SexState, UserStatus } from "@app/constants/biz.constant";
import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsInt,
  ArrayUnique,
  IsBoolean,
  IsDefined,
  IsOptional,
  IsEmail,
} from "class-validator";
import { Schema } from "mongoose";
import { Media } from "@app/modules/media/media.model";
import { Form } from "@app/modules/form/form.model";

export const USER_STATUS = [UserStatus.ONLINE, UserStatus.OFFLINE] as const;

export const SEX_STATES = [
  SexState.FEMALE,
  SexState.MALE,
  SexState.ORTHER,
] as const;

@plugin(mongoosePaginate)
@plugin((userSchema: Schema) => {
  userSchema.pre("find", function () {
    this.where({ isSuperAdmin: false });
  });
})
@modelOptions({
  schemaOptions: {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
})
export class User {
  @IsString()
  @IsNotEmpty()
  @prop({ required: true, unique: true })
  userName: string;

  @IsString()
  @IsNotEmpty()
  @prop({ required: false })
  fullname: string;

  @IsString()
  @IsNotEmpty()
  @prop({ required: true })
  password: string;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @prop({ required: true })
  emailAddress: string;

  @IsString()
  @IsOptional()
  @prop({ required: false, default: "" })
  position: string;

  @IsString()
  @IsOptional()
  @prop({ required: false, default: "" })
  phone: string;

  @IsString()
  @IsOptional()
  @prop({ ref: () => Media, default: null })
  avatar: Ref<Media>;

  @IsIn(USER_STATUS)
  @IsInt()
  @IsDefined()
  @prop({ enum: UserStatus, default: UserStatus.ONLINE, index: true })
  status: UserStatus;

  @IsBoolean()
  @prop({ required: false, default: false })
  isSuperAdmin: boolean;

  @ArrayUnique()
  @prop({ type: () => [String], ref: () => Role })
  roles?: Ref<Role, string>[] | Role[];

  @prop({
    ref: () => Form,
    foreignField: "user",
    localField: "_id",
  })
  forms: Ref<Form>[]; // danh sách biểu mẫu của user

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
export const UserProvider = getProviderByTypegooseClass(User);
