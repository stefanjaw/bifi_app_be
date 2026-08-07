import {
  IsString,
  IsOptional,
  IsNumber,
  IsMongoId,
  IsIn,
  IsArray,
  ValidateNested,
  IsDate,
} from "class-validator";
import { Type } from "class-transformer";

export class PricingFolderDTO {
  @IsString()
  @IsIn(["pricing", "freight", "config"])
  type!: string;

  @IsString()
  folderId!: string;

  @IsString()
  @IsOptional()
  label?: string;
}

export class PricingSettingsDTO {
  @IsMongoId()
  @IsOptional()
  estimateSequence?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  defaultWharfageBankFeePct?: number;

  @IsString()
  @IsOptional()
  defaultShippingMethod?: string;

  @IsString()
  @IsOptional()
  @IsIn(["markup", "margin"])
  defaultPricingMethod?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  defaultMarkupFactor?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  defaultMargin?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingFolderDTO)
  @IsOptional()
  folders?: PricingFolderDTO[];

  @IsDate()
  @IsOptional()
  catalogLastIndexed?: Date;

  @IsDate()
  @IsOptional()
  freightLastIndexed?: Date;
}
