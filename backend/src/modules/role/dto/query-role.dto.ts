import { IntersectionType } from "@nestjs/mapped-types";
import { IsString, IsOptional } from "class-validator";
import { PaginateOptionDTO } from "@app/models/paginate.model";
import { KeywordQueryDTO, StateQueryDTO } from "@app/models/query.model";

export class RolePaginateQueryDTO extends IntersectionType(
  PaginateOptionDTO,
  KeywordQueryDTO,
  StateQueryDTO
) {
  @IsString()
  @IsOptional()
  keySort: string;

  @IsString()
  @IsOptional()
  valueSort: string;
}
