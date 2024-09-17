/**
 * @file Setting service
 * @module module/setting/service
 */

import { Injectable } from "@nestjs/common";
import { InjectModel } from "@app/transformers/model.transformer";
import { MongooseModel, MongooseDoc } from "@app/interfaces/mongoose.interface";
import { Setting } from "./setting.model";
import { DEFAULT_SETTING } from "@app/constants/biz.constant";
import { KeyValueModel } from "@app/models/key-value.model";
import _ from "lodash";

@Injectable()
export class SettingService {
  constructor(
    @InjectModel(Setting) private readonly settingModel: MongooseModel<Setting>
  ) {}

  // get site settings
  public async getSetting(): Promise<MongooseDoc<Setting>> {
    let setting = await this.settingModel.findOne({}).exec();
    return (
      setting ||
      (await this.settingModel.create({
        web: DEFAULT_SETTING,
      }))
    );
  }

  // update site settings
  public async updateSetting(newSetting: {
    web: KeyValueModel[];
  }): Promise<MongooseDoc<Setting> | null> {
    let setting = await this.settingModel.findOne({});
    if (!setting) {
      return await this.settingModel.create({
        web: DEFAULT_SETTING,
      });
    }

    let settingWebs: KeyValueModel[] = setting.web;
    if (newSetting && newSetting.web.length > 0) {
      let value = _.result(
        _.find(newSetting.web, function (ele: any) {
          return ele.name == "logo";
        }),
        "value"
      );

      if (value) {
        const indexUpdate = _.findIndex(
          newSetting.web,
          (_setting) => _setting.name === "logo"
        );
        if (indexUpdate > -1) {
          newSetting.web[indexUpdate].value = value.toString();
        }
      }
    }
    if (settingWebs.length > 0) {
      newSetting.web.forEach((setting) => {
        const indexUpdate = _.findIndex(
          settingWebs,
          (_setting) => _setting.name === setting.name
        );

        if (indexUpdate > -1) {
          settingWebs[indexUpdate].value = setting.value;
        } else {
          settingWebs.push(setting);
        }
      });
    }

    return await this.settingModel
      .findByIdAndUpdate(setting?._id, { web: settingWebs }, { new: true })
      .exec();
  }
}
