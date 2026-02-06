import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import { PartialType } from "../../../system";
import { BCDTransportOptionTypeEnum } from "./bcd-transport-option.types";

export class BCDTransportOptionDTO {
  @IsString()
  @Length(1, 3)
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(BCDTransportOptionTypeEnum)
  type!: BCDTransportOptionTypeEnum;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateBCDTransportOptionDTO extends PartialType(
  BCDTransportOptionDTO,
) {
  @IsMongoId()
  _id!: string;
}
