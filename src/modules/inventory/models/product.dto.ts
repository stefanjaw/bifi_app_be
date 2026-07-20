import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";
import { FileUpload } from "../../../system/libraries/file-storage/file-upload.types";

/** DTO for creating a new inventory product */
export class ProductDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  sku!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  costPrice?: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  salePrice?: number;

  @IsMongoId()
  @IsOptional()
  unitOfMeasureId?: string;

  @IsMongoId()
  @IsOptional()
  productTypeId?: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return value ?? [];
  })
  defaultSaleTaxIds?: string[];

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return value ?? [];
  })
  defaultPurchaseTaxIds?: string[];

  @IsString()
  @IsOptional()
  codigoComercial?: string;

  @IsEnum(["consumable", "service", "storable"])
  @IsOptional()
  productKind?: string;

  @IsString()
  @IsOptional()
  crPartidaArancelaria?: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  clStrengths?: string[];

  @IsArray()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  clRouteIds?: string[];

  @IsArray()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  clFrequencyIds?: string[];

  @IsArray()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  clContactIds?: string[];

  @IsBoolean()
  @Transform(toBoolean)
  @IsOptional()
  active?: boolean;

  @IsOptional()
  photo?: FileUpload;

  @IsOptional()
  attachments?: FileUpload;
}

/** DTO for updating an existing inventory product */
export class UpdateProductDTO extends PartialType(ProductDTO) {
  @IsMongoId()
  _id!: string;
}
