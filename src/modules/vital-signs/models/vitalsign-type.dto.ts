import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

/** DTO for a vital sign range definition */
export class VitalSignRangeDTO {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  min?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  max?: number;
}

/** DTO for creating a new vital sign type */
export class VitalSignTypeDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsString()
  @IsNotEmpty()
  unit!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VitalSignRangeDTO)
  @IsOptional()
  ranges?: VitalSignRangeDTO[];

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

/** DTO for updating an existing vital sign type */
export class UpdateVitalSignTypeDTO extends PartialType(VitalSignTypeDTO) {
  @IsString()
  _id!: string;
}
