import { Type } from "class-transformer";
import {
  IsDate,
  IsEnum,
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
import { PartialType } from "../../../system";

export class CRMDTO {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount!: number;

  @IsISO4217CurrencyCode()
  @IsOptional()
  currency?: string;

  @IsEnum([
    "prospecting",
    "qualification",
    "proposal",
    "negotiation",
    "closed-won",
    "closed-lost",
  ])
  @IsOptional()
  stage?: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @IsOptional()
  probability?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expectedCloseDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  actualCloseDate?: Date;

  @IsMongoId()
  contact!: string;

  @IsMongoId()
  company!: string;

  @IsMongoId()
  owner!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  notes?: string;
}

export class UpdateCRMDTO extends PartialType(CRMDTO) {
  @IsMongoId()
  _id!: string;
}
