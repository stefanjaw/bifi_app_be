import {
  IsBoolean,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";
import { Transform, Type } from "class-transformer";
import { PartialType, toBoolean } from "../../../system";

export class CustomsTariffDTO {
  @IsString()
  code!: string;

  @IsString()
  chapter!: string;

  @IsString()
  heading!: string;

  @IsString()
  subheading!: string;

  @IsString()
  description!: string;

  @IsString()
  @IsOptional()
  unitForDuty?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  quantity?: number;

  @IsString()
  @IsOptional()
  unitOfMeasurement?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  rateOfDuty?: number;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateCustomsTariffDTO extends PartialType(CustomsTariffDTO) {
  @IsMongoId()
  _id!: string;
}
