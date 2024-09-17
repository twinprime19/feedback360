import { IntersectionType } from "@nestjs/mapped-types";
import { IsOptional, IsString } from "class-validator";
import { PaginateOptionDTO } from "@app/models/paginate.model";
import { KeywordQueryDTO } from "@app/models/query.model";

export class UserPaginateQueryDTO extends IntersectionType(
  PaginateOptionDTO,
  KeywordQueryDTO
) {
  @IsString()
  @IsOptional()
  status: string;
}
