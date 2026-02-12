import { plainToInstance, Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  IsNumberString,
  IsEnum,
  IsArray,
  ValidateNested,
} from "class-validator";
import { PartialType } from "../../../system";
import {
  BCDChargeCodeLevelEnum,
  BCDChargeCodeTypeEnum,
} from "./bcd-charge-code-enums";

export class BCDChargeCodeImpactDTO {
  @IsBoolean()
  @Type(() => Boolean)
  customsValue!: boolean;

  @IsBoolean()
  @Type(() => Boolean)
  payable!: boolean;
}

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

  @IsArray()
  @IsEnum(BCDChargeCodeLevelEnum, { each: true })
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  levels!: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => BCDChargeCodeImpactDTO)
  @Transform(({ value }) =>
    plainToInstance(BCDChargeCodeImpactDTO, JSON.parse(value)),
  )
  impact?: BCDChargeCodeImpactDTO;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateBCDChargeCodeDTO extends PartialType(BCDChargeCodeDTO) {
  @IsMongoId()
  _id!: string;
}
