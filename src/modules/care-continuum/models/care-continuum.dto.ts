import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { PartialType, toBoolean } from "../../../system";

/** DTO for creating a new care continuum record */
export class CareContinuumDTO {
  @IsMongoId() @IsNotEmpty() patientId!: string;
  @IsEnum(["Transfer", "Care Update", "Discharge", "Admission"])
  @IsNotEmpty()
  typeOfEvent!: string;
  @IsMongoId() @IsOptional() careContinuumLevelId?: string;
  @IsEnum(["Draft", "Active", "Discharge"]) @IsOptional() state?: string;
  @IsMongoId() @IsOptional() transferPoint?: string;
  @IsMongoId() @IsOptional() assignedCaregiver?: string;
  @IsMongoId() @IsOptional() assignedNurse?: string;
  @IsMongoId() @IsOptional() unitId?: string;
  @IsMongoId() @IsOptional() bedId?: string;
  @IsMongoId() @IsOptional() roomId?: string;
  @IsString() @IsNotEmpty() insuranceCarrier!: string;
  @IsString() @IsOptional() planNumber?: string;
  @IsString() @IsOptional() groupNumber?: string;
  @IsString() @IsNotEmpty() policyNumber!: string;
  @IsString() @IsOptional() memberId?: string;
  @IsDate() @IsOptional() @Type(() => Date) effectiveDate?: Date;
  @IsDate() @IsNotEmpty() @Type(() => Date) endDate!: Date;
  @IsMongoId() @IsOptional() genderAtBirth?: string;
  @IsMongoId() @IsOptional() genderAtPresent?: string;
  @IsMongoId() @IsOptional() race?: string;
  @IsNumber() @IsOptional() @Type(() => Number) height?: number;
  @IsNumber() @IsOptional() @Type(() => Number) weight?: number;
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  socialHistory?: any[];
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  familyHistory?: any[];
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  medicalHistory?: any[];
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  surgicalHistory?: any[];
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  medications?: any[];
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  allergies?: any[];
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  immunizations?: any[];
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  precautions?: any[];
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  healthCareProxy?: any;
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  externalProviders?: any[];
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  advanceDirectives?: any[];
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  extraFields?: Record<string, any>;
  @IsBoolean() @IsOptional() @Transform(toBoolean) active?: boolean;
}
/** DTO for updating an existing care continuum record */
export class UpdateCareContinuumDTO extends PartialType(CareContinuumDTO) {
  @IsMongoId() _id!: string;
}
