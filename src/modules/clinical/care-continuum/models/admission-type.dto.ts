import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../../system";

/** DTO for creating a new admission type record */
export class AdmissionTypeDTO {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsOptional() description?: string;
  @IsBoolean() @IsOptional() @Transform(toBoolean) active?: boolean;
}
/** DTO for updating an existing admission type record */
export class UpdateAdmissionTypeDTO extends PartialType(AdmissionTypeDTO) {
  @IsMongoId() _id!: string;
}
