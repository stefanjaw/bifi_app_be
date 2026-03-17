import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsIn,
  IsNotEmpty,
} from "class-validator";

export class PricingIndexSearchDTO {
  @IsString()
  @IsNotEmpty()
  query!: string;

  @IsNumber()
  @IsOptional()
  topN?: number;

  @IsString()
  @IsOptional()
  @IsIn(["catalog", "pricelist", "freight", "shipping"])
  type?: string;
}

export class PricingIndexTriggerDTO {
  @IsString()
  @IsOptional()
  @IsIn(["pricing", "freight", "all"])
  type?: string;

  @IsBoolean()
  @IsOptional()
  force?: boolean;
}
