import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class BCDTypeDTO {
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

export class UpdateBCDTypeDTO extends PartialType(BCDTypeDTO) {
  @IsMongoId()
  _id!: string;
}
