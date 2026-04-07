import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  IsNumberString,
  IsNumber,
  Max,
  Min,
} from "class-validator";
import { PartialType, toBoolean } from "../../../system";

export class BCDPortDTO {
  @IsNumberString()
  @Length(3)
  code!: string;

  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  wharfageRate!: number;

  @IsBoolean()
  @IsOptional()
  @Transform(toBoolean)
  active?: boolean;
}

export class UpdateBCDPortDTO extends PartialType(BCDPortDTO) {
  @IsMongoId()
  _id!: string;
}
