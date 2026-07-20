import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { FileUpload, PartialType, toBoolean } from "../../../../system";
import { Transform } from "class-transformer";

/** DTO for creating a new clinical order */
export class OrderDTO {
  @IsMongoId()
  @IsNotEmpty()
  orderSetId!: string;

  @IsMongoId()
  @IsNotEmpty()
  patientId!: string;

  @IsString()
  @IsOptional()
  subType?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsNotEmpty()
  status!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsMongoId()
  @IsOptional()
  interventionId?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsOptional()
  results?: FileUpload;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

/** DTO for updating an existing clinical order */
export class UpdateOrderDTO extends PartialType(OrderDTO) {
  @IsMongoId()
  _id!: string;
}
