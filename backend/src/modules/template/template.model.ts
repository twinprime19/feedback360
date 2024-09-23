import { AutoIncrementID } from "@typegoose/auto-increment";
import { prop, plugin, modelOptions, Ref } from "@typegoose/typegoose";
import { generalAutoIncrementIDConfig } from "@app/constants/increment.constant";
import { getProviderByTypegooseClass } from "@app/transformers/model.transformer";
import { mongoosePaginate } from "@app/utils/paginate";
import { SexState } from "@app/constants/biz.constant";
import { IsString, IsNotEmpty } from "class-validator";
import { User } from "@app/modules/user/entities/user.entity";

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
        delete ret.password;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
})
export class Template {
  @IsString()
  @IsNotEmpty()
  @prop({ required: true })
  title: string;

  @IsNotEmpty()
  @prop({ required: true })
  template: any;

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
export const TemplateProvider = getProviderByTypegooseClass(Template);
