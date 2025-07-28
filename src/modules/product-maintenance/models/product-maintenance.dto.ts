import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";
import { Type } from "class-transformer";

export class ProductMaintenanceDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  // @IsOptional()
  // attachments?: string | undefined;

  @IsMongoId()
  productId!: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @IsEnum(["service", "preventive-maintenance"])
  type!: string;

  @IsOptional()
  active?: string;
}

export class UpdateProductMaintenanceDTO extends PartialType(
  ProductMaintenanceDTO
) {
  @IsMongoId()
  _id!: string;
}
