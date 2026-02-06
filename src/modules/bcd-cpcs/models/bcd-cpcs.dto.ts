import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  Length,
} from "class-validator";
import { PartialType } from "../../../system";

export class BCDCpcsDTO {
  @IsNumber()
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
  @IsOptional()
  @IsMongoId({ each: true })
  @Transform(({ value }) =>
    typeof value === "string" ? JSON.parse(value) : value,
  )
  tax?: string[];

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  active?: boolean;
}

export class UpdateBCDCpcsTO extends PartialType(BCDCpcsDTO) {
  @IsMongoId()
  _id!: string;
}
