/**
 * @file Query params model
 * @module model/query
 */

import {
  IsIn,
  IsInt,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  IsString,
  IsArray,
} from "class-validator";
import { Transform } from "class-transformer";
import { unknownToNumber } from "@app/transformers/value.transformer";

export const enum BooleanNumberValue {
  False = 0, // Number(false)
  True = 1, // Number(true)
}

// https://www.progress.com/blogs/understanding-iso-8601-date-and-time-format
export class DateQueryDTO {
  @IsDateString()
  @IsNotEmpty()
  @IsOptional()
  date?: string;

  @IsDateString()
  @IsNotEmpty()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsNotEmpty()
  @IsOptional()
  endDate?: string;
}

export class KeywordQueryDTO {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  keyword?: string;
}

export class BooleanQueryDTO {
  @IsIn([BooleanNumberValue.True, BooleanNumberValue.False])
  @IsInt()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => unknownToNumber(value))
  boolean?: BooleanNumberValue.True | BooleanNumberValue.False;
}

export class StateQueryDTO {
  state?: string;
}

export class StatusQueryDTO {
  status?: string;
}

export class TypeQueryDTO {
  type?: string;
}

