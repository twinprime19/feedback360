/**
 * @file General extend model
 * @module model/extend
 */

import { IsString, IsIn, IsInt, IsOptional, IsNotEmpty, Min, Max } from 'class-validator'
import { Transform } from 'class-transformer'
import { SortType } from '@app/constants/biz.constant'
import { unknownToNumber } from '@app/transformers/value.transformer'

export class PaginateBaseOptionDTO {
  @Min(1)
  @IsInt()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => unknownToNumber(value))
  page?: number

  @Min(1)
  @Max(100)
  @IsInt()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => unknownToNumber(value))
  page_size?: number
}

export class PaginateOptionDTO extends PaginateBaseOptionDTO {
  
  @IsString()
  field?: string = "updatedAt"

  @IsIn([SortType.Asc, SortType.Desc])
  @IsInt()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => unknownToNumber(value))
  order?: SortType = SortType.Desc

  @IsIn([SortType.Asc, SortType.Desc])
  @IsInt()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => unknownToNumber(value))
  sort?: SortType = SortType.Desc // Will deprecated next time
  
}

export class PaginateOptionWithHotSortDTO extends PaginateBaseOptionDTO {
  @IsIn([SortType.Asc, SortType.Desc, SortType.Hottest])
  @IsInt()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => unknownToNumber(value))
  sort?: SortType
}
