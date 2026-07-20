import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../../system";

/** DTO for creating a new medical precaution record */
export class MedicalPrecautionDTO {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsOptional() description?: string;
  @IsBoolean() @IsOptional() @Transform(toBoolean) active?: boolean;
}
/** DTO for updating an existing medical precaution record */
export class UpdateMedicalPrecautionDTO extends PartialType(
  MedicalPrecautionDTO,
) {
  @IsMongoId() _id!: string;
}
