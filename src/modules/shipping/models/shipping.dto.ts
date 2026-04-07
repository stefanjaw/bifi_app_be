import { plainToInstance, Transform, Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { InvoiceDTO } from "./invoice.dto";
import { ShippingStage, ShippingStatus } from "./shipping.model";
import { PartialType, toBoolean } from "../../../system";

export class ShippingDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsMongoId()
  origin!: string;

  @IsMongoId()
  destination!: string;

  @IsEnum(ShippingStatus)
  status!: ShippingStatus;

  @IsEnum(ShippingStage)
  stage!: ShippingStage;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => InvoiceDTO)
  @Transform(({ value }) => {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed.map((invoice: any) => plainToInstance(InvoiceDTO, invoice));
  })
  invoices?: InvoiceDTO[];

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateShippingDTO extends PartialType(ShippingDTO) {
  @IsMongoId()
  _id!: string;
}
