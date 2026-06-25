import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  ValidateNested,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { PartialType } from "../../../system";

export class PricingControlsDTO {
  @IsBoolean()
  @IsOptional()
  dutyFree?: boolean;

  @IsString()
  @IsOptional()
  @IsIn(["markup", "margin"])
  method?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  markupFactor?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(99.99)
  margin?: number;
}

class LineItemDTO {
  @IsString()
  @IsOptional()
  product?: string;

  @IsString()
  @IsOptional()
  supplier?: string;

  @IsString()
  @IsOptional()
  partNo?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  qty?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  unitPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  freightPerUnit?: number;

  @IsString()
  @IsOptional()
  hsCode?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  dutyPct?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  dutyPerUnit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  wharfage?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  landedPerUnit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  custPricePerUnit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  marginPct?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalCust?: number;
}

export class GenerateEstimateDTO {
  @IsString()
  @IsNotEmpty()
  requestText!: string;

  @IsString()
  @IsOptional()
  shippingMethod?: string;

  @ValidateNested()
  @Type(() => PricingControlsDTO)
  @IsOptional()
  pricingControls?: PricingControlsDTO;

  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @IsString()
  @IsOptional()
  preparedBy?: string;
}

export class TokenEstimateDTO {
  @IsString()
  @IsNotEmpty()
  requestText!: string;
}

export class PricingEstimateCreateDTO {
  @IsString()
  @IsOptional()
  requestText?: string;

  @IsString()
  @IsOptional()
  shippingMethod?: string;

  @ValidateNested()
  @Type(() => PricingControlsDTO)
  @IsOptional()
  pricingControls?: PricingControlsDTO;

  @IsString()
  @IsOptional()
  specialInstructions?: string;

  @IsString()
  @IsOptional()
  preparedBy?: string;

  @IsString()
  @IsOptional()
  @IsIn(["draft", "generated", "approved", "rejected"])
  status?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDTO)
  @IsOptional()
  lineItems?: LineItemDTO[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalLanded?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalCustomer?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  wharfageBankFeePct?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  wharfageBankFeeAmount?: number;

  @IsString()
  @IsOptional()
  number?: string;

  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @IsNumber()
  @IsOptional()
  @Min(0)
  inputTokens?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  outputTokens?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalTokens?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedCost?: number;

  @IsString()
  @IsOptional()
  aiModel?: string;
}

export class PricingEstimateUpdateDTO extends PartialType(
  PricingEstimateCreateDTO
) {
  @IsString()
  @IsNotEmpty()
  _id!: string;
}
