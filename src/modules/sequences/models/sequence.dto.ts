import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { PartialType } from "../../../system";
import { Type } from "class-transformer";

export class SequenceDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  prefix!: string;

  @IsString()
  @IsOptional()
  suffix?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  number!: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  step!: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  size!: number;

  @IsBoolean()
  @Type(() => Boolean)
  nogap!: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateSequenceDTO extends PartialType(SequenceDTO) {
  @IsMongoId()
  _id!: string;
}
