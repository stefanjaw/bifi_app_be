import { Type } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import { PartialType } from "../../../system";

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
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateBCDAdditionalInformationTypeDTO extends PartialType(
  BCDAdditionalInformationTypeDTO,
) {
  @IsMongoId()
  _id!: string;
}
