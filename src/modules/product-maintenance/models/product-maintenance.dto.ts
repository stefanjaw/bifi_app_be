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
import { FileUpload } from "../../../system/libraries/file-storage/file-upload.types";

export class ProductMaintenanceDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  notes?: string;

  @IsOptional()
  attachments?: FileUpload;

  @IsMongoId()
  productId!: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateStart?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dateEnd?: Date;

  @IsEnum(["service", "preventive-maintenance"])
  type!: string;

  @IsOptional()
  manual?: string;

  @IsOptional()
  active?: string;
}

export class UpdateProductMaintenanceDTO extends PartialType(
  ProductMaintenanceDTO
) {
  @IsMongoId()
  _id!: string;
}
