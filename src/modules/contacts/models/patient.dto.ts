import {
  IsBoolean,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { PartialType, toBoolean } from "../../../system";

/** DTO for creating a new patient record */
export class PatientDTO {
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  dob!: Date;

  @IsMongoId()
  @IsNotEmpty()
  contactId!: string;

  @IsMongoId()
  @IsOptional()
  maritalStatus?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

/** DTO for updating an existing patient record */
export class UpdatePatientDTO extends PartialType(PatientDTO) {
  @IsMongoId()
  _id!: string;
}
