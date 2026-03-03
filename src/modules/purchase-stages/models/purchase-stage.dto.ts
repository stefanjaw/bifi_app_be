import { Type } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";

export class PurchaseStageDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  order?: number;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  active?: boolean;
}

export class UpdatePurchaseStageDTO extends PartialType(PurchaseStageDTO) {
  @IsMongoId()
  _id!: string;
}
