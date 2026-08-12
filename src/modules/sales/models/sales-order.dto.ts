import { plainToInstance, Transform, Type } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export const SALES_ORDER_STATUSES = [
  "draft",
  "quote",
  "confirmed",
  "shipped",
  "completed",
  "cancelled",
] as const;

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
  @IsOptional()
  total?: number;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  @Transform(({ value }) => value ?? [])
  taxIds?: string[];

  @IsMongoId()
  @IsOptional()
  discountId?: string;
}

export class AppliedTaxDTO {
  @IsMongoId()
  taxId!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  amount?: number;
}

export class UpdateSalesOrderStatusDTO {
  @IsEnum(SALES_ORDER_STATUSES)
  status!: string;
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
  warehouseId?: string;

  @IsMongoId()
  @IsOptional()
  locationId?: string;

  @IsMongoId()
  @IsOptional()
  stageId?: string;

  @IsEnum(SALES_ORDER_STATUSES)
  @IsOptional()
  status?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  amount?: number;

  @IsMongoId()
  @IsNotEmpty()
  currency!: string;

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
  title?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => (value === "" ? null : value))
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AppliedTaxDTO)
  @ArrayUnique((t: AppliedTaxDTO) => t.taxId)
  @IsOptional()
  taxes?: AppliedTaxDTO[];

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  subtotal?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  taxTotal?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  grandTotal?: number;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateSalesOrderDTO extends PartialType(SalesOrderDTO) {
  @IsMongoId()
  _id!: string;
}
