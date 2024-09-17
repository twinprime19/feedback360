import { IntersectionType } from "@nestjs/mapped-types";
import { PaginateOptionDTO } from "@app/models/paginate.model";
import { KeywordQueryDTO } from "@app/models/query.model";

export class PermissionPaginateQueryDTO extends IntersectionType(
  PaginateOptionDTO,
  KeywordQueryDTO
) {}
