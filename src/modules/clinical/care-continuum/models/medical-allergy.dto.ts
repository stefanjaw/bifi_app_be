import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../../system";

/** DTO for creating a new medical allergy record */
export class MedicalAllergyDTO {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() acronym!: string;
  @IsString() @IsOptional() description?: string;
  @IsBoolean() @IsOptional() @Transform(toBoolean) active?: boolean;
}
/** DTO for updating an existing medical allergy record */
export class UpdateMedicalAllergyDTO extends PartialType(MedicalAllergyDTO) {
  @IsMongoId() _id!: string;
}
