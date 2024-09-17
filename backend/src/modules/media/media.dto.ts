/**
 * @file Media dto
 * @module module/media/dto
 */
import { IntersectionType } from "@nestjs/mapped-types";
import {
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsBoolean,
  IsNumber,
} from "class-validator";
import { Transform } from "class-transformer";
import { SortType } from "@app/constants/biz.constant";
import { PaginateOptionDTO } from "@app/models/paginate.model";
import {
  DateQueryDTO,
  KeywordQueryDTO,
  StatusQueryDTO,
} from "@app/models/query.model";
import { unknownToNumber } from "@app/transformers/value.transformer";

export class MediaPaginateQueryDTO extends IntersectionType(
  PaginateOptionDTO,
  KeywordQueryDTO,
  StatusQueryDTO,
  DateQueryDTO
) {
  @IsString()
  field?: string = "updatedAt";

  @IsIn([SortType.Asc, SortType.Desc])
  @IsInt()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => unknownToNumber(value))
  order?: SortType.Asc | SortType.Desc;
}

export class MediasDTO {
  @ArrayUnique()
  @ArrayNotEmpty()
  @IsArray()
  mediaIds: string[];
}

export class SignatureDTO {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsString()
  url: string;

  @IsNumber()
  page: number;

  ref: any;

  @IsString()
  idSign: string

  @IsBoolean()
  signed: boolean = false;

  @IsString()
  createdBy: string;
}
