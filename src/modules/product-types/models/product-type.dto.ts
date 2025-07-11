import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";

export class ProductTypeDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description!: string;

  @IsBoolean()
  @IsOptional()
  active!: boolean;
}

export class UpdateProductTypeDTO extends PartialType(ProductTypeDTO) {
  @IsMongoId()
  _id!: string;
}
