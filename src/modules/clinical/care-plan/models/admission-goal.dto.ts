import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../../system";

/** DTO for creating a new admission goal */
export class AdmissionGoalDTO {
  @IsMongoId()
  @IsOptional()
  careContinuumId?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  tracking?: string;

  @IsMongoId()
  @IsOptional()
  patientId?: string;

  @IsArray()
  @IsOptional()
  interventions?: string[];

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  archived?: boolean;

  @IsString()
  @IsNotEmpty()
  contentTitle!: string;

  @IsString()
  @IsNotEmpty()
  contentBody!: string;

  @IsNumber()
  @IsOptional()
  @IsEnum([0, 1, 2, 3, 4])
  priority?: number;

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

/** DTO for updating an existing admission goal */
export class UpdateAdmissionGoalDTO extends PartialType(AdmissionGoalDTO) {
  @IsMongoId()
  _id!: string;
}
