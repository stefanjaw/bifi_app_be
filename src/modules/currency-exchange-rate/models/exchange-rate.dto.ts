import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDate,
  IsMongoId,
  IsNumber,
  IsOptional,
  Min,
} from "class-validator";
import { PartialType } from "../../../system";

export class ExchangeRateDTO {
  @IsMongoId()
  fromCurrencyId!: string;

  @IsMongoId()
  toCurrencyId!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rate!: number;

  @IsDate()
  @Type(() => Date)
  effectiveDate!: Date;

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  active?: boolean;
}

export class UpdateExchangeRateDTO extends PartialType(ExchangeRateDTO) {
  @IsMongoId()
  _id!: string;
}
