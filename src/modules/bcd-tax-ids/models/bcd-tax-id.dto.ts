import { Type } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import { PartialType } from "../../../system";

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
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateBCDTaxIdDTO extends PartialType(BCDTaxIdDTO) {
  @IsMongoId()
  _id!: string;
}
