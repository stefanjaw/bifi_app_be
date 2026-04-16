import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsDate,
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

  @IsMongoId()
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
  @IsOptional()
  company!: string;

  @IsMongoId()
  @IsOptional()
  owner?: string;

  @IsMongoId()
  @IsOptional()
  salesperson?: string;

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => typeof value === "string" ? JSON.parse(value) : value)
  @IsOptional()
  tags?: string[];

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
