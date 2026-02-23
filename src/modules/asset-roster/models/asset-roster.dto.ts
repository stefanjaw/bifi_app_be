import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsIn,
  isMongoId,
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
import { AssetTypeDTO } from "../../asset-types/models/asset-type.dto";
import { User } from "@mongodb-types";

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

export class AssetRosterDTO {
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  @Transform(({ value }) => JSON.parse(value))
  @IsOptional()
  assetTypeIds?: string[];

  // when assetTypeInformation is passed, creation or update of asset types will be done
  @Transform(({ value }) =>
    plainToInstance(assetTypeInformationDTO, JSON.parse(value)),
  )
  @Type(() => assetTypeInformationDTO)
  @ValidateNested()
  @IsOptional()
  assetTypeInformation?: assetTypeInformationDTO;

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
    plainToInstance(makeInformationDTO, JSON.parse(value)),
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
  @Transform(({ value }) => JSON.parse(value))
  attachmentsMetadata?: object[];
}

export class SkipAssetRosterPMDTO {
  @IsMongoId()
  _id!: string;

  @IsOptional()
  @IsString()
  notes!: string;
}

//model for the notes
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
