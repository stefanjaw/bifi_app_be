import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
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
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { plainToInstance, Transform, Type } from "class-transformer";
import { PartialType } from "../../../system";
import { Types } from "mongoose";
import { FileUpload } from "../../../system/libraries/file-storage/file-upload.types";
import { ContactDTO } from "../../contacts/models/contact.dto";
import { AssetTypeDTO } from "./asset-type.dto";

export class makeInformationDTO extends ContactDTO {
  @IsMongoId()
  @IsOptional()
  _id?: string;
}

export class assetTypeInformationDTO extends AssetTypeDTO {
  @IsMongoId()
  @IsOptional()
  _id?: string;
}

export class LocationAssignmentDTO {
  @IsMongoId()
  @IsNotEmpty()
  locationId!: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  assignedQuantity!: number;
}

export class SoftwareConfigurationDTO {
  @IsEnum(["os-middleware", "simd", "samd"])
  @ValidateIf((_, v) => v !== undefined && v !== null && v !== "")
  @IsOptional()
  regulatoryClassification?: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((_, v) => v !== undefined && v !== null && v !== "")
  @IsOptional()
  version?: string;

  @IsMongoId()
  @IsOptional()
  parentAssetId?: string;

  @IsString()
  @IsOptional()
  udiDi?: string;

  @IsEnum(["class-i", "class-ii", "class-iii"])
  @IsOptional()
  fdaMdrClass?: string;

  @IsEnum(["perpetual", "subscription-saas"])
  @ValidateIf((_, v) => v !== undefined && v !== null && v !== "")
  @IsOptional()
  licenseType?: string;

  @IsString()
  @IsOptional()
  licenseKey?: string;

  @IsBoolean()
  @IsOptional()
  preventAutoUpdate?: boolean;
}

export class AssetRosterDTO {
  @IsEnum(["serialized", "non-serialized", "software"])
  @IsOptional()
  deviceType?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  @IsOptional()
  assetTypeIds?: string[];

  @Transform(({ value }) =>
    plainToInstance(
      assetTypeInformationDTO,
      typeof value === "string" ? JSON.parse(value) : value,
    ),
  )
  @Type(() => assetTypeInformationDTO)
  @ValidateNested()
  @IsOptional()
  assetTypeInformation?: assetTypeInformationDTO;

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  @IsOptional()
  vendorIds?: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  @IsOptional()
  makeIds?: string[];

  @Transform(({ value }) =>
    plainToInstance(
      makeInformationDTO,
      typeof value === "string" ? JSON.parse(value) : value,
    ),
  )
  @Type(() => makeInformationDTO)
  @ValidateNested()
  @IsOptional()
  makeInformation?: makeInformationDTO;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => !o.deviceType || o.deviceType === "serialized")
  productModel?: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => !o.deviceType || o.deviceType === "serialized")
  serialNumber?: string;

  @IsString()
  @IsNotEmpty()
  @ValidateIf(
    (o) => o.deviceType === "non-serialized" || o.deviceType === "software",
  )
  description?: string;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  quantity?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationAssignmentDTO)
  @Transform(({ value }) => {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed.map((la: any) => plainToInstance(LocationAssignmentDTO, la));
  })
  locationAssignments?: LocationAssignmentDTO[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SoftwareConfigurationDTO)
  @Transform(({ value }) =>
    plainToInstance(
      SoftwareConfigurationDTO,
      typeof value === "string" ? JSON.parse(value) : value,
    ),
  )
  softwareConfiguration?: SoftwareConfigurationDTO;

  @IsIn(["excellent", "good", "fair", "poor"])
  @IsOptional()
  condition?: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
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

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  supportEndDate?: Date;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotesDTO)
  @Transform(({ value }) => {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed.map((note: any) => plainToInstance(NotesDTO, note));
  })
  remarks?: NotesDTO[];

  @IsEnum([
    "active",
    "awaiting-commissioning",
    "under-service",
    "decommissioned",
  ])
  @IsOptional()
  status?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  maintenanceDate?: Date;

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

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  yearsOfUse?: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  depreciationCalculator?: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  depreciationValue?: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsOptional()
  totalCostOfOwnership?: number;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  commissionedDate?: Date;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  estimatedEconomicLifeYears?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  salvageValue?: number;

  @IsEnum(["straight-line", "accelerated-declining-balance"])
  @IsOptional()
  depreciationMethod?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  accelerationFactor?: number;

  @IsOptional()
  active?: boolean;
}

export class UpdateAssetRosterDTO extends PartialType(AssetRosterDTO) {
  @IsMongoId()
  _id!: string | Types.ObjectId;

  @IsOptional()
  attachments?: FileUpload;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  attachmentsMetadata?: object[];
}

export class SkipAssetRosterPMDTO {
  @IsMongoId()
  _id!: string;

  @IsOptional()
  @IsString()
  notes!: string;
}

export class NotesDTO {
  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsMongoId()
  createdBy?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  performDate?: Date;
}
