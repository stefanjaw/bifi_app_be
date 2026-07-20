import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform } from "class-transformer";
import { PartialType, toBoolean } from "../../../../system";

/** DTO for creating a new gender entry */
export class GenderDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

/** DTO for updating an existing gender entry */
export class UpdateGenderDTO extends PartialType(GenderDTO) {
  @IsMongoId()
  _id!: string;
}
