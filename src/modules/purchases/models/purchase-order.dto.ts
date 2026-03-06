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

export class LineItemDTO {
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

export class PurchaseOrderDTO {
  @IsMongoId()
  contactId!: string;

  @IsEnum(["draft", "sent", "partially_received", "received", "cancelled"])
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
      plainToInstance(LineItemDTO, item)
    )
  )
  @IsOptional()
  lineItems?: LineItemDTO[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsMongoId()
  @IsOptional()
  stageId?: string;
}

export class UpdatePurchaseOrderDTO extends PartialType(PurchaseOrderDTO) {
  @IsMongoId()
  _id!: string;
}

export class UpdatePurchaseOrderStatusDTO {
  @IsMongoId()
  _id!: string;

  @IsEnum(["draft", "sent", "partially_received", "received", "cancelled"])
  status!: string;
}
