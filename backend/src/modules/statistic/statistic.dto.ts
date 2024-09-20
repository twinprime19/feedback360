/**
 * @file Statistic dto
 * @module module/Statistic/dto
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

export class StatisticPaginateQueryDTO extends IntersectionType(
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

export class StatisticsDTO {
  @ArrayUnique()
  @ArrayNotEmpty()
  @IsArray()
  statisticIds: string[];
}

export class StatisticDTO {
  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  
  @IsNumber()
  relationship: number;
  
  @IsNotEmpty()
  feedback: import("mongoose").Types.ObjectId;

  @IsNotEmpty()
  result: any;
}
