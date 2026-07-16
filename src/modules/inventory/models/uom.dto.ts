import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

/** DTO for creating a new unit of measure */
export class UomDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  symbol?: string;

  @IsMongoId()
  categoryId!: string;

  @IsString()
  @IsOptional()
  crUnidadMedida?: string;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  active?: boolean;
}

/** DTO for updating an existing unit of measure */
export class UpdateUomDTO extends PartialType(UomDTO) {
  @IsMongoId()
  _id!: string;
}
