import { plainToInstance, Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  Length,
  ValidateNested,
  IsEnum,
  ValidateIf,
  Min,
  Max,
  IsObject,
  IsNumberString,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class BCDCpcTaxDTO {
  @IsMongoId()
  taxType!: string;

  @IsMongoId()
  taxId!: string;
}

export class BCDCpcDutyRateDTO {
  @IsString()
  @IsEnum(["SPECIFICATION", "MULTIPLIER"])
  type!: "SPECIFICATION" | "MULTIPLIER";

  @Transform(({ value }) =>
    typeof value === "string" && value.trim() !== "" && !isNaN(Number(value))
      ? Number(value)
      : value,
  )
  @ValidateIf(
    (_, value) => typeof value === "number" || _.type === "MULTIPLIER",
  )
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  @ValidateIf(
    (_, value) => typeof value === "string" || _.type === "SPECIFICATION",
  )
  @IsString()
  value!: number | string;
}

export class BCDCpcDTO {
  @IsNumberString()
  @Length(4)
  code!: string;

  @IsString()
  description!: string;

  @IsArray()
  @IsOptional()
  @IsMongoId({ each: true })
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  bcdTypes?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BCDCpcTaxDTO)
  @IsOptional()
  @Transform(({ value }) =>
    (typeof value === "string" ? JSON.parse(value) : value).map((tax: any) => plainToInstance(BCDCpcTaxDTO, tax)),
  )
  tax?: BCDCpcTaxDTO[];

  @ValidateNested()
  @IsObject()
  @Type(() => BCDCpcDutyRateDTO)
  @Transform(({ value }) =>
    plainToInstance(BCDCpcDutyRateDTO, typeof value === "string" ? JSON.parse(value) : value),
  )
  @IsOptional()
  dutyRate?: BCDCpcDutyRateDTO;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateBCDCpcDTO extends PartialType(BCDCpcDTO) {
  @IsMongoId()
  _id!: string;
}
