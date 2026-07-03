import { plainToInstance, Transform, Type } from "class-transformer";
import {
  IsArray,
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
  @IsOptional()
  total?: number;

  @IsArray()
  @IsString({ each: true })
  @IsMongoId({ each: true })
  @IsOptional()
  @Transform(({ value }) => value ?? [])
  taxIds?: string[];

  @IsMongoId()
  @IsOptional()
  discountId?: string;
}

export class PurchaseOrderDTO {
  @IsMongoId()
  contactId!: string;

  @IsEnum([
    "draft",
    "confirmed",
    "sent",
    "partially_received",
    "received",
    "cancelled",
  ])
  @IsOptional()
  status?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  issueDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expectedDeliveryDate?: Date;

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
  @IsOptional()
  notes?: string;

  @IsMongoId()
  @IsOptional()
  @Transform(({ value }) => value ?? undefined)
  stageId?: string;
}

export class UpdatePurchaseOrderDTO extends PartialType(PurchaseOrderDTO) {
  @IsMongoId()
  _id!: string;
}

export class UpdatePurchaseOrderStatusDTO {
  @IsEnum([
    "draft",
    "confirmed",
    "sent",
    "partially_received",
    "received",
    "cancelled",
  ])
  status!: string;
}
