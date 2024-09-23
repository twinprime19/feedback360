/**
 * @file Template dto
 * @module module/template/dto
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
} from "class-validator";
import { Transform } from "class-transformer";
import { SortType } from "@app/constants/biz.constant";
import { PaginateOptionDTO } from "@app/models/paginate.model";
import { KeywordQueryDTO, StatusQueryDTO } from "@app/models/query.model";
import { unknownToNumber } from "@app/transformers/value.transformer";

export class TemplatePaginateQueryDTO extends IntersectionType(
  PaginateOptionDTO,
  KeywordQueryDTO,
  StatusQueryDTO
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

export class TemplatesDTO {
  @ArrayUnique()
  @ArrayNotEmpty()
  @IsArray()
  templateIds: string[];
}

export class TemplateDTO {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  template: any;

  createdBy: import("mongoose").Types.ObjectId;

  @IsOptional()
  updatedBy: import("mongoose").Types.ObjectId;
}
