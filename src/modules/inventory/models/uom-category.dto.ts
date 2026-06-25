import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class UomCategoryDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  active?: boolean;
}

export class UpdateUomCategoryDTO extends PartialType(UomCategoryDTO) {
  @IsMongoId()
  _id!: string;
}
