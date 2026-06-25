import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class BCDAdditionalInformationTypeDTO {
  @IsString()
  @Length(1)
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateBCDAdditionalInformationTypeDTO extends PartialType(
  BCDAdditionalInformationTypeDTO
) {
  @IsMongoId()
  _id!: string;
}
