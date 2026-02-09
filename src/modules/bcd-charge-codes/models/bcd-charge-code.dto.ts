import { Type } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  IsNumberString,
  IsEnum,
} from "class-validator";
import { PartialType } from "../../../system";
import { BCDChargeCodeTypeEnum } from "./bcd-charge-code-enums";

export class BCDChargeCodeDTO {
  @IsNumberString()
  @Length(3)
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(BCDChargeCodeTypeEnum)
  type!: BCDChargeCodeTypeEnum;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateBCDChargeCodeDTO extends PartialType(BCDChargeCodeDTO) {
  @IsMongoId()
  _id!: string;
}
