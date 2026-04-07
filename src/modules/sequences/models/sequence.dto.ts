import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";
import { Transform, Type } from "class-transformer";

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
  @Transform(toBoolean)
  nogap!: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateSequenceDTO extends PartialType(SequenceDTO) {
  @IsMongoId()
  _id!: string;
}
