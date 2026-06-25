import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class ProductTypeDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  active?: boolean;
}

export class UpdateProductTypeDTO extends PartialType(ProductTypeDTO) {
  @IsMongoId()
  _id!: string;
}
