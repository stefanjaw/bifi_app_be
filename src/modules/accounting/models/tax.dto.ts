import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";
import { PartialType } from "../../../system";
import { TaxType } from "./tax.model";

export class TaxDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(TaxType)
  @IsNotEmpty()
  taxType!: TaxType;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  percentage!: number;

  @IsMongoId()
  accountId!: string;

  @IsOptional()
  active?: boolean;

  @IsString()
  @IsOptional()
  crCodigo?: string;

  @IsString()
  @IsOptional()
  crCodigoTarifa?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  crTarifa?: number;
}

export class UpdateTaxDTO extends PartialType(TaxDTO) {
  @IsMongoId()
  _id!: string;
}
