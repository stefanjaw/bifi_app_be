import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

/** DTO for creating a new UOM category */
export class UomCategoryDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  active?: boolean;
}

/** DTO for updating an existing UOM category */
export class UpdateUomCategoryDTO extends PartialType(UomCategoryDTO) {
  @IsMongoId()
  _id!: string;
}
