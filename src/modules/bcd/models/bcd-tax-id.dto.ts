import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class BCDTaxIdDTO {
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

export class UpdateBCDTaxIdDTO extends PartialType(BCDTaxIdDTO) {
  @IsMongoId()
  _id!: string;
}
