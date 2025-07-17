import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
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
  vendorIds!: string[];

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
  acquiredPrice!: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  currentPrice!: number;

  @IsIn(["excellent", "good", "fair", "poor"])
  condition!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @IsOptional()
  @Transform(({ value }) => JSON.parse(value))
  maintenanceWindowIds?: string[];

  // @IsOptional()
  // photo?: string;

  @IsMongoId()
  locationId!: string;

  @IsDate()
  @Type(() => Date)
  warrantyDate!: Date;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  remarks?: string | undefined;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateProductDTO extends PartialType(ProductDTO) {
  @IsMongoId()
  _id!: string;
}
