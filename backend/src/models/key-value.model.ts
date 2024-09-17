/**
 * @file General key value model
 * @module model/key-value
 */

import { Media } from '@app/modules/media/media.model'
import { Ref, prop } from '@typegoose/typegoose'
import { IsString, IsNotEmpty } from 'class-validator'

export class KeyValueModel {
  @IsString()
  @IsNotEmpty()
  @prop({ required: false, validate: /\S+/ })
  name: string

  @IsNotEmpty()
  @prop({ required: false})
  value: string | number | object | object[]
}


