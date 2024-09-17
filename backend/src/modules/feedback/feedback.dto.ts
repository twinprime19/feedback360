/**
 * @file Feedback dto
 * @module module/Feedback/dto
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
  IsNumber,
} from "class-validator";
import { Transform } from "class-transformer";
import { SortType } from "@app/constants/biz.constant";
import { PaginateOptionDTO } from "@app/models/paginate.model";
import { KeywordQueryDTO, StatusQueryDTO } from "@app/models/query.model";
import { unknownToNumber } from "@app/transformers/value.transformer";

export class FeedbackPaginateQueryDTO extends IntersectionType(
  PaginateOptionDTO,
  KeywordQueryDTO,
  StatusQueryDTO
) {
  @IsString()
  field?: string = "createdAt";

  @IsIn([SortType.Asc, SortType.Desc])
  @IsInt()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => unknownToNumber(value))
  order?: SortType.Asc | SortType.Desc;
}

export class FeedbacksDTO {
  @ArrayUnique()
  @ArrayNotEmpty()
  @IsArray()
  FeedbackIds: string[];
}

export class FeedbackDTO {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNotEmpty()
  product: import("mongoose").Types.ObjectId;

  @IsNotEmpty()
  user: import("mongoose").Types.ObjectId;

  @IsNumber()
  @IsOptional()
  status: number;

  createdBy: import("mongoose").Types.ObjectId;
}
