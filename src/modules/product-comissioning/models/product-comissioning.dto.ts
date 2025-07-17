import { Type } from "class-transformer";
import {
  IsBoolean,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";

export class ProductComissioningDTO {
  @IsIn(["fail", "pass"])
  outcome!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  details?: string;

  // @IsOptional()
  // attachments?: string | undefined;

  @IsMongoId()
  productId!: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: string;
}

export class UpdateProductComissioningDTO extends PartialType(
  ProductComissioningDTO
) {
  @IsMongoId()
  _id!: string;
}
