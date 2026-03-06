import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";
import { PartialType } from "../../../system";
import { DiscountType } from "./discount.model";

export class DiscountDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(DiscountType)
  @IsNotEmpty()
  discountType!: DiscountType;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  value!: number;

  @IsOptional()
  active?: boolean;
}

export class UpdateDiscountDTO extends PartialType(DiscountDTO) {
  @IsMongoId()
  _id!: string;
}
