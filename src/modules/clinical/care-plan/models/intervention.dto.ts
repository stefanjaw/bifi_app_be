import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../../system";

/** DTO for creating a new intervention */
export class InterventionDTO {
  @IsMongoId()
  @IsNotEmpty()
  admissionGoalId!: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsMongoId()
  @IsNotEmpty()
  patientId!: string;

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

  @IsArray()
  @IsOptional()
  outcomes?: string[];

  @IsArray()
  @IsOptional()
  orderSetIds?: string[];

  @IsArray()
  @IsOptional()
  orderIds?: string[];

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

/** DTO for updating an existing intervention */
export class UpdateInterventionDTO extends PartialType(InterventionDTO) {
  @IsMongoId()
  _id!: string;
}
