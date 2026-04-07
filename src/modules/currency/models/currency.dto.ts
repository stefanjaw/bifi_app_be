import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

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
  @Transform(toBoolean)
  @IsOptional()
  active?: boolean;

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  isDefault?: boolean;
}

export class UpdateCurrencyDTO extends PartialType(CurrencyDTO) {
  @IsMongoId()
  _id!: string;
}
