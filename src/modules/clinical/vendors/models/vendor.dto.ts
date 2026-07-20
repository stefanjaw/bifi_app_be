import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { PartialType, toBoolean } from "../../../../system";
import { FileUpload } from "../../../../system/libraries/file-storage/file-upload.types";

export class VendorFileDescriptionDTO {
  @IsOptional()
  fileId?: FileUpload;

  @IsString()
  @IsOptional()
  description?: string;
}

export class VendorDTO {
  @IsMongoId()
  @IsNotEmpty()
  contactId!: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  positionRoles!: string[];

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  startDate!: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorFileDescriptionDTO)
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  engagementAgreement?: VendorFileDescriptionDTO[];

  @IsString()
  @IsNotEmpty()
  vendorId!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  credentials?: string[];

  @IsEnum(["Prepared foods vendor"])
  @IsOptional()
  licenseCertificationType?: "Prepared foods vendor";

  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  licenseExpirationDate?: Date;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VendorFileDescriptionDTO)
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  credentialDocuments?: VendorFileDescriptionDTO[];

  @IsMongoId()
  @IsOptional()
  createdBy?: string;

  @IsMongoId()
  @IsOptional()
  updatedBy?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateVendorDTO extends PartialType(VendorDTO) {
  @IsMongoId()
  _id!: string;
}
