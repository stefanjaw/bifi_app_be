import { plainToInstance, Transform, Type } from "class-transformer";
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

/** DTO for a file-with-description attached to a staff record */
export class FileDescriptionDTO {
  @IsOptional()
  fileId?: FileUpload;

  @IsString()
  @IsOptional()
  description?: string;
}

/** DTO for creating a new staff record */
export class StaffDTO {
  @IsMongoId()
  @IsNotEmpty()
  contactId!: string;

  @IsEnum(["Employee", "Contractor"])
  engagementType!: "Employee" | "Contractor";

  @IsEnum(["Nurse", "Caregiver", "Manager", "Other"])
  position!: "Nurse" | "Caregiver" | "Manager" | "Other";

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  startDate!: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  workPermitRequired?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileDescriptionDTO)
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  workPermitDocuments?: FileDescriptionDTO[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileDescriptionDTO)
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  engagementAgreement?: FileDescriptionDTO[];

  @IsString()
  @IsNotEmpty()
  personnelId!: string;

  @IsString()
  @IsNotEmpty()
  department!: string;

  @IsEnum(["Registered Nurse", "MD", "LPN", "Other"])
  @IsOptional()
  licenseCertificationType?: "Registered Nurse" | "MD" | "LPN" | "Other";

  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  licenseExpirationDate?: Date;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  credentials?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FileDescriptionDTO)
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  credentialDocuments?: FileDescriptionDTO[];

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

/** DTO for updating an existing staff record */
export class UpdateStaffDTO extends PartialType(StaffDTO) {
  @IsMongoId()
  _id!: string;
}
