import { Type } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { PartialType } from "../../../system";

export class CurrencyDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  symbol!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  decimalPrecision?: number;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  active?: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateCurrencyDTO extends PartialType(CurrencyDTO) {
  @IsMongoId()
  _id!: string;
}
