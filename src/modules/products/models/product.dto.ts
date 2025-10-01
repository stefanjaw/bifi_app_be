import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from "class-validator";
import { plainToInstance, Transform, Type } from "class-transformer";
import { PartialType } from "../../../system";
import { Types } from "mongoose";
import { FileUpload } from "../../../system/libraries/file-storage/file-upload.types";
import { ContactDTO } from "../../contacts/models/contact.dto";
import { ProductTypeDTO } from "../../product-types/models/product-type.dto";

export class makeInformationDTO extends ContactDTO {
  @IsMongoId()
  @IsOptional()
  _id?: string;
}

export class productTypeInformationDTO extends ProductTypeDTO {
  @IsMongoId()
  @IsOptional()
  _id?: string;
}

export class ProductDTO {
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @Transform(({ value }) => JSON.parse(value))
  @IsOptional()
  productTypeIds?: string[];

  // when productTypeInformation is passed, creation or update of product types will be done
  @Transform(({ value }) =>
    plainToInstance(productTypeInformationDTO, JSON.parse(value))
  )
  @Type(() => productTypeInformationDTO)
  @ValidateNested()
  @IsOptional()
  productTypeInformation?: productTypeInformationDTO;

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
  @IsOptional()
  makeIds?: string[];

  // when makeInformation is passed, creation or update of makes will be done
  @Transform(({ value }) =>
    plainToInstance(makeInformationDTO, JSON.parse(value))
  )
  @Type(() => makeInformationDTO)
  @ValidateNested()
  @IsOptional()
  makeInformation?: makeInformationDTO;

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

  @IsOptional()
  attachments?: FileUpload;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  @Transform(({ value }) => JSON.parse(value))
  attachmentsMetadata?: object[];
}
