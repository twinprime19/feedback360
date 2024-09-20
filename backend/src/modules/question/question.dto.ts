/**
 * @file Question dto
 * @module module/question/dto
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
import {
  KeywordQueryDTO,
  StatusQueryDTO,
  TypeQueryDTO,
} from "@app/models/query.model";
import { unknownToNumber } from "@app/transformers/value.transformer";

export class QuestionPaginateQueryDTO extends IntersectionType(
  PaginateOptionDTO,
  KeywordQueryDTO,
  StatusQueryDTO,
  TypeQueryDTO
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

export class QuestionsDTO {
  @ArrayUnique()
  @ArrayNotEmpty()
  @IsArray()
  questionIds: string[];
}

export class QuestionDTO {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  content: string;

  @IsNumber()
  type: number;

  @IsNumber()
  status: number;

  createdBy: import("mongoose").Types.ObjectId;

  @IsOptional()
  updatedBy: import("mongoose").Types.ObjectId;
}
