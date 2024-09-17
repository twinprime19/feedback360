/**
 * @file Option model
 * @module module/option/model
 */

import { prop, modelOptions } from "@typegoose/typegoose";
import { KeyValueModel } from "@app/models/key-value.model";
import { getProviderByTypegooseClass } from "@app/transformers/model.transformer";

@modelOptions({
  schemaOptions: {
    timestamps: {
      createdAt: false,
      updatedAt: "updatedAt",
    },
  },
})
export class Setting {
  @prop({ default: [], type: () => [KeyValueModel] })
  web: KeyValueModel[];

  @prop({ default: Date.now })
  updatedAt?: Date;
}

export const SettingProvider = getProviderByTypegooseClass(Setting);
