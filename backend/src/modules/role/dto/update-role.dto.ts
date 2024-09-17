import { PartialType } from "@nestjs/mapped-types";
import { CreateRoleDto } from "./create-role.dto";
import { prop } from "@typegoose/typegoose";

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @prop({ unique: true })
  id: number;
}
