import { ProductDocument } from "@mongodb-types";
import { CSVStringSeparator } from "../../../system";
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from "class-validator";
import { Type } from "class-transformer";

export class ProductCSVDTO {
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

  @IsEnum(["excellent", "good", "fair", "poor"])
  @IsOptional()
  condition?: ProductDocument["condition"];

  @IsString()
  @IsNotEmpty()
  productTypes!: CSVStringSeparator;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  vendors?: CSVStringSeparator;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  makes?: CSVStringSeparator;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  warrantyDate?: Date;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}
