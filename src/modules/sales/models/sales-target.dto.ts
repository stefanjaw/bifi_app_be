import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsISO4217CurrencyCode,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class SalesTargetDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Type(() => Number)
  year!: number;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(12)
  month!: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  targetAmount!: number;

  @IsISO4217CurrencyCode()
  @IsOptional()
  currency?: string;

  @IsMongoId()
  @IsOptional()
  salesperson?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateSalesTargetDTO extends PartialType(SalesTargetDTO) {
  @IsMongoId()
  _id!: string;
}
