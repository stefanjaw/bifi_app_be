import { plainToInstance, Transform, Type } from "class-transformer";
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
  Min,
  ValidateNested,
} from "class-validator";
import { PartialType } from "../../../system";

class LineItemDTO {
  @IsMongoId()
  @IsOptional()
  productId?: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  quantity!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  unitPrice!: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  total!: number;
}

export class SalesOrderDTO {
  @IsMongoId()
  @IsOptional()
  crmId?: string;

  @IsMongoId()
  contact!: string;

  @IsMongoId()
  company!: string;

  @IsMongoId()
  @IsOptional()
  salesperson?: string;

  @IsMongoId()
  @IsOptional()
  stageId?: string;

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

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDTO)
  @Transform(({ value }) =>
    (typeof value === "string" ? JSON.parse(value) : value).map((item: any) =>
      plainToInstance(LineItemDTO, item),
    ),
  )
  @IsOptional()
  lineItems?: LineItemDTO[];

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => (value === "" ? null : value))
  notes?: string;
}

export class UpdateSalesOrderDTO extends PartialType(SalesOrderDTO) {
  @IsMongoId()
  _id!: string;
}
