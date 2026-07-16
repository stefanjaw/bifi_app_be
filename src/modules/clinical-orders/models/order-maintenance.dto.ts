import { IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { PartialType } from "../../../system";

/** DTO for creating a new clinical order maintenance */
export class OrderMaintenanceDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  color!: string;
}

/** DTO for updating an existing clinical order maintenance */
export class UpdateOrderMaintenanceDTO extends PartialType(
  OrderMaintenanceDTO,
) {
  @IsMongoId()
  _id!: string;
}
