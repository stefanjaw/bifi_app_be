import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { PartialType } from "../../../system";
import { Types } from "mongoose";

export class ProductDTO {
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @Transform(({ value }) => JSON.parse(value))
  productTypeIds!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @Transform(({ value }) => JSON.parse(value))
  @IsOptional()
  vendorIds?: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @Transform(({ value }) => JSON.parse(value))
  makeIds!: string[];

  @IsString()
  @IsNotEmpty()
  productModel!: string;

  @IsString()
  @IsNotEmpty()
  serialNumber!: string;

  @IsDate()
  @Type(() => Date)
  acquiredDate!: Date;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  acquiredPrice?: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  currentPrice?: number;

  @IsIn(["excellent", "good", "fair", "poor"])
  @IsOptional()
  condition?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  maintenanceWindowIds?: string[];

  @IsOptional()
  photo?: unknown;

  @IsMongoId()
  @IsOptional()
  locationId?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  warrantyDate?: Date;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  remarks?: string | undefined;

  @IsEnum(["active", "awaiting-comissioning", "under-service", "decomissioned"])
  @IsOptional()
  status?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  maintenanceDate?: Date;

  @IsOptional()
  active?: boolean;
}

export class UpdateProductDTO extends PartialType(ProductDTO) {
  @IsMongoId()
  _id!: string | Types.ObjectId;
}
