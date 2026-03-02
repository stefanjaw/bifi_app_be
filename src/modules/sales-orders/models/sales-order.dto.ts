import { Type } from "class-transformer";
import {
  IsDate,
  IsISO4217CurrencyCode,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";
import { PartialType } from "../../../system";

export class SalesOrderDTO {
  @IsMongoId()
  crmId!: string;

  @IsMongoId()
  contact!: string;

  @IsMongoId()
  company!: string;

  @IsMongoId()
  @IsOptional()
  salesperson?: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount!: number;

  @IsISO4217CurrencyCode()
  @IsOptional()
  currency?: string;

  @IsDate()
  @Type(() => Date)
  closeDate!: Date;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  notes?: string;
}

export class UpdateSalesOrderDTO extends PartialType(SalesOrderDTO) {
  @IsMongoId()
  _id!: string;
}
