import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../../system";

/** DTO for creating a new outcome */
export class OutcomeDTO {
  @IsMongoId()
  @IsNotEmpty()
  interventionId!: string;

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

/** DTO for updating an existing outcome */
export class UpdateOutcomeDTO extends PartialType(OutcomeDTO) {
  @IsMongoId()
  _id!: string;
}
