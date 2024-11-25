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
} from "class-validator";
import { Transform } from "class-transformer";
import { SortType } from "@app/constants/biz.constant";
import { PaginateOptionDTO } from "@app/models/paginate.model";
import {
  FormQueryDTO,
  KeywordQueryDTO,
  StatusQueryDTO,
} from "@app/models/query.model";
import { unknownToNumber } from "@app/transformers/value.transformer";

export class FeedbackPaginateQueryDTO extends IntersectionType(
  PaginateOptionDTO,
  KeywordQueryDTO,
  StatusQueryDTO,
  FormQueryDTO
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
  feedbackIds: string[];
}

export class FeedbackDTO {
  @IsNotEmpty()
  form: import("mongoose").Types.ObjectId;

  @IsNotEmpty()
  relationship_id: import("mongoose").Types.ObjectId;

  @IsNotEmpty()
  result: any;
}
